"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoals = getGoals;
exports.postGoal = postGoal;
const zod_1 = require("zod");
const goals_service_1 = require("../services/goals.service");
const schema = zod_1.z.object({
    name: zod_1.z.string(),
    targetAmount: zod_1.z.number(),
    currentAmount: zod_1.z.number().optional(),
    targetDate: zod_1.z.string().optional(),
    goalType: zod_1.z.string(),
    isActive: zod_1.z.boolean().optional(),
});
async function getGoals(req, res) {
    const items = await (0, goals_service_1.listGoals)(req.userId);
    res.json(items);
}
async function postGoal(req, res) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const item = await (0, goals_service_1.createGoal)(req.userId, parsed.data);
    res.status(201).json(item);
}
