import { NextFunction, Response } from "express";
import { prisma } from "../utils/database";
import { AuthRequest } from "./auth";

export function logActivity(action: string, entityType: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      await prisma.activityLog.create({
        data: {
          action,
          entityType,
          entityId: (req as any).entityId,
          description: (req as any).description,
          userId: req.userId!,
        },
      });
    } catch {
      // ignore logging errors
    }
    next();
  };
}
