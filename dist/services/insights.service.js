"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInsights = listInsights;
exports.createInsight = createInsight;
const database_1 = require("../utils/database");
function listInsights(userId) {
    return database_1.prisma.insight.findMany({ where: { userId } });
}
function createInsight(userId, input) {
    return database_1.prisma.insight.create({ data: { ...input, userId: userId } });
}
