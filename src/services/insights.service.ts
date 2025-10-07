import { prisma } from "../utils/database";

export type InsightInput = {
  insightType: string;
  data: any;
};

export function listInsights(userId: string | undefined) {
  return prisma.insight.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
  });
}

export function createInsight(userId: string | undefined, input: InsightInput) {
  return prisma.insight.create({ data: { ...input, userId: userId! } });
}

export async function generateInsights(userId: string) {
  // Get user's financial data for the last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [transactions, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: since },
      },
      include: { category: true },
    }),
    prisma.goal.findMany({
      where: { userId, isActive: true },
    }),
  ]);

  const insights = [];

  // Analyze spending patterns
  const expenses = transactions.filter((t) => t.category?.type === "expense");
  const income = transactions.filter((t) => t.category?.type === "income");

  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Generate spending insights
  if (savingsRate < 10) {
    insights.push({
      insightType: "warning",
      data: {
        title: "Tingkat Tabungan Rendah",
        message: `Tingkat tabungan Anda hanya ${savingsRate.toFixed(1)}%. Disarankan minimal 20% untuk kesehatan finansial yang baik.`,
        priority: "high",
      },
    });
  } else if (savingsRate >= 20) {
    insights.push({
      insightType: "success",
      data: {
        title: "Tabungan Sehat",
        message: `Excellent! Tingkat tabungan Anda ${savingsRate.toFixed(1)}% menunjukkan manajemen keuangan yang baik.`,
        priority: "low",
      },
    });
  }

  // Analyze category spending
  const categorySpending: Record<string, number> = {};
  expenses.forEach((t) => {
    const category = t.category?.name || "Uncategorized";
    categorySpending[category] = (categorySpending[category] || 0) + Number(t.amount);
  });

  const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0];

  if (topCategory && topCategory[1] > totalExpenses * 0.3) {
    insights.push({
      insightType: "tip",
      data: {
        title: "Konsentrasi Pengeluaran Tinggi",
        message: `Anda menghabiskan ${((topCategory[1] / totalExpenses) * 100).toFixed(1)}% dari pengeluaran untuk ${topCategory[0]}. Pertimbangkan diversifikasi.`,
        priority: "medium",
      },
    });
  }

  // Analyze goals progress
  if (goals.length > 0) {
    const activeGoal = goals[0];
    const progress = (Number(activeGoal.currentAmount) / Number(activeGoal.targetAmount)) * 100;

    if (progress >= 80) {
      insights.push({
        insightType: "success",
        data: {
          title: "Target Hampir Tercapai",
          message: `Target "${activeGoal.name}" sudah ${progress.toFixed(1)}% tercapai! Tinggal ${Number(activeGoal.targetAmount) - Number(activeGoal.currentAmount)} lagi.`,
          priority: "low",
        },
      });
    } else if (progress < 20 && goals.length > 0) {
      insights.push({
        insightType: "tip",
        data: {
          title: "Percepatan Target",
          message: `Target "${activeGoal.name}" baru ${progress.toFixed(1)}% tercapai. Pertimbangkan meningkatkan kontribusi bulanan.`,
          priority: "medium",
        },
      });
    }
  }

  // Save insights to database
  for (const insight of insights) {
    await createInsight(userId, insight);
  }

  return insights;
}
