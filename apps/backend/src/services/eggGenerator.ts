import { prisma } from "@repo/db/client";
import { v4 as uuidv4 } from "uuid";
import { EggImageMap } from "../constants/eggImages";

export type EggType =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "CRYSTAL"
  | "MASTER"
  | "CHAMPION"
  | "TITAN"
  | "LEGEND_LEAGUE";

const eggTypes: EggType[] = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "CRYSTAL",
  "MASTER",
  "CHAMPION",
  "TITAN",
  "LEGEND_LEAGUE",
];

export const generateEggsForAllUsers = async () => {
  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Pick a random egg type
      const randomType = eggTypes[Math.floor(Math.random() * eggTypes.length)];

      const newEgg = {
        id: uuidv4(),
        wallet: user.wallet,
        imageUrl: EggImageMap[0], // match image to type
        type: 'BRONZE',
        isHatched: false,
        userId: user.id,
        createdAt: new Date(),
      };

      await prisma.userEgg.create({ data: newEgg });
      console.log(`🥚 Generated ${randomType} egg for ${user.wallet}`);
    }
  } catch (err) {
    console.error("❌ Egg generation failed:", err);
  }
};
