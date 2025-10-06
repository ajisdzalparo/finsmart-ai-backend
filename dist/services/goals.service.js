"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGoals = listGoals;
exports.createGoal = createGoal;
const database_1 = require("../utils/database");
function listGoals(userId) {
    return database_1.prisma.goal.findMany({ where: { userId } });
}
function createGoal(userId, input) {
    return database_1.prisma.goal.create({
        data: {
            ...input,
            targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
            userId: userId,
        },
    });
}
