// src/controllers/stakeController.ts
import { Request, Response } from "express";
import { Connection, PublicKey } from "@solana/web3.js";
import { genBattleKey } from "../libs/keys";
import { redis } from "../libs/redis";

const LAMPORTS_PER_SOL = 1_000_000_000;

// Request: { wallet, escrowPda, stake } stake as number (1|2|5)
export const joinQueueAndGetKey = async (req: Request, res: Response) => {
  try {
    const { wallet, escrowPda, stake } = req.body;
    if (!wallet || !escrowPda || ![1,2,5].includes(Number(stake))) {
      return res.status(400).json({ success: false, message: "wallet, escrowPda, stake required (1|2|5)" });
    }

    // 1) Verify on-chain that escrow exists and has at least stake SOL
    const connection = new Connection(process.env.SOLANA_RPC ?? "https://api.devnet.solana.com");
    const info = await connection.getAccountInfo(new PublicKey(escrowPda));
    if (!info || info.lamports < Number(stake) * LAMPORTS_PER_SOL) {
      return res.status(400).json({ success: false, message: "Invalid or underfunded escrow" });
    }

    // 2) Create ephemeral battleKey (k2), store in Redis with TTL and with mapping to player
    const battleKey = genBattleKey();
    const keyEntry = {
      wallet,
      escrowPda,
      stake: Number(stake),
      createdAt: Date.now(),
      used: false
    };

    // store under key: battleKey -> JSON, TTL 30 minutes (1800s)
    await redis.setex(`battlekey:${battleKey}`, 60 * 30, JSON.stringify(keyEntry));

    // Also store an index for quick wallet lookup (optional)
    await redis.setex(`walletkey:${wallet}`, 60 * 30, battleKey);

    // 3) Return battleKey (k2) to client — client will provide this to WS when joining queue.
    return res.json({ success: true, battleKey, stake: Number(stake) });
  } catch (err: any) {
    console.error("joinQueueAndGetKey error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
