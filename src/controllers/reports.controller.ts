import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { ReportInput, createReport, listReports, getReportById, serializeReport } from "../services/reports.service";

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
  res.status(201).json(serializeReport(report));
}

export async function getReports(req: AuthRequest, res: Response) {
  const reports = await listReports(req.userId);
  res.json(reports.map(serializeReport));
}

export async function getReport(req: AuthRequest, res: Response) {
  const { id } = req.params as { id: string };
  const report = await getReportById(req.userId, id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(serializeReport(report));
}
