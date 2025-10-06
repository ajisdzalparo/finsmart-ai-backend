import { type Request, type Response, type NextFunction } from "express";
import { getUserById } from "../services/auth.service";
import { AuthRequest } from "./auth";

export async function requireProfileCompletion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!(user as any).profileCompleted) {
      return res.status(200).json({
        requiresProfileCompletion: true,
        message: "Please complete your profile to continue",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          interests: (user as any).interests,
          incomeRange: (user as any).incomeRange,
          expenseCategories: (user as any).expenseCategories,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error in requireProfileCompletion middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function checkProfileCompletion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = {
      ...req.user,
      profileCompleted: (user as any).profileCompleted,
      interests: (user as any).interests,
      incomeRange: (user as any).incomeRange,
      expenseCategories: (user as any).expenseCategories,
    };

    next();
  } catch (error) {
    console.error("Error in checkProfileCompletion middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
