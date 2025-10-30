import { Request, Response, NextFunction } from "express";
import { getUserByWallet } from "../services/userService";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const wallet = req.headers["x-wallet"] as string;
  if (!wallet) return res.status(401).json({ message: "Wallet required" });

  const user = await getUserByWallet(wallet);
  if (!user) return res.status(401).json({ message: "User not found" });

  (req as any).user = user;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !user.isAdmin) return res.status(403).json({ message: "Admin access required" });
  next();
};
