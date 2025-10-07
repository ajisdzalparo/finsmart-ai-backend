import { Request, Response } from "express";
import { DeepseekAIService } from "../services/ai.service.deepseek";
import { GeminiAIService } from "../services/ai.service.gemini";
import { successResponse, errorResponse } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

export class AIController {
  static async generateInsights(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const model = (req.query.model as string) || (req.headers["x-ai-model"] as string) || process.env.DEFAULT_AI_MODEL || "deepseek";
      const useGemini = String(model).toLowerCase().includes("gemini");
      const insights = useGemini ? await GeminiAIService.generateFinancialInsights(userId) : await DeepseekAIService.generateFinancialInsights(userId);
      res.set("x-ai-model-used", useGemini ? "gemini" : "deepseek");
      return successResponse(res, insights, "AI insights generated successfully");
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return errorResponse(res, "Failed to generate AI insights", 500);
    }
  }

  static async generateRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const model = (req.query.model as string) || (req.headers["x-ai-model"] as string) || process.env.DEFAULT_AI_MODEL || "deepseek";
      const useGemini = String(model).toLowerCase().includes("gemini");
      const recommendations = useGemini ? await GeminiAIService.generateRecommendations(userId) : await DeepseekAIService.generateRecommendations(userId);
      res.set("x-ai-model-used", useGemini ? "gemini" : "deepseek");
      return successResponse(res, recommendations, "AI recommendations generated successfully");
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      return errorResponse(res, "Failed to generate AI recommendations", 500);
    }
  }

  static async getInsights(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      const insights = await prisma.insight.findMany({
        where: { userId },
        orderBy: { generatedAt: "desc" },
        take: 10,
      });

      return successResponse(res, insights, "Insights retrieved successfully");
    } catch (error) {
      console.error("Error retrieving insights:", error);
      return errorResponse(res, "Failed to retrieve insights", 500);
    }
  }

  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      const recommendations = await prisma.recommendation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return successResponse(res, recommendations, "Recommendations retrieved successfully");
    } catch (error) {
      console.error("Error retrieving recommendations:", error);
      return errorResponse(res, "Failed to retrieve recommendations", 500);
    }
  }

  static async markRecommendationAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { recommendationId } = req.params;

      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      const recommendation = await prisma.recommendation.update({
        where: {
          id: recommendationId,
          userId,
        },
        data: { isRead: true },
      });

      return successResponse(res, recommendation, "Recommendation marked as read");
    } catch (error) {
      console.error("Error marking recommendation as read:", error);
      return errorResponse(res, "Failed to mark recommendation as read", 500);
    }
  }

  static async deleteInsight(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { insightId } = req.params;

      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      await prisma.insight.delete({
        where: {
          id: insightId,
          userId,
        },
      });

      return successResponse(res, null, "Insight deleted successfully");
    } catch (error) {
      console.error("Error deleting insight:", error);
      return errorResponse(res, "Failed to delete insight", 500);
    }
  }

  static async getAIDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      // Get recent insights
      const insights = await prisma.insight.findMany({
        where: { userId },
        orderBy: { generatedAt: "desc" },
        take: 5,
      });

      // Get unread recommendations
      const recommendations = await prisma.recommendation.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // Get AI statistics
      const totalInsights = await prisma.insight.count({
        where: { userId },
      });

      const totalRecommendations = await prisma.recommendation.count({
        where: { userId },
      });

      const unreadRecommendations = await prisma.recommendation.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return successResponse(
        res,
        {
          insights,
          recommendations,
          statistics: {
            totalInsights,
            totalRecommendations,
            unreadRecommendations,
          },
        },
        "AI dashboard data retrieved successfully"
      );
    } catch (error) {
      console.error("Error retrieving AI dashboard:", error);
      return errorResponse(res, "Failed to retrieve AI dashboard", 500);
    }
  }
}
