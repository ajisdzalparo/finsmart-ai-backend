"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postReport = postReport;
exports.getReports = getReports;
exports.getReport = getReport;
const zod_1 = require("zod");
const reports_service_1 = require("../services/reports.service");
const schema = zod_1.z.object({
    reportType: zod_1.z.string(),
    periodStart: zod_1.z.string().optional(),
    periodEnd: zod_1.z.string().optional(),
    exportFormat: zod_1.z.string().optional(),
});
async function postReport(req, res) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const report = await (0, reports_service_1.createReport)(req.userId, parsed.data);
    res.status(201).json((0, reports_service_1.serializeReport)(report));
}
async function getReports(req, res) {
    const { page, limit } = req.query;
    if (page || limit) {
        const p = Number(page ?? 1);
        const l = Number(limit ?? 20);
        const result = await (0, reports_service_1.listReportsPaginated)(req.userId, p, l);
        return res.status(200).json({
            success: true,
            message: "Success",
            data: result.items.map(reports_service_1.serializeReport),
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
    const reports = await (0, reports_service_1.listReports)(req.userId);
    res.json(reports.map(reports_service_1.serializeReport));
}
async function getReport(req, res) {
    const { id } = req.params;
    const report = await (0, reports_service_1.getReportById)(req.userId, id);
    if (!report)
        return res.status(404).json({ error: "Report not found" });
    res.json((0, reports_service_1.serializeReport)(report));
}
