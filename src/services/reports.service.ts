import { prisma } from "../utils/database";
import { DeepseekAIService } from "./ai.service.deepseek";

export type ReportInput = {
  reportType: string;
  periodStart?: string;
  periodEnd?: string;
  exportFormat?: string;
};

export async function createReport(userId: string | undefined, input: ReportInput) {
  const whereBase: any = {
    userId,
    transactionDate: {
      gte: input.periodStart ? new Date(input.periodStart) : undefined,
      lte: input.periodEnd ? new Date(input.periodEnd) : undefined,
    },
  };

  let summary: any = {};

  if (input.reportType === "expense_by_category") {
    // Ambil transaksi expense beserta kategori, lalu agregasi di memory untuk dapatkan nama kategori
    const tx = await prisma.transaction.findMany({
      where: { ...whereBase, category: { is: { type: "expense" } } },
      include: { category: true },
    });
    const byCat: Record<string, { categoryId: string | null; categoryName: string; amount: number }> = {};
    for (const t of tx) {
      const key = t.categoryId || "uncategorized";
      const name = t.category?.name || "Uncategorized";
      byCat[key] = byCat[key] || { categoryId: t.categoryId || null, categoryName: name, amount: 0 };
      byCat[key].amount += Number(t.amount);
    }
    summary = { expenseByCategory: Object.values(byCat) };
  } else if (input.reportType === "income_vs_expense") {
    const incomeAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...whereBase, category: { is: { type: "income" } } },
    });
    const expenseAgg = await prisma.transaction.aggregate({
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
  } else if (input.reportType === "cashflow_monthly") {
    // Kelompokkan per bulan: YYYY-MM
    const tx = await prisma.transaction.findMany({ where: whereBase, include: { category: true } });
    const byMonth: Record<string, { income: number; expense: number }> = {};
    for (const t of tx) {
      const d = new Date(t.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = byMonth[key] || { income: 0, expense: 0 };
      const type = t.category?.type;
      if (type === "income") byMonth[key].income += Number(t.amount);
      else if (type === "expense") byMonth[key].expense += Number(t.amount);
    }
    const rows = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, ...v, balance: v.income - v.expense }));
    summary = { cashflowMonthly: rows };
  } else {
    // Fallback sederhana
    const tx = await prisma.transaction.findMany({ where: whereBase, include: { category: true } });
    summary = { totalTransactions: tx.length };
  }

  // AI analysis (opsional, try/catch agar tidak menggagalkan report)
  try {
    const ai = await DeepseekAIService.analyzeReportSummary({
      reportType: input.reportType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summary,
    });
    summary.aiInsights = ai;
  } catch (e) {
    // abaikan error AI
  }

  return prisma.report.create({
    data: {
      userId: userId!,
      reportType: input.reportType,
      periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
      exportFormat: input.exportFormat,
      summary: JSON.stringify(summary),
    },
  });
}

export async function listReports(userId: string | undefined) {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    take: 50,
  });
}

export async function getReportById(userId: string | undefined, id: string) {
  return prisma.report.findFirst({ where: { id, userId } });
}

export function serializeReport(report: any) {
  if (!report) return null;
  let summary: unknown = undefined;
  try {
    summary = report.summary ? JSON.parse(report.summary) : undefined;
  } catch {
    summary = report.summary;
  }
  return { ...report, summary };
}
