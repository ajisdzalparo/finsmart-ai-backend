"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.listReports = listReports;
exports.listReportsPaginated = listReportsPaginated;
exports.getReportById = getReportById;
exports.serializeReport = serializeReport;
const database_1 = require("../utils/database");
const ai_service_deepseek_1 = require("./ai.service.deepseek");
async function createReport(userId, input) {
    const whereBase = {
        userId,
        transactionDate: {
            gte: input.periodStart ? new Date(input.periodStart) : undefined,
            lte: input.periodEnd ? new Date(input.periodEnd) : undefined,
        },
    };
    let summary = {};
    if (input.reportType === "expense_by_category") {
        // Ambil transaksi expense beserta kategori, lalu agregasi di memory untuk dapatkan nama kategori
        const tx = await database_1.prisma.transaction.findMany({
            where: { ...whereBase, category: { is: { type: "expense" } } },
            include: { category: true },
        });
        const byCat = {};
        for (const t of tx) {
            const key = t.categoryId || "uncategorized";
            const name = t.category?.name || "Uncategorized";
            byCat[key] = byCat[key] || { categoryId: t.categoryId || null, categoryName: name, amount: 0 };
            byCat[key].amount += Number(t.amount);
        }
        summary = { expenseByCategory: Object.values(byCat) };
    }
    else if (input.reportType === "income_vs_expense") {
        const incomeAgg = await database_1.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { ...whereBase, category: { is: { type: "income" } } },
        });
        const expenseAgg = await database_1.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { ...whereBase, category: { is: { type: "expense" } } },
        });
        summary = {
            totals: {
                income: Number(incomeAgg._sum.amount) || 0,
                expense: Number(expenseAgg._sum.amount) || 0,
                balance: (Number(incomeAgg._sum.amount) || 0) - (Number(expenseAgg._sum.amount) || 0),
            },
        };
    }
    else if (input.reportType === "cashflow_monthly") {
        // Kelompokkan per bulan: YYYY-MM
        const tx = await database_1.prisma.transaction.findMany({ where: whereBase, include: { category: true } });
        const byMonth = {};
        for (const t of tx) {
            const d = new Date(t.transactionDate);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            byMonth[key] = byMonth[key] || { income: 0, expense: 0 };
            const type = t.category?.type;
            if (type === "income")
                byMonth[key].income += Number(t.amount);
            else if (type === "expense")
                byMonth[key].expense += Number(t.amount);
        }
        const rows = Object.entries(byMonth)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, v]) => ({ month, ...v, balance: v.income - v.expense }));
        summary = { cashflowMonthly: rows };
    }
    else {
        // Fallback sederhana
        const tx = await database_1.prisma.transaction.findMany({ where: whereBase, include: { category: true } });
        summary = { totalTransactions: tx.length };
    }
    // AI analysis (opsional, try/catch agar tidak menggagalkan report)
    try {
        const ai = await ai_service_deepseek_1.DeepseekAIService.analyzeReportSummary({
            reportType: input.reportType,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            summary,
        });
        summary.aiInsights = ai;
    }
    catch (e) {
        // abaikan error AI
    }
    return database_1.prisma.report.create({
        data: {
            userId: userId,
            reportType: input.reportType,
            periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
            periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
            exportFormat: input.exportFormat,
            summary: JSON.stringify(summary),
        },
    });
}
async function listReports(userId) {
    return database_1.prisma.report.findMany({
        where: { userId },
        orderBy: { generatedAt: "desc" },
        take: 50,
    });
}
async function listReportsPaginated(userId, page, limit) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;
    const [total, items] = await Promise.all([
        database_1.prisma.report.count({ where: { userId } }),
        database_1.prisma.report.findMany({
            where: { userId },
            orderBy: { generatedAt: "desc" },
            skip,
            take: safeLimit,
        }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return { items, total, page: safePage, limit: safeLimit, totalPages };
}
async function getReportById(userId, id) {
    return database_1.prisma.report.findFirst({ where: { id, userId } });
}
function serializeReport(report) {
    if (!report)
        return null;
    let summary = undefined;
    try {
        summary = report.summary ? JSON.parse(report.summary) : undefined;
    }
    catch {
        summary = report.summary;
    }
    return { ...report, summary };
}
