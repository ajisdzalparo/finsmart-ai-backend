"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivity = getActivity;
const activity_service_1 = require("../services/activity.service");
async function getActivity(req, res) {
    const items = await (0, activity_service_1.listActivity)(req.userId);
    res.json(items);
}
