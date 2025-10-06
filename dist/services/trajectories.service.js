"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserTrajectories = listUserTrajectories;
exports.createTrajectory = createTrajectory;
async function listUserTrajectories(_userId) {
    // No model in schema; return empty list for now
    return [];
}
async function createTrajectory(_userId, _input) {
    // No model in schema; indicate not implemented
    throw Object.assign(new Error("Trajectory model not available"), { status: 501 });
}
