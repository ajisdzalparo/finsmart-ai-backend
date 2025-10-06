import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { TemplateInput, createTemplate, listTemplates } from '../services/templates.service';

const schema = z.object({
  name: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  frequency: z.string().optional(),
  nextRunDate: z.string().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
});

export async function getTemplates(req: AuthRequest, res: Response) {
  const items = await listTemplates(req.userId);
  res.json(items);
}

export async function postTemplate(req: AuthRequest, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const item = await createTemplate(req.userId, parsed.data as TemplateInput);
  res.status(201).json(item);
}


