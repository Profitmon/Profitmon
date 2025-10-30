// ws/battleServer.ts
import WebSocket, { WebSocketServer } from "ws";
import crypto from "crypto";
import axios from "axios";
import { redis } from "./redis/index.js";
import { BattleRoom } from "../src/rooms/battleRoom.js";
import { safeSend, serializeStateForPersistence } from "../src/helpers.js";

const PORT = Number(process.env.BATTLE_WS_PORT ?? 8081);
const SETTLEMENT_WEBHOOK_URL =
  process.env.SETTLEMENT_WEBHOOK_URL ?? "http://localhost:3000/api/battle/settle";

const wss = new WebSocketServer({ port: PORT });
console.log(`⚔️ Battle WS Server running at ws://0.0.0.0:${PORT}`);

// Queues based on stake (1 SOL, 2 SOL, 5 SOL)
const waiting: Record<number, Array<any>> = { 1: [], 2: [], 5: [] };

// Active battle rooms
const rooms = new Map<string, BattleRoom>();

// --------------------------
// 🔌 WebSocket Connections
// --------------------------
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.type) {
        // --------------------------
        // Player joins matchmaking
        // --------------------------
        case "join_battle": {
          const { wallet, battleKey, stake, pokemon } = data;
          if (!wallet || !battleKey || !stake || !pokemon) {
            return safeSend(ws, { type: "error", message: "Missing fields" });
          }

          // Verify key from Redis
          const rawKey = await redis.get(`battlekey:${battleKey}`);
          if (!rawKey) return safeSend(ws, { type: "error", message: "Invalid or expired key" });

          const keyEntry = JSON.parse(rawKey);
          if (keyEntry.wallet !== wallet || Number(keyEntry.stake) !== Number(stake)) {
            return safeSend(ws, { type: "error", message: "battleKey/wallet/stake mismatch" });
          }

          // Add player to waiting queue
          const stakeNum = Number(stake);
          if (!waiting[stakeNum]) waiting[stakeNum] = [];
          
          waiting[stakeNum].push({
            ws,
            wallet,
            battleKey,
            escrowPda: keyEntry.escrowPda,
            stake: stakeNum,
            pokemon,
            joinedAt: Date.now(),
          });
          

          (ws as any).__wallet = wallet;
          safeSend(ws, { type: "queued", stake, message: "Waiting for opponent..." });

          tryMatch(Number(stake));
          break;
        }

        // --------------------------
        // Player joins active battle room
        // --------------------------
        case "join_room": {
          const { battleId, wallet } = data;
          const room = rooms.get(battleId);
          if (!room) return safeSend(ws, { type: "error", message: "Room not found" });

          const r = room.addClient(wallet, ws);
          if (!r.ok) return safeSend(ws, { type: "error", message: r.msg ?? "Cannot join" });

          (ws as any).__battleId = battleId;
          (ws as any).__wallet = wallet;
          break;
        }

        // --------------------------
        // Player performs move
        // --------------------------
        case "move": {
          const { battleId, move } = data;
          const room = rooms.get(battleId);
          if (!room) return safeSend(ws, { type: "error", message: "Room not found" });

          await room.handleMove(move);
          break;
        }

        default:
          safeSend(ws, { type: "error", message: "Unknown message type" });
      }
    } catch (err: any) {
      console.error("WS message error:", err);
      safeSend(ws, { type: "error", message: err.message ?? "Invalid payload" });
    }
  });

  // --------------------------
  // Handle disconnection
  // --------------------------
  ws.on("close", () => {
    const battleId = (ws as any).__battleId;
    const wallet = (ws as any).__wallet;

    if (battleId && wallet) {
      const room = rooms.get(battleId);
      if (room) room.removeClient(wallet);
      console.log(`${wallet} disconnected from ${battleId}`);
    } else if (wallet) {
      // Remove from waiting queue if still queued
      [1, 2, 5].forEach((s) => {
        const queue = waiting[s];
        if (!Array.isArray(queue)) return;
      
        const idx = queue.findIndex((p) => p.wallet === wallet);
        if (idx >= 0) queue.splice(idx, 1);
      });
      
    }
  });
});

// --------------------------
// 🎮 Try to match two players
// --------------------------
async function tryMatch(stake: number) {

  if (!Array.isArray(waiting[stake]) || waiting[stake].length < 2) return;

  const q = waiting[stake];
  while (q.length >= 2) {
    const p1 = q.shift();
    const p2 = q.shift();
    if (!p1 || !p2) break;

    const battleId = crypto.randomUUID();
    

    const initialState = {
      battleId,
      turnNumber: 1,
      battleLog: [],
      isFinished: false,
      winner: undefined,
      turnOwner: p1.wallet,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stake,
      player1: {
        wallet: p1.wallet,
        deck: p1.pokemon.deck ?? [p1.pokemon.activeCard],
        activeCard: p1.pokemon.activeCard,
        battleKey: p1.battleKey,
        escrowPda: p1.escrowPda,
      },
      player2: {
        wallet: p2.wallet,
        deck: p2.pokemon.deck ?? [p2.pokemon.activeCard],
        activeCard: p2.pokemon.activeCard,
        battleKey: p2.battleKey,
        escrowPda: p2.escrowPda,
      },
    };

    const room = new BattleRoom(battleId, initialState);
    rooms.set(battleId, room);

    // Save to Redis (30 min expiry)
    await redis.setex(
      `battle:${battleId}`,
      60 * 30,
      JSON.stringify(serializeStateForPersistence(initialState))
    );

    // Notify both players
    safeSend(p1.ws, { type: "match_found", battleId, opponent: p2.wallet, stake });
    safeSend(p2.ws, { type: "match_found", battleId, opponent: p1.wallet, stake });

    console.log(`✅ Match found: ${p1.wallet} vs ${p2.wallet} (stake=${stake})`);
  }
}

// --------------------------
// 🏁 Handle Battle Finished Event
// --------------------------
(async () => {
  const IORedis = (await import("ioredis")).default;
  const sub = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");

  await sub.subscribe("battle:finished");

  sub.on("message", async (_chan: string, message: string) => {
    try {
      const { battleId, winner } = JSON.parse(message);
      console.log("🎯 Battle finished:", battleId, "Winner:", winner);

      const raw = await redis.get(`battle:${battleId}`);
      if (!raw) return console.warn("⚠️ No battle state found in Redis");

      const state = JSON.parse(raw);
      const p1 = state.player1;
      const p2 = state.player2;

      const winnerPlayer =
        p1.wallet === winner ? p1 : p2.wallet === winner ? p2 : null;
      const loserPlayer = winnerPlayer === p1 ? p2 : p1;

      if (!winnerPlayer) return console.error("❌ Invalid winner detected");

      // Notify winner to receive keys
      for (const client of wss.clients) {
        const meta: any = client;
        if (meta.__wallet === winner && client.readyState === WebSocket.OPEN) {
          safeSend(client, {
            type: "send_keys_to_winner",
            battleId,
            winner,
            keys: {
              winnerKey: winnerPlayer.battleKey,
              loserKey: loserPlayer.battleKey,
            },
            escrow: {
              winnerEscrow: winnerPlayer.escrowPda,
              loserEscrow: loserPlayer.escrowPda,
            },
            stake: state.stake,
          });
          break;
        }
      }

      // Notify both players about finish
      for (const client of wss.clients) {
        const meta: any = client;
        if (
          (meta.__wallet === p1.wallet || meta.__wallet === p2.wallet) &&
          client.readyState === WebSocket.OPEN
        ) {
          safeSend(client, { type: "battle_finished", battleId, winner });
        }
      }

      // Report settlement to backend using axios
      await axios.post(SETTLEMENT_WEBHOOK_URL, {
        battleId,
        winner,
        stake: state.stake,
        keys: {
          winnerKey: winnerPlayer.battleKey,
          loserKey: loserPlayer.battleKey,
        },
        escrow: {
          winnerEscrow: winnerPlayer.escrowPda,
          loserEscrow: loserPlayer.escrowPda,
        },
      });

      console.log("📨 Reported settlement to backend successfully.");
    } catch (err: any) {
      console.error("💥 Battle finished handler error:", err.message || err);
    }
  });
})();
