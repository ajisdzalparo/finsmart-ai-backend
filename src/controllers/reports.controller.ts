import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { ReportInput, createReport, listReports, listReportsPaginated, getReportById, serializeReport } from "../services/reports.service";

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
  const { page, limit } = req.query as { page?: string; limit?: string };
  if (page || limit) {
    const p = Number(page ?? 1);
    const l = Number(limit ?? 20);
    const result = await listReportsPaginated(req.userId, p, l);
    return res.status(200).json({
      success: true,
      message: "Success",
      data: result.items.map(serializeReport),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }
  const reports = await listReports(req.userId);
  res.json(reports.map(serializeReport));
}

export async function getReport(req: AuthRequest, res: Response) {
  const { id } = req.params as { id: string };
  const report = await getReportById(req.userId, id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(serializeReport(report));
}
