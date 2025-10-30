import express from "express";
import { eggService } from "../services/eggService";
export const router = express.Router();

router.post("/hatch-egg", async (req, res) => {
  try {
    const { wallet, eggId } = req.body;
    const result = await eggService.generatePayloadForEgg(wallet, eggId);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
