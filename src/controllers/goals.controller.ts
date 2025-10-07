import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { GoalInput, createGoal, listGoals, getGoalById, updateGoal, deleteGoal, addMoneyToGoal } from "../services/goals.service";
import { errorResponse, successResponse } from "../utils/response";

const schema = z.object({
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number().optional(),
  targetDate: z.string().optional(),
  goalType: z.string(),
  isActive: z.boolean().optional(),
});

export async function getGoals(req: AuthRequest, res: Response) {
  const items = await listGoals(req.userId);
  successResponse(res, items);
}

export async function postGoal(req: AuthRequest, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const item = await createGoal(req.userId, parsed.data as GoalInput);
  successResponse(res, item);
}

export async function getGoal(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const goal = await getGoalById(id, req.userId);
  if (!goal) return errorResponse(res, "Goal not found", 404);
  successResponse(res, goal);
}

export async function putGoal(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const updateSchema = schema.partial();
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const goal = await getGoalById(id, req.userId);
  if (!goal) errorResponse(res, "Goal not found", 404);

  const updatedGoal = await updateGoal(id, req.userId, parsed.data as Partial<GoalInput>);
  successResponse(res, updatedGoal);
}

export async function deleteGoalController(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const goal = await getGoalById(id, req.userId);
  if (!goal) errorResponse(res, "Goal not found", 404);

  await deleteGoal(id, req.userId);
  successResponse(res, null);
}

export async function addMoneyToGoalController(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const addMoneySchema = z.object({
    amount: z.number().positive(),
  });
  const parsed = addMoneySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const goal = await getGoalById(id, req.userId);
  if (!goal) return errorResponse(res, "Goal not found", 404);

  try {
    const result = await addMoneyToGoal(id, req.userId, parsed.data.amount);
    successResponse(res, {
      goal: result.goal,
      transaction: result.transaction,
      message: `Successfully added ${parsed.data.amount} to goal "${goal.name}"`,
    });
  } catch (error) {
    return errorResponse(res, "Failed to add money to goal", 500, error);
  }
}
