"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoals = getGoals;
exports.postGoal = postGoal;
exports.getGoal = getGoal;
exports.putGoal = putGoal;
exports.deleteGoalController = deleteGoalController;
exports.addMoneyToGoalController = addMoneyToGoalController;
const zod_1 = require("zod");
const goals_service_1 = require("../services/goals.service");
const response_1 = require("../utils/response");
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
    (0, response_1.successResponse)(res, items);
}
async function postGoal(req, res) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const item = await (0, goals_service_1.createGoal)(req.userId, parsed.data);
    (0, response_1.successResponse)(res, item);
}
async function getGoal(req, res) {
    const { id } = req.params;
    const goal = await (0, goals_service_1.getGoalById)(id, req.userId);
    if (!goal)
        return (0, response_1.errorResponse)(res, "Goal not found", 404);
    (0, response_1.successResponse)(res, goal);
}
async function putGoal(req, res) {
    const { id } = req.params;
    const updateSchema = schema.partial();
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const goal = await (0, goals_service_1.getGoalById)(id, req.userId);
    if (!goal)
        (0, response_1.errorResponse)(res, "Goal not found", 404);
    const updatedGoal = await (0, goals_service_1.updateGoal)(id, req.userId, parsed.data);
    (0, response_1.successResponse)(res, updatedGoal);
}
async function deleteGoalController(req, res) {
    const { id } = req.params;
    const goal = await (0, goals_service_1.getGoalById)(id, req.userId);
    if (!goal)
        (0, response_1.errorResponse)(res, "Goal not found", 404);
    await (0, goals_service_1.deleteGoal)(id, req.userId);
    (0, response_1.successResponse)(res, null);
}
async function addMoneyToGoalController(req, res) {
    const { id } = req.params;
    const addMoneySchema = zod_1.z.object({
        amount: zod_1.z.number().positive(),
    });
    const parsed = addMoneySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const goal = await (0, goals_service_1.getGoalById)(id, req.userId);
    if (!goal)
        return (0, response_1.errorResponse)(res, "Goal not found", 404);
    try {
        const result = await (0, goals_service_1.addMoneyToGoal)(id, req.userId, parsed.data.amount);
        (0, response_1.successResponse)(res, {
            goal: result.goal,
            transaction: result.transaction,
            message: `Successfully added ${parsed.data.amount} to goal "${goal.name}"`,
        });
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, "Failed to add money to goal", 500, error);
    }
}
