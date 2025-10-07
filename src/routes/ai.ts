import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// AI Insights routes
router.get("/insights", AIController.getInsights);
router.post("/insights/generate", AIController.generateInsights);
router.delete("/insights/:insightId", AIController.deleteInsight);
// Preview (no DB write)
router.get("/insights/preview", AIController.previewInsights);

// AI Recommendations routes
router.get("/recommendations", AIController.getRecommendations);
router.post("/recommendations/generate", AIController.generateRecommendations);
router.patch("/recommendations/:recommendationId/read", AIController.markRecommendationAsRead);
// Preview (no DB write)
router.get("/recommendations/preview", AIController.previewRecommendations);

// AI Dashboard
router.get("/dashboard", AIController.getAIDashboard);

export default router;
