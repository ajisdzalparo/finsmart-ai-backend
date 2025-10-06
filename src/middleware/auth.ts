import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  body(body: any): unknown;
  userId?: string;
  user?: {
    profileCompleted?: boolean;
    interests?: string[];
    incomeRange?: string;
    expenseCategories?: string[];
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const token = header.replace("Bearer ", "");
  try {
    const secret = process.env.JWT_SECRET || "";
    const payload = jwt.verify(token, secret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
