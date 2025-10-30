import express from "express";
import { publishCard } from "../controllers/adminController";
import { requireAdmin } from "../middleware/authMiddleware";

const adminRoutes = express.Router();

// POST api/admin/publishCard
adminRoutes.post("/publishCard", requireAdmin, publishCard);

export default adminRoutes;
