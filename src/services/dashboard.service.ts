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
        category: { isNot: null },
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

  // Hitung metrik ringkas untuk AI Goal Guidance
  const totalIncome = Number(income._sum.amount) || 0;
  const totalExpense = Number(expense._sum.amount) || 0;
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

  // Skor sederhana pengelolaan uang berbasis savingsRate
  let managementScore: "excellent" | "good" | "needs_improvement" = "needs_improvement";
  if (savingsRate >= 0.2) managementScore = "excellent";
  else if (savingsRate >= 0.1) managementScore = "good";

  const aiGoalGuidance = goals.map((g) => {
    const targetAmount = Number(g.targetAmount);
    const currentAmount = Number(g.currentAmount);
    const remaining = Math.max(0, targetAmount - currentAmount);
    const monthsRemaining = g.targetDate ? Math.max(1, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12;
    const requiredMonthly = monthsRemaining > 0 ? Math.ceil(remaining / monthsRemaining) : 0;

    // Estimasi kemampuan menabung per bulan dari arus kas global (kasar)
    const estimatedMonthlySavings = Math.max(0, totalIncome - totalExpense);
    const canMeet = estimatedMonthlySavings >= requiredMonthly && requiredMonthly > 0;

    let priority: "low" | "medium" | "high" = "low";
    if (requiredMonthly > 0) {
      const burdenRatio = totalIncome > 0 ? requiredMonthly / totalIncome : 0;
      if (burdenRatio >= 0.2) priority = "high";
      else if (burdenRatio >= 0.1) priority = "medium";
    }

    const title = canMeet ? `Lanjutkan laju tabungan untuk "${g.name}"` : `Percepat tabungan untuk "${g.name}"`;
    const message = canMeet
      ? `Target tersisa Rp ${remaining.toLocaleString("id-ID")}. Sisihkan sekitar Rp ${requiredMonthly.toLocaleString("id-ID")}/bulan selama ${monthsRemaining} bulan untuk mencapai target tepat waktu.`
      : `Anda butuh sekitar Rp ${requiredMonthly.toLocaleString("id-ID")}/bulan selama ${monthsRemaining} bulan. Pertimbangkan optimasi pengeluaran agar laju tabungan mendekati kebutuhan.`;

    const suggestions: string[] = [];
    if (!canMeet) {
      suggestions.push("Kurangi 5–10% kategori pengeluaran terbesar bulan ini");
      suggestions.push("Otomatiskan transfer tabungan di awal bulan");
    } else {
      suggestions.push("Pertahankan auto-debit tabungan bulanan");
      suggestions.push("Parkir dana idle ke instrumen berbunga");
    }

    return {
      goalId: g.id,
      title,
      message,
      priority,
      monthsToGoal: monthsRemaining,
      requiredMonthly,
      managementScore,
      remaining,
      goalName: g.name,
      suggestions,
    };
  });

  return {
    totals: {
      income: totalIncome,
      expense: totalExpense,
    },
    recent: recentWithoutCategoryId,
    goals: goals.map((goal) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    })),
    insights,
    recommendations,
    aiGoalGuidance,
  };
}

async function generateRecommendations(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // Hitung total income 30 hari sebagai baseline proporsionalitas
  const incomeAgg30 = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      transactionDate: { gte: since },
      category: { is: { type: "income" } },
    },
  });
  const monthlyIncome = Number(incomeAgg30._sum.amount) || 0;
  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: since },
      category: { is: { type: "expense" } },
    },
    include: { category: true },
  });

  const recent7dExpenses = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: last7d },
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

  // Saring rekomendasi yang tidak signifikan dibanding income bulanan
  const recommendations = topCategories
    .map((c) => {
      const nameLower = c.name.toLowerCase();
      const isEssentialFood = /food|dining|grocer|makan|sembako|kebutuhan pokok/.test(nameLower);

      // Baseline wajar untuk kategori esensial (makanan) per 30 hari
      const baselinePct = 0.08; // 8% dari income 30 hari
      const absoluteMin = 1_000_000; // Rp 1.000.000 minimum akal sehat
      const baselineAmount = monthlyIncome > 0 ? Math.max(absoluteMin, monthlyIncome * baselinePct) : absoluteMin;

      if (isEssentialFood && c.amount < baselineAmount) {
        // Jika pengeluaran makanan terlalu kecil, sarankan MENAIKKAN alokasi, bukan mengurangi
        const deficitPct = ((baselineAmount - c.amount) / baselineAmount) * 100;
        const suggested = Math.round(baselineAmount / 1000) * 1000; // pembulatan ke ribuan
        let priority: "low" | "medium" | "high" = "medium";
        if (deficitPct >= 30) priority = "high";
        else if (deficitPct <= 10) priority = "low";

        return {
          type: "budget_advice",
          title: `Naikkan alokasi ${c.name}`,
          message: `Pengeluaran saat ini Rp ${c.amount.toLocaleString("id-ID")} terlihat rendah untuk kebutuhan esensial 30 hari. Pertimbangkan menaikkan ke sekitar Rp ${suggested.toLocaleString("id-ID")} (~${(baselinePct * 100).toFixed(
            0
          )}% dari income).`,
          priority,
          category: c.name,
          amount: c.amount,
        };
      }

      const ratio = monthlyIncome > 0 ? c.amount / monthlyIncome : 0;
      // Tentukan tingkat prioritas berbasis proporsi terhadap income
      let priority: "low" | "medium" | "high" = "medium";
      let suggestedCut = "5%";
      if (ratio >= 0.2) {
        priority = "high";
        suggestedCut = "15%";
      } else if (ratio >= 0.1) {
        priority = "medium";
        suggestedCut = "10%";
      } else if (ratio >= 0.03) {
        priority = "low";
        suggestedCut = "5%";
      } else {
        // Rasio <3% dari income dianggap kecil → bisa diabaikan
        return null;
      }

      return {
        type: "spending_optimization",
        title: `Optimalkan ${c.name}`,
        message:
          monthlyIncome > 0
            ? `Pengeluaran kategori ini setara ${(ratio * 100).toFixed(1)}% dari income 30 hari. Pertimbangkan pengurangan ${suggestedCut}.`
            : `Anda menghabiskan Rp ${c.amount.toLocaleString("id-ID")} dalam 30 hari terakhir. Pertimbangkan pengurangan ${suggestedCut}.`,
        priority,
        category: c.name,
        amount: c.amount,
      };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  // Analisis khusus makanan: proyeksi bulanan dari transaksi harian (7 hari terakhir)
  const foodLike = (n?: string) => (n || "").toLowerCase().match(/food|dining|grocer|makan|sembako|kebutuhan pokok/);
  const food7d = recent7dExpenses.filter((t) => foodLike(t.category?.name));
  if (food7d.length > 0) {
    // Rata-rata harian 7 hari → proyeksi 30 hari
    const total7d = food7d.reduce((s, t) => s + Number(t.amount), 0);
    const avgDaily = total7d / 7;
    const projected30 = avgDaily * 30;
    const baselinePct = 0.08;
    const absoluteMin = 1_000_000;
    const baselineAmount = monthlyIncome > 0 ? Math.max(absoluteMin, monthlyIncome * baselinePct) : absoluteMin;
    if (projected30 < baselineAmount) {
      const deficitPct = ((baselineAmount - projected30) / baselineAmount) * 100;
      let priority: "low" | "medium" | "high" = "medium";
      if (deficitPct >= 30) priority = "high";
      else if (deficitPct <= 10) priority = "low";
      recommendations.push({
        type: "budget_advice",
        title: "Naikkan alokasi Makanan (proyeksi 30 hari)",
        message: `Proyeksi bulanan makanan Rp ${projected30.toLocaleString("id-ID")} tampak rendah. Pertimbangkan alokasi ~Rp ${Math.round(baselineAmount / 1000) * 1000} (~8% income).`,
        priority,
        category: "Makanan",
        amount: projected30,
      } as any);
    }
  }

  // Analisis efisiensi tabungan/investasi bulanan
  const expenseAgg30 = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { userId, transactionDate: { gte: since }, category: { is: { type: "expense" } } },
  });
  const totalExpense30 = Number(expenseAgg30._sum.amount) || 0;
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - totalExpense30) / monthlyIncome : 0;
  const targetSavingsRate = 0.2;
  if (monthlyIncome > 0 && savingsRate < targetSavingsRate) {
    const gapPct = (targetSavingsRate - savingsRate) * 100;
    const needed = Math.max(0, monthlyIncome * targetSavingsRate - (monthlyIncome - totalExpense30));
    recommendations.push({
      type: "savings_improvement",
      title: "Tingkatkan tabungan bulanan",
      message: `Rasio tabungan ${(savingsRate * 100).toFixed(1)}% di bawah target 20%. Tambahkan sekitar Rp ${Math.round(needed / 1000) * 1000} per bulan.`,
      priority: gapPct >= 10 ? "high" : gapPct >= 5 ? "medium" : "low",
      category: "Savings",
      amount: needed,
    } as any);
  }

  // Kaitkan dengan goals aktif: jika tertinggal dan <12 bulan sisa, beri saran
  const goals = await prisma.goal.findMany({ where: { userId, isActive: true } });
  for (const g of goals) {
    const remaining = Number(g.targetAmount) - Number(g.currentAmount);
    const monthsRemaining = g.targetDate ? Math.max(1, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : 12;
    const requiredMonthly = remaining > 0 ? remaining / monthsRemaining : 0;
    const isBehind = remaining > 0 && monthsRemaining <= 12;
    if (isBehind && requiredMonthly > 0) {
      recommendations.push({
        type: "goal_acceleration",
        title: `Percepat Goal: ${g.name}`,
        message: `Butuh sekitar Rp ${Math.round(requiredMonthly / 1000) * 1000} per bulan selama ${monthsRemaining} bulan untuk capai target.`,
        priority: requiredMonthly / (monthlyIncome || 1) >= 0.2 ? "high" : "medium",
        category: "Goals",
        amount: requiredMonthly,
      } as any);
    }
  }

  return recommendations;
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
