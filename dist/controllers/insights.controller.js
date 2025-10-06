"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsights = getInsights;
exports.postInsight = postInsight;
const zod_1 = require("zod");
const insights_service_1 = require("../services/insights.service");
const insightSchema = zod_1.z.object({
    insightType: zod_1.z.string(),
    data: zod_1.z.any(),
});
async function getInsights(req, res) {
    const items = await (0, insights_service_1.listInsights)(req.userId);
    res.json(items);
}
async function postInsight(req, res) {
    const parsed = insightSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const item = await (0, insights_service_1.createInsight)(req.userId, parsed.data);
    res.status(201).json(item);
}
