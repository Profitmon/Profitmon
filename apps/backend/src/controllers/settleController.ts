// src/controllers/settleController.ts
import { Request, Response } from "express";
import { redis } from "../libs/redis";
import { Connection, PublicKey } from "@solana/web3.js";

const LAMPORTS_PER_SOL = 1_000_000_000;

// Request body expected from winner (who received both keys from WS):
/*
{
  battleId,
  winnerWallet,
  winnerKey,    // k2 from winner
  loserKey      // k2 from loser (received by winner via WS)
}
*/
export const settleBattle = async (req: Request, res: Response) => {
  try {
    const { battleId, winnerWallet, winnerKey, loserKey } = req.body;
    if (!battleId || !winnerWallet || !winnerKey || !loserKey) {
      return res.status(400).json({ success: false, message: "battleId, winnerWallet, winnerKey, loserKey required" });
    }

    // Load battle state
    const raw = await redis.get(`battle:${battleId}`);
    if (!raw) return res.status(404).json({ success: false, message: "battle not found" });
    const state = JSON.parse(raw);
    const p1 = state.player1;
    const p2 = state.player2;

    // verify winner belongs to match
    if (winnerWallet !== p1.wallet && winnerWallet !== p2.wallet) {
      return res.status(400).json({ success: false, message: "winner not in this battle" });
    }

    // verify keys in Redis: ensure both keys match stored entries and not used
    const rawWinnerKey = await redis.get(`battlekey:${winnerKey}`);
    const rawLoserKey = await redis.get(`battlekey:${loserKey}`);
    if (!rawWinnerKey || !rawLoserKey) {
      return res.status(400).json({ success: false, message: "invalid or expired keys" });
    }
    const wEntry = JSON.parse(rawWinnerKey);
    const lEntry = JSON.parse(rawLoserKey);

    // ensure they map to the expected wallets
    if (wEntry.wallet !== winnerWallet) {
      return res.status(400).json({ success: false, message: "winnerKey doesn't match winner wallet" });
    }
    // loser wallet is the other player
    const loserWallet = (p1.wallet === winnerWallet) ? p2.wallet : p1.wallet;
    if (lEntry.wallet !== loserWallet) {
      return res.status(400).json({ success: false, message: "loserKey doesn't match loser wallet" });
    }

    // Ensure keys are not used
    if (wEntry.used || lEntry.used) {
      return res.status(400).json({ success: false, message: "one of the keys already used" });
    }

    // verify escrows on-chain (must be funded)
    const connection = new Connection(process.env.SOLANA_RPC ?? "https://api.devnet.solana.com");
    const winnerEscrow = new PublicKey(wEntry.escrowPda);
    const loserEscrow = new PublicKey(lEntry.escrowPda);

    const [winInfo, loseInfo] = await Promise.all([
      connection.getAccountInfo(winnerEscrow),
      connection.getAccountInfo(loserEscrow),
    ]);
    if (!winInfo || !loseInfo) {
      return res.status(400).json({ success: false, message: "one of the escrows does not exist" });
    }

    const stakeLamports = state.stake * LAMPORTS_PER_SOL;
    if (winInfo.lamports < stakeLamports || loseInfo.lamports < stakeLamports) {
      return res.status(400).json({ success: false, message: "one of the escrows underfunded" });
    }

    // mark keys used atomically (simple approach)
    await redis.set(`usedkey:${winnerKey}`, "1", "EX", 60*60);
    await redis.set(`usedkey:${loserKey}`, "1", "EX", 60*60);
    await redis.del(`battlekey:${winnerKey}`);
    await redis.del(`battlekey:${loserKey}`);
    // Optionally remove wallet index
    await redis.del(`walletkey:${wEntry.wallet}`);
    await redis.del(`walletkey:${lEntry.wallet}`);

    // CALL ON-CHAIN SETTLEMENT (stub here) — replace with your Anchor call:
    // - verify escrows are program-owned if your design requires
    // - transfer lamports from both escrows to winner and platform in one atomic tx
    // Example placeholder:
    // const tx = await callAnchorSettle({ battleId, winnerWallet, winnerEscrow, loserEscrow, stakeLamports });
    // For now, we return success and the required data for on-chain call.

    // After on-chain success, delete persisted battle state
    await redis.del(`battle:${battleId}`);

    return res.json({
      success: true,
      message: "Keys verified and settlement authorized. Replace this reply with your on-chain settlement call.",
      battleId,
      winner: winnerWallet,
      winnerEscrow: wEntry.escrowPda,
      loserEscrow: lEntry.escrowPda,
      stake: state.stake,
    });
  } catch (err: any) {
    console.error("settleBattle error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
