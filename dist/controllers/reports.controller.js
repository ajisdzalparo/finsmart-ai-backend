"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postReport = postReport;
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
    res.status(201).json(report);
}
