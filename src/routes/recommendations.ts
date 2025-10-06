import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getRecommendations } from "../controllers/recommendations.controller";

const router = Router();

// Generate simple heuristic recommendations from last 30 days of expenses
router.get("/", requireAuth, async (req: AuthRequest, res) => getRecommendations(req, res));

export default router;
