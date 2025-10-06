import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { ReminderInput, createReminder, listReminders } from '../services/reminders.service';

const schema = z.object({
  message: z.string(),
  reminderDate: z.string(),
  frequency: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function getReminders(req: AuthRequest, res: Response) {
  const items = await listReminders(req.userId);
  res.json(items);
}

export async function postReminder(req: AuthRequest, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const item = await createReminder(req.userId, parsed.data as ReminderInput);
  res.status(201).json(item);
}


