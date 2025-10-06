"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = getDashboardData;
const database_1 = require("../utils/database");
async function getDashboardData(userId) {
    const [income, expense, recent] = await Promise.all([
        database_1.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                category: { is: { type: "income" } },
            },
        }),
        database_1.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                category: { is: { type: "expense" } },
            },
        }),
        database_1.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                category: {
                    select: {
                        name: true,
                        type: true,
                    },
                },
            },
        }),
    ]);
    // Hapus categoryId dari setiap transaction
    const recentWithoutCategoryId = recent.map((transaction) => {
        const { categoryId, ...transactionWithoutCategoryId } = transaction;
        return transactionWithoutCategoryId;
    });
    return {
        totals: {
            income: Number(income._sum.amount) || 0,
            expense: Number(expense._sum.amount) || 0,
        },
        recent: recentWithoutCategoryId,
    };
}
