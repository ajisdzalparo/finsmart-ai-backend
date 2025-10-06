"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplates = listTemplates;
exports.createTemplate = createTemplate;
const database_1 = require("../utils/database");
function listTemplates(userId) {
    return database_1.prisma.transactionTemplate.findMany({ where: { userId } });
}
function createTemplate(userId, input) {
    return database_1.prisma.transactionTemplate.create({
        data: {
            ...input,
            nextRunDate: input.nextRunDate ? new Date(input.nextRunDate) : undefined,
            userId: userId,
        },
    });
}
