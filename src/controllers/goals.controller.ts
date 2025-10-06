import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { GoalInput, createGoal, listGoals } from '../services/goals.service';

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
  res.json(items);
}

export async function postGoal(req: AuthRequest, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const item = await createGoal(req.userId, parsed.data as GoalInput);
  res.status(201).json(item);
}


