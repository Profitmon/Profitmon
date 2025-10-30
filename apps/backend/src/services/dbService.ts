// src/services/dbService.ts
import { prisma } from "@repo/db/client";
import { UserEgg, UserCard, Card } from "@repo/sharedtypes/types";

export const dbService = {
  async getUserEggs(wallet: string): Promise<UserEgg[]> {
    return prisma.userEgg.findMany({ where: { userId: wallet } }) as any;
  },

  async addUserEgg(egg: UserEgg) {
    return prisma.userEgg.create({ data: egg as any });
  },

  async getUserEggById(wallet: string, eggId: string) {
    return prisma.userEgg.findFirst({ where: { userId: wallet, id: eggId } }) as any;
  },

  async updateUserEgg(egg: UserEgg) {
    return prisma.userEgg.update({ where: { id: egg.id }, data: egg as any });
  },

  async addUserCard(card: UserCard) {
    // map to your Prisma model; example assumes userCard model fields similar names
    return prisma.userCard.create({ data: card as any });
  },

  async getAllCardTemplates(): Promise<Card[]> {
    return prisma.card.findMany() as any;
  }
};
