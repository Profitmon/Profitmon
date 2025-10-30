// services/eggService.ts
import { dbService } from "./dbService";
import { prisma } from "@repo/db/client";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { publishEggCardOnChain } from "../solana/publishEggCardOnChain";
import { adminKeypair } from "../config/admin";
import { Card } from "@repo/sharedtypes/types";

interface PayLoadType {
  wallet: string;
  eggId: string;
  cardIds: string[];
  ts: number;
}

interface adminPayloadType {
    wallet : string;
    eggId : string;
    cardIds : string[];
    ts : number;
} 

// Egg service
export const eggService = {
  // Get eggs that are available to hatch
  getAvailableEggs: async (wallet: string) => {
    return prisma.userEgg.findMany({ where: { owner: wallet, isHatched: false } });
  },

  // Backend picks 3 cards and signs payload
  generatePayloadForEgg: async (wallet: string, eggId: string) => {
    const egg = await dbService.getUserEggById(wallet, eggId);
    if (!egg || egg.isHatched) throw new Error("Invalid egg");

    const templates = await dbService.getAllCardTemplates();

    const pickedCards = Array.from({ length: 3 }).map(
      () => templates[Math.floor(Math.random() * templates.length)]
    );
    const cardIds = pickedCards.map(c => c.id);
    const ts = Date.now();
    const metadataUrl = pickedCards.map(c=>c.metdataUrl)
    const currentHp = pickedCards.map(c=>c.currentHp)
    // Admin signs payload
    const adminPayload = JSON.stringify({ wallet, eggId, cardIds, ts });
    const message = new TextEncoder().encode(adminPayload);
    const adminSignature = bs58.encode(
      nacl.sign.detached(message, adminKeypair.secretKey)
    );

    return { pickedCards, cardIds, ts, adminSignature , adminPayload , metadataUrl, currentHp};
  },

  

  // Hatch egg on-chain
  hatchEggBackend: async (data: {
    wallet: string;
    eggId: string;
    cardIds: (string | undefined)[];
    ts: number;
    currentHp : number[];
    metdataUrl : string[];
    userPayload : string,
    adminPayload : string,
    adminSignature: string;
    userSignature: string;
    pickedCards : Card[]
  }) => {
    // 1️⃣ Verify admin signature
    const payloadStr = JSON.stringify({
      wallet: data.wallet,
      eggId: data.eggId,
      cardIds: data.cardIds,
      ts: data.ts,
    });
    const payloadBytes = new TextEncoder().encode(payloadStr);
    if (
      !nacl.sign.detached.verify(
        payloadBytes,
        bs58.decode(data.adminSignature),
        adminKeypair.publicKey
      )
    ) {
      throw new Error("Invalid admin signature");
    }
  
    // 2️⃣ Verify user signature
    const userPayloadBytes = new TextEncoder().encode(payloadStr);
    const userPubkeyBytes = bs58.decode(data.wallet);
    if (
      !nacl.sign.detached.verify(
        userPayloadBytes,
        bs58.decode(data.userSignature),
        userPubkeyBytes
      )
    ) {
      throw new Error("Invalid user signature");
    }
  
    // 3️⃣ Call Solana program to mint 3 cards (user pays for PDAs)
    const instanceIds = await publishEggCardOnChain({
      wallet: data.wallet,
      eggId: data.eggId,
      cardIds: data.cardIds,
      metadataUrl : data.metdataUrl,
      ts: data.ts,
      userPayload : data.userPayload,
      adminPayload : data.adminPayload,
      adminSignature: data.adminSignature,
      userSignature: data.userSignature,
    });
  
    // 4️⃣ Store metadata off-chain
    for (let i = 0; i < data.cardIds.length; i++) {
  
      await dbService.addUserCard({
        instanceId: instanceIds[i],
        owner: data.wallet,
        cardId: data.cardIds[i],
        metadata: data.metdataUrl[i],
        currentHp : data.currentHp,
        isActive: false,
      });
    }
  
    return instanceIds;
  };
  
};
