import { Router } from "express";
import { AISchedulerController } from "../controllers/ai.scheduler.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Get all scheduled tasks
router.get("/tasks", requireAuth, AISchedulerController.getScheduledTasks);

// Get specific task status
router.get("/tasks/:taskId", requireAuth, AISchedulerController.getTaskStatus);

// Run specific task now
router.post("/tasks/:taskId/run", requireAuth, AISchedulerController.runTaskNow);

// Generate insights now
router.post("/generate-insights", requireAuth, AISchedulerController.generateInsightsNow);

// Generate recommendations now
router.post("/generate-recommendations", requireAuth, AISchedulerController.generateRecommendationsNow);

// Generate monthly analysis now
router.post("/generate-monthly-analysis", requireAuth, AISchedulerController.generateMonthlyAnalysisNow);

// Toggle scheduler (activate/deactivate)
router.post("/tasks/:taskId/:action", requireAuth, AISchedulerController.toggleScheduler);

export default router;
