// Placeholder DB

import { Card, UserCard } from "@repo/sharedtypes/types";
import { dbService } from "./dbService"; // your DB helpers
import { publishCardOnChain } from "../solana/publishCardOnChain"; // chain publishing logic

// In-memory DB fallback
const USER_CARDS_DB: UserCard[] = [];

export const publishCardService = async (card: Card): Promise<Card> => {
  // 1️⃣ Validate required fields
  if (!card.name || !card.elementType || !card.baseHp || !card.skills?.length) {
    throw new Error("Missing required card fields");
  }

  // 2️⃣ Publish to blockchain
  const txSignature = await publishCardOnChain(card);
  if (!txSignature) {
    throw new Error("Failed to publish card on-chain");
  }

  // 3️⃣ Save to DB
  const savedCard = await dbService.saveCard(card);

  // 4️⃣ Optionally, track on-chain tx signature
  console.log(`Card published on-chain with tx=${txSignature}`);

  return savedCard;
};


export const cardService = {
  // Get all cards owned by a wallet
  getOwnedCards: async (wallet: string): Promise<UserCard[]> => {
    return USER_CARDS_DB.filter((c) => c.owner === wallet);
  },

  // Get a single owned card by wallet + instanceId
  getOwnedCardById: async (wallet: string, instanceId: string): Promise<UserCard | null> => {
    return USER_CARDS_DB.find((c) => c.owner === wallet && c.instanceId === instanceId) ?? null;
  },

  // Add a newly hatched card to user's collection
  addUserCard: async (card: UserCard): Promise<UserCard> => {
    USER_CARDS_DB.push(card);
    return card;
  },
};
