import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { InsightInput, createInsight, listInsights } from '../services/insights.service';

const insightSchema = z.object({
  insightType: z.string(),
  data: z.any(),
});

export async function getInsights(req: AuthRequest, res: Response) {
  const items = await listInsights(req.userId);
  res.json(items);
}

export async function postInsight(req: AuthRequest, res: Response) {
  const parsed = insightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const item = await createInsight(req.userId, parsed.data as InsightInput);
  res.status(201).json(item);
}


