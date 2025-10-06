"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
const database_1 = require("../utils/database");
async function createReport(userId, input) {
    const where = {
        userId,
        transactionDate: {
            gte: input.periodStart ? new Date(input.periodStart) : undefined,
            lte: input.periodEnd ? new Date(input.periodEnd) : undefined,
        },
    };
    const byCategory = await database_1.prisma.transaction.groupBy({
        by: ['categoryId'],
        _sum: { amount: true },
        where,
    });
    return database_1.prisma.report.create({
        data: {
            userId: userId,
            reportType: input.reportType,
            periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
            periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
            exportFormat: input.exportFormat,
            summary: JSON.stringify(byCategory),
        },
    });
}
