// src/helpers.ts
import WebSocket from "ws";

/**
 * safeSend - send JSON if socket open and catch errors
 */
export function safeSend(ws: WebSocket, payload: any) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  } catch (err) {
    console.warn("safeSend failed:", err);
  }
}

/**
 * shallow copy of state for persistence - strips runtime-only fields
 * Keep persisted shape small and canonical.
 */
import type { BattleState } from "./types/battle.js";
export function serializeStateForPersistence(state: BattleState) {
  return {
    battleId: state.battleId,
    turnNumber: state.turnNumber,
    turnOwner: state.turnOwner,
    isFinished: state.isFinished ?? false,
    winner: state.winner ?? null,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    stake: state.stake ?? null,
    player1: {
      wallet: state.player1.wallet,
      activeCard: state.player1.activeCard.instanceId,
      deck: state.player1.deck.map((c) => ({ ...c, /* keep hp & instanceId & name */ })),
    },
    player2: {
      wallet: state.player2.wallet,
      activeCard: state.player2.activeCard.instanceId,
      deck: state.player2.deck.map((c) => ({ ...c })),
    },
    battleLog: state.battleLog ?? [],
  };
}
