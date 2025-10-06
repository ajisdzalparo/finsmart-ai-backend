"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplates = getTemplates;
exports.postTemplate = postTemplate;
const zod_1 = require("zod");
const templates_service_1 = require("../services/templates.service");
const schema = zod_1.z.object({
    name: zod_1.z.string(),
    amount: zod_1.z.number(),
    currency: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    frequency: zod_1.z.string().optional(),
    nextRunDate: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().optional(),
});
async function getTemplates(req, res) {
    const items = await (0, templates_service_1.listTemplates)(req.userId);
    res.json(items);
}
async function postTemplate(req, res) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const item = await (0, templates_service_1.createTemplate)(req.userId, parsed.data);
    res.status(201).json(item);
}
