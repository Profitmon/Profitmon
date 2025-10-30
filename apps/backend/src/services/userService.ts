import { prisma } from "@repo/db/client";
import { User } from "@repo/sharedtypes/types";

// Connect or create a user
export const connectUserService = async (wallet: string): Promise<User> => {
  let user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
  if (!user) {
    user = await prisma.user.create({
      data: { walletAddress: wallet },
    });
  }

  // Fetch owned cards
  const ownedCards = await prisma.userCard.findMany({
    where: { userId: user.id },
    include: { card: true },
  });

  return {
    wallet: user.walletAddress,
    userId: user.id,
    ownedCards: ownedCards.map((uc) => ({
      instanceId: uc.id,
      cardId: uc.cardId,
      name: uc.card.name,
      elementType: uc.card.skill[0]?.type || "Normal",
      baseHp: parseInt(uc.card.HP || "100"),
      owner: wallet,
    })),
  };
};
