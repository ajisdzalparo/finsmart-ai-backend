import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { ReportInput, createReport } from '../services/reports.service';

const schema = z.object({
  reportType: z.string(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  exportFormat: z.string().optional(),
});

export async function postReport(req: AuthRequest, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const report = await createReport(req.userId, parsed.data as ReportInput);
  res.status(201).json(report);
}


