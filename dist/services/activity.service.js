"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listActivity = listActivity;
const database_1 = require("../utils/database");
function listActivity(userId) {
    return database_1.prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}
