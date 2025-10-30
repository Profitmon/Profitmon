import express from "express";
import { getOwnedCards, getOwnedCardById } from "../controllers/cardController";

export const cardRoutes = express.Router()

cardRoutes.get("/all", getOwnedCards); // ?wallet=xyz
cardRoutes.get("/getCard/:cardId", getOwnedCardById); // ?wallet=xyz
