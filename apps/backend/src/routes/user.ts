import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { cardRoutes } from "./card";
import { joinBattle } from "../controllers/battleController";
import { generateEggPayload, getAvailableEggs, hatchEgg } from "../controllers/eggController";

const userRoutes = express.Router();

// All routes require user wallet authentication
userRoutes.use(requireAuth);

// Cards
userRoutes.get("/card", cardRoutes);

// Battles
userRoutes.post("/battle/join", joinBattle);

// Eggs
userRoutes.get("/eggs", getAvailableEggs);
userRoutes.post('/eggs/payload', generateEggPayload);  // ✅ POST (needs body)
userRoutes.post("/eggs/hatch", hatchEgg);    

export default userRoutes;
