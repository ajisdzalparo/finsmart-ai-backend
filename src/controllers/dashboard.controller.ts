import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getDashboardData } from "../services/dashboard.service";
import { errorResponse, successResponse } from "../utils/response";

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const data = await getDashboardData(userId);
    return successResponse(res, data, "Success", 200);
  } catch (error) {
    return errorResponse(res, "Error getting dashboard data", 500, error);
  }
}
