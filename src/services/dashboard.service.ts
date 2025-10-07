import { prisma } from "../utils/database";
import { generateInsights } from "./insights.service";

export async function getDashboardData(userId: string) {
  const [income, expense, recent, goals, insights, recommendations] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        category: { is: { type: "income" } },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        category: { is: { type: "expense" } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        category: { isNot: null }, // Hanya ambil transaksi yang memiliki category
      },
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
    prisma.goal.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Get existing insights or generate new ones
    getOrGenerateInsights(userId),
    // Generate recommendations based on spending patterns
    generateRecommendations(userId),
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
    goals: goals.map((goal) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    })),
    insights,
    recommendations,
  };
}

async function generateRecommendations(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: since },
      category: { is: { type: "expense" } },
    },
    include: { category: true },
  });

  const totalsByCategory: Record<string, { name: string; amount: number }> = {};
  for (const t of expenses) {
    const key = t.categoryId || "uncategorized";
    const name = t.category?.name || "Uncategorized";
    totalsByCategory[key] = totalsByCategory[key] || { name, amount: 0 };
    totalsByCategory[key].amount += Number(t.amount);
  }

  const topCategories = Object.values(totalsByCategory)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return topCategories.map((c) => ({
    type: "spending_optimization",
    title: `Kurangi pengeluaran ${c.name}`,
    message: `Anda menghabiskan Rp ${c.amount.toLocaleString("id-ID")} dalam 30 hari terakhir. Coba kurangi 5-10%.`,
    priority: "medium",
    category: c.name,
    amount: c.amount,
  }));
}

async function getOrGenerateInsights(userId: string) {
  // Check if we have recent insights (within last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentInsights = await prisma.insight.findMany({
    where: {
      userId,
      generatedAt: { gte: yesterday },
    },
    orderBy: { generatedAt: "desc" },
    take: 5,
  });

  // If we have recent insights, return them
  if (recentInsights.length > 0) {
    return recentInsights;
  }

  // Otherwise, generate new insights
  try {
    await generateInsights(userId);
    // Return the newly generated insights
    return await prisma.insight.findMany({
      where: { userId },
      orderBy: { generatedAt: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    // Return empty array if generation fails
    return [];
  }
}
