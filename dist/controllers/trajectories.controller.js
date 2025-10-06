"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrajectories = getTrajectories;
exports.postTrajectory = postTrajectory;
const zod_1 = require("zod");
const trajectories_service_1 = require("../services/trajectories.service");
const trajectorySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
async function getTrajectories(req, res) {
    const items = await (0, trajectories_service_1.listUserTrajectories)(req.userId);
    res.json(items);
}
async function postTrajectory(req, res) {
    const parsed = trajectorySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    try {
        const created = await (0, trajectories_service_1.createTrajectory)(req.userId, parsed.data);
        res.status(201).json(created);
    }
    catch (err) {
        const status = err?.status ?? 500;
        res.status(status).json({ error: err?.message ?? "Internal Server Error" });
    }
}
