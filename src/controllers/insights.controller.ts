import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { InsightInput, createInsight, listInsights, generateInsights } from "../services/insights.service";
import { errorResponse, successResponse } from "../utils/response";

const insightSchema = z.object({
  insightType: z.string(),
  data: z.any(),
});

export async function getInsights(req: AuthRequest, res: Response) {
  try {
    const items = await listInsights(req.userId);
    return successResponse(res, items, "Insights retrieved successfully", 200);
  } catch (error) {
    return errorResponse(res, "Error getting insights", 500, error);
  }
}

export async function postInsight(req: AuthRequest, res: Response) {
  try {
    const parsed = insightSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const item = await createInsight(req.userId, parsed.data as InsightInput);
    return successResponse(res, item, "Insight created successfully", 201);
  } catch (error) {
    return errorResponse(res, "Error creating insight", 500, error);
  }
}

export async function generateInsightsEndpoint(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const insights = await generateInsights(userId);
    return successResponse(res, insights, "Insights generated successfully", 200);
  } catch (error) {
    return errorResponse(res, "Error generating insights", 500, error);
  }
}
