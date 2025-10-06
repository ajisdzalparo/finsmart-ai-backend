"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRecommendations = buildRecommendations;
const database_1 = require("../utils/database");
async function buildRecommendations(userId) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expenses = await database_1.prisma.transaction.findMany({
        where: { userId, transactionDate: { gte: since }, category: { type: 'expense' } },
        include: { category: true },
    });
    const totalsByCategory = {};
    for (const t of expenses) {
        const key = t.categoryId || 'uncategorized';
        const name = t.category?.name || 'Uncategorized';
        totalsByCategory[key] = totalsByCategory[key] || { name, amount: 0 };
        totalsByCategory[key].amount += Number(t.amount);
    }
    return Object.values(totalsByCategory)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map((c) => ({
        title: `Reduce spending on ${c.name}`,
        detail: `You spent ${c.amount.toFixed(2)} in the last 30 days. Aim to cut 5-10%.`,
    }));
}
