import { Request, Response } from "express";
import { AISchedulerService } from "../services/ai.scheduler.service";
import { successResponse, errorResponse } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

export class AISchedulerController {
  static async getScheduledTasks(req: AuthRequest, res: Response) {
    try {
      const tasks = await AISchedulerService.getScheduledTasks();
      return successResponse(res, tasks, "Scheduled tasks retrieved successfully");
    } catch (error) {
      console.error("Error getting scheduled tasks:", error);
      return errorResponse(res, "Failed to get scheduled tasks", 500);
    }
  }

  static async getTaskStatus(req: AuthRequest, res: Response) {
    try {
      const { taskId } = req.params;
      const task = await AISchedulerService.getTaskStatus(taskId);

      if (!task) {
        return errorResponse(res, "Task not found", 404);
      }

      return successResponse(res, task, "Task status retrieved successfully");
    } catch (error) {
      console.error("Error getting task status:", error);
      return errorResponse(res, "Failed to get task status", 500);
    }
  }

  static async runTaskNow(req: AuthRequest, res: Response) {
    try {
      const { taskId } = req.params;
      const success = await AISchedulerService.runTaskNow(taskId);

      if (!success) {
        return errorResponse(res, "Failed to run task", 400);
      }

      return successResponse(res, { taskId, status: "completed" }, "Task executed successfully");
    } catch (error) {
      console.error("Error running task:", error);
      return errorResponse(res, "Failed to run task", 500);
    }
  }

  static async generateInsightsNow(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const success = await AISchedulerService.runTaskNow("daily-insights");

      if (!success) {
        return errorResponse(res, "Failed to generate insights", 400);
      }

      return successResponse(res, { message: "Insights generation started" }, "Insights generation initiated");
    } catch (error) {
      console.error("Error generating insights:", error);
      return errorResponse(res, "Failed to generate insights", 500);
    }
  }

  static async generateRecommendationsNow(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const success = await AISchedulerService.runTaskNow("weekly-recommendations");

      if (!success) {
        return errorResponse(res, "Failed to generate recommendations", 400);
      }

      return successResponse(res, { message: "Recommendations generation started" }, "Recommendations generation initiated");
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return errorResponse(res, "Failed to generate recommendations", 500);
    }
  }

  static async generateMonthlyAnalysisNow(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const success = await AISchedulerService.runTaskNow("monthly-analysis");

      if (!success) {
        return errorResponse(res, "Failed to generate monthly analysis", 400);
      }

      return successResponse(res, { message: "Monthly analysis generation started" }, "Monthly analysis generation initiated");
    } catch (error) {
      console.error("Error generating monthly analysis:", error);
      return errorResponse(res, "Failed to generate monthly analysis", 500);
    }
  }

  static async toggleScheduler(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const { taskId } = req.params;
      const { activate } = req.body as any;

      const success = await AISchedulerService.toggleTask(taskId, activate);

      if (!success) {
        return errorResponse(res, "Failed to toggle scheduler", 400);
      }

      return successResponse(
        res,
        {
          taskId,
          status: activate ? "activated" : "deactivated",
        },
        `Scheduler ${activate ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling scheduler:", error);
      return errorResponse(res, "Failed to toggle scheduler", 500);
    }
  }
}
