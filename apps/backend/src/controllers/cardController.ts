import { Request, Response } from "express";
import { cardService } from "../services/cardService";

// Get all cards owned by a user
export const getOwnedCards = async (req: Request, res: Response) => {
  try {
    const wallet = req.query.wallet as string;
    if (!wallet) return res.status(400).json({ success: false, message: "Missing wallet" });

    const cards = await cardService.getOwnedCards(wallet);
    return res.json({ success: true, cards });
  } catch (err: any) {
    console.error("getOwnedCards error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single owned card by instanceId
export const getOwnedCardById = async (req: Request, res: Response) => {
  try {
    const wallet = req.query.wallet as string;
    const { cardId } = req.params;
    if (!wallet || !cardId)
      return res.status(400).json({ success: false, message: "Missing params" });

    const card = await cardService.getOwnedCardById(wallet, cardId);
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });

    return res.json({ success: true, card });
  } catch (err: any) {
    console.error("getOwnedCardById error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
