"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsights = getInsights;
exports.postInsight = postInsight;
exports.generateInsightsEndpoint = generateInsightsEndpoint;
const zod_1 = require("zod");
const insights_service_1 = require("../services/insights.service");
const response_1 = require("../utils/response");
const insightSchema = zod_1.z.object({
    insightType: zod_1.z.string(),
    data: zod_1.z.any(),
});
async function getInsights(req, res) {
    try {
        const items = await (0, insights_service_1.listInsights)(req.userId);
        return (0, response_1.successResponse)(res, items, "Insights retrieved successfully", 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, "Error getting insights", 500, error);
    }
}
async function postInsight(req, res) {
    try {
        const parsed = insightSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.format() });
        const item = await (0, insights_service_1.createInsight)(req.userId, parsed.data);
        return (0, response_1.successResponse)(res, item, "Insight created successfully", 201);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, "Error creating insight", 500, error);
    }
}
async function generateInsightsEndpoint(req, res) {
    try {
        const userId = req.userId;
        const insights = await (0, insights_service_1.generateInsights)(userId);
        return (0, response_1.successResponse)(res, insights, "Insights generated successfully", 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, "Error generating insights", 500, error);
    }
}
