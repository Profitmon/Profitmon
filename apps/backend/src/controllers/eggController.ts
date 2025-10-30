// controllers/eggController.ts
import { Request, Response } from "express";
import { eggService } from "../services/eggService";
import { Card } from "@repo/sharedtypes/types";

interface HatchEggType {
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
  pickedCards : Card[];
}

export const getAvailableEggs = async (req: Request, res: Response) => {

  const { wallet } = req.body;

  if (!wallet) return res.status(401).json({ success: false, message: "Unauthorized" });
  const eggs = await eggService.getAvailableEggs(wallet);
  return res.json({ success: true, eggs });
};

export const generateEggPayload = async (req: Request, res: Response) => {

  const { wallet, eggId } = req.body;

  if (!wallet) return res.status(401).json({ success: false });
  const payload = await eggService.generatePayloadForEgg(wallet, eggId);
  return res.json(payload);
};

export const hatchEgg = async (req: Request, res: Response) => {

  const { eggId, wallet, cardIds, ts, currentHp, metdataUrl, userPayload, userSignature, adminPayload, adminSignature, pickedCards } = req.body;

  const instanceIds = await eggService.hatchEggBackend({
    wallet,
    eggId,
    cardIds,
    ts,
    metdataUrl,
    currentHp,
    adminSignature,
    userSignature,
    userPayload,
    adminPayload,
    pickedCards
  });
  return res.json({ success: true, instanceIds });
};
