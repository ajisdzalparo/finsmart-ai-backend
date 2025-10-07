import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { buildRecommendations } from "../services/recommendations.service";
import { errorResponse, successResponse } from "../utils/response";

export async function getRecommendations(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const data = await buildRecommendations(userId);
    return successResponse(res, data, "Recommendations retrieved successfully", 200);
  } catch (error) {
    return errorResponse(res, "Error getting recommendations", 500, error);
  }
}
