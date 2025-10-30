// services/battleService.ts
import { BattleState, PlayerState } from "@repo/sharedtypes/types";
import { v4 as uuidv4 } from "uuid";

const BATTLES_DB: BattleState[] = []; // in-memory, can persist to Redis/DB

export const battleService = {
  joinOrCreateBattle: async (wallet: string, playerData: PlayerState): Promise<BattleState> => {
    // Try to find a battle waiting for a second player
    const waitingBattle = BATTLES_DB.find(
      (b) => !b.player2.wallet && b.player1.wallet !== wallet
    );

    if (waitingBattle) {
      // Join the waiting battle
      waitingBattle.player2 = playerData;
      waitingBattle.turnOwner = waitingBattle.player1.wallet; // first turn
      waitingBattle.updatedAt = Date.now();
      return waitingBattle;
    }

    // No waiting battle → create new
    const newBattle: BattleState = {
      battleId: uuidv4(),
      player1: playerData,
      player2: { wallet: "", deck: [], activeCard: null as any }, // placeholder
      turnNumber: 1,
      turnOwner: playerData.wallet,
      battleLog: [],
      isFinished: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    BATTLES_DB.push(newBattle);
    return newBattle;
  }
};
