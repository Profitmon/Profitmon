// src/rooms/battleRoom.ts
import WebSocket from "ws";
import type { BattleState, MoveMessage, TurnResult, PlayerState } from "../types/battle.js";
import { BattleEngine } from "../services/battleEngine.js";
import { redis } from "../redis/index.js";
import { safeSend, serializeStateForPersistence } from "../helpers.js";

const BATTLE_KEY_PREFIX = "battle:";
const LOCK_PREFIX = "lock:battle:";
const LOCK_TTL_MS = 3000;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export class RoomLock {
  redisClient = redis;
  async acquire(key: string, ttl = LOCK_TTL_MS): Promise<string | null> {
    const val = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ok = await this.redisClient.set(key, val, "PX", ttl, "NX");
    return ok === "OK" ? val : null;
  }
  async release(key: string, val: string) {
    const lua = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      await this.redisClient.eval(lua, 1, key, val);
    } catch (e) {
      console.error("release lock error", e);
    }
  }
}

export class BattleRoom {
  public roomId: string;
  public state: BattleState;
  private clients: Map<string, WebSocket> = new Map();
  private engine = BattleEngine;
  private lock = new RoomLock();

  constructor(roomId: string, initialState: BattleState) {
    this.roomId = roomId;
    this.state = initialState;
  }

  public addClient(wallet: string, ws: WebSocket): { ok: boolean; msg?: string } {
    if (!this.isPlayer(wallet)) return { ok: false, msg: "Not a participant" };
    if (this.clients.size >= 2 && !this.clients.has(wallet)) return { ok: false, msg: "Room is full" };

    this.clients.set(wallet, ws);

    // send initial persisted-light state
    safeSend(ws, { type: "battle_start", state: serializeStateForPersistence(this.state) });

    if (this.clients.size === 2) this.broadcast({ type: "battle_ready", battleId: this.roomId });
    return { ok: true };
  }

  public removeClient(wallet: string) {
    if (this.clients.has(wallet)) {
      this.clients.delete(wallet);
      console.log(`Removed ${wallet} from room ${this.roomId}`);
    }
  }

  private isPlayer(wallet: string) {
    return wallet === this.state.player1.wallet || wallet === this.state.player2.wallet;
  }

  public async handleMove(rawMove: MoveMessage) {
    const lockKey = LOCK_PREFIX + this.roomId;
    const lockVal = await this.lock.acquire(lockKey, LOCK_TTL_MS);
    if (!lockVal) {
      this.sendToPlayer(rawMove.playerWallet, { type: "error", message: "Server busy, retry" });
      return;
    }

    try {
      // validations
      if (!this.isPlayer(rawMove.playerWallet)) {
        this.sendToPlayer(rawMove.playerWallet, { type: "error", message: "Not a participant" });
        return;
      }
      if (this.clients.size < 2) {
        this.sendToPlayer(rawMove.playerWallet, { type: "error", message: "Waiting for opponent" });
        return;
      }
      if (rawMove.playerWallet !== this.state.turnOwner) {
        this.sendToPlayer(rawMove.playerWallet, { type: "error", message: "Not your turn" });
        return;
      }

      // apply move via engine (engine mutates state)
      const turnResult: TurnResult = BattleEngine.instance.applyMove(this.state, rawMove as any);

      // persist updated state
      await redis.set(BATTLE_KEY_PREFIX + this.roomId, JSON.stringify(serializeStateForPersistence(this.state)));

      // broadcast turn result
      this.broadcast({ type: "turn_result", ...turnResult });

      // if finished, handle end
      const winner = this.state.winner;
      if (winner) {
        await this.onBattleEnd(winner);
      }
    } catch (err: any) {
      console.error("handleMove error", err);
      this.sendToPlayer(rawMove.playerWallet, { type: "error", message: err.message ?? "Move error" });
    } finally {
      await this.lock.release(lockKey, lockVal);
    }
  }

  private async onBattleEnd(winner: string) {
    this.state.isFinished = true;
    this.state.winner = winner;
    // persist final state (keep a TTL so settlement has time)
    await redis.setex(BATTLE_KEY_PREFIX + this.roomId, 60 * 60, JSON.stringify(serializeStateForPersistence(this.state)));

    // notify players
    this.broadcast({ type: "battle_end", battleId: this.roomId, winner, battleLog: this.state.battleLog });

    // publish for settlement
    await redis.publish("battle:finished", JSON.stringify({ battleId: this.roomId, winner }));
  }

  private sendToPlayer(wallet: string, payload: any) {
    const ws = this.clients.get(wallet);
    if (ws && ws.readyState === WebSocket.OPEN) safeSend(ws, payload);
  }

  private broadcast(payload: any) {
    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) safeSend(ws, payload);
    }
  }
}
