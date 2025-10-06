"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminders = getReminders;
exports.postReminder = postReminder;
const zod_1 = require("zod");
const reminders_service_1 = require("../services/reminders.service");
const schema = zod_1.z.object({
    message: zod_1.z.string(),
    reminderDate: zod_1.z.string(),
    frequency: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
async function getReminders(req, res) {
    const items = await (0, reminders_service_1.listReminders)(req.userId);
    res.json(items);
}
async function postReminder(req, res) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const item = await (0, reminders_service_1.createReminder)(req.userId, parsed.data);
    res.status(201).json(item);
}
