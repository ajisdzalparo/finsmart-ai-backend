import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getInsights, postInsight, generateInsightsEndpoint } from "../controllers/insights.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getInsights(req, res));

router.post("/", requireAuth, async (req: AuthRequest, res) => postInsight(req, res));

router.post("/generate", requireAuth, async (req: AuthRequest, res) => generateInsightsEndpoint(req, res));

export default router;
