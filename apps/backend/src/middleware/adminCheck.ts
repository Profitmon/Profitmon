import { AuthRequest } from './auth';
import { Response, NextFunction } from 'express';

export const adminCheck = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};
