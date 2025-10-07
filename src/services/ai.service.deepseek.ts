import axios from "axios";
import { prisma } from "../utils/database";

interface DeepSeekChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

// Currency formatting function
function fmt(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function extractJsonArray(text: string): any[] {
  if (!text) return [];
  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Fallback: extract first JSON array substring
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      return Array.isArray(arr) ? arr : [];
    } catch {}
  }
  return [];
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  // Jika tidak ada API key, return empty string untuk fallback
  if (!apiKey || apiKey.trim() === "") {
    console.warn("DEEPSEEK_API_KEY not configured, using fallback");
    return "";
  }

  try {
    const { data } = await axios.post<DeepSeekChatResponse>(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: "You are a financial planning assistant that returns concise JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 20000,
        validateStatus: () => true,
      }
    );

    if (!(data as any) || !(data as any).choices) {
      console.warn("DeepSeek empty or invalid response");
      return "";
    }
    return data?.choices?.[0]?.message?.content || "";
  } catch (err: any) {
    const status = err?.response?.status;
    const body = typeof err?.response?.data === "string" ? err.response.data : JSON.stringify(err?.response?.data || {});
    console.error("DeepSeek API error:", status, body);
    // Return empty string instead of throwing error to allow fallback
    return "";
  }
}

export class DeepseekAIService {
  static async previewFinancialInsights(userId: string) {
    // Build summary (same as generator) but DO NOT write to DB
    const [transactions, goals] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { transactionDate: "desc" },
        take: 60,
      }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);

    const totalIncome = transactions.filter((t) => t.category?.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.category?.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    const summary = {
      totalIncome,
      totalExpense,
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        targetDate: g.targetDate,
      })),
    };

    const prompt = `Sebagai ahli keuangan, analisis data finansial berikut dan buat 3 insight mendalam dalam format JSON array {type,title,message,priority,data}.

Data User:
- Total Pendapatan: ${fmt(totalIncome)}
- Total Pengeluaran: ${fmt(totalExpense)}
- Saldo: ${fmt(totalIncome - totalExpense)}
- Jumlah Transaksi: ${transactions.length}
- Jumlah Goals: ${goals.length}
- Goals Detail: ${JSON.stringify(goals.map((g) => ({ name: g.name, target: Number(g.targetAmount), current: Number(g.currentAmount), progress: ((Number(g.currentAmount) / Number(g.targetAmount)) * 100).toFixed(1) + "%" })))}

Rules:
- type: spending_analysis, goal_recommendation, budget_advice, investment_advice
- priority: low, medium, high
- title: Judul insight yang menarik dan spesifik
- message: Analisis mendalam dengan saran konkret (minimal 2-3 kalimat)
- data: Object dengan informasi tambahan (summary, charts, recommendations)
- Gunakan data real untuk analisis, bukan generic
- Berikan insight yang actionable dan personal

Balas HANYA JSON array valid, tanpa teks lain.`;

    console.log("🚀 [DeepSeek] Calling API with prompt length:", prompt.length);
    const content = await callDeepSeek(prompt);
    console.log("📝 [DeepSeek] API Response length:", content.length);

    const insights = extractJsonArray(content).slice(0, 3);
    console.log("✅ [DeepSeek] Generated insights:", insights.length);

    // Jika tidak ada insights dari AI, buat fallback berdasarkan data
    if (insights.length === 0) {
      const fallbackInsights = [];

      if (transactions.length === 0) {
        fallbackInsights.push({
          type: "budget_advice",
          title: "Mulai Catat Transaksi",
          message: "Anda belum memiliki transaksi. Mulai catat pengeluaran dan pendapatan untuk mendapatkan insight finansial yang lebih baik.",
          priority: "high",
        });
      } else {
        const netIncome = totalIncome - totalExpense;
        if (netIncome < 0) {
          fallbackInsights.push({
            type: "spending_analysis",
            title: "Pengeluaran Melebihi Pendapatan",
            message: `Pengeluaran Anda (${fmt(totalExpense)}) melebihi pendapatan (${fmt(totalIncome)}). Pertimbangkan untuk mengurangi pengeluaran atau mencari sumber pendapatan tambahan.`,
            priority: "high",
          });
        } else {
          fallbackInsights.push({
            type: "spending_analysis",
            title: "Analisis Keuangan Positif",
            message: `Pendapatan Anda (${fmt(totalIncome)}) lebih besar dari pengeluaran (${fmt(totalExpense)}). Sisa: ${fmt(netIncome)}. Pertahankan kebiasaan baik ini!`,
            priority: "medium",
          });
        }

        if (goals.length === 0) {
          fallbackInsights.push({
            type: "goal_recommendation",
            title: "Buat Tujuan Keuangan",
            message: "Anda belum memiliki tujuan keuangan. Buat tujuan seperti tabungan darurat, liburan, atau investasi untuk masa depan yang lebih baik.",
            priority: "medium",
          });
        } else {
          const totalGoalAmount = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
          const totalCurrentAmount = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
          const progress = totalGoalAmount > 0 ? (totalCurrentAmount / totalGoalAmount) * 100 : 0;

          fallbackInsights.push({
            type: "goal_recommendation",
            title: "Progres Tujuan Keuangan",
            message: `Anda memiliki ${goals.length} tujuan dengan total target ${fmt(totalGoalAmount)}. Progres saat ini: ${progress.toFixed(1)}%. Terus semangat!`,
            priority: "medium",
          });
        }
      }

      return fallbackInsights;
    }

    return insights;
  }

  static async previewRecommendations(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { transactionDate: "desc" },
      take: 40,
    });
    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.category?.type === "expense") {
        const name = t.category?.name || "Other";
        byCategory[name] = (byCategory[name] || 0) + Number(t.amount);
      }
    }
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const top = sorted[0]?.[0] || "Other";

    const prompt = `Sebagai konsultan keuangan, analisis pola pengeluaran dan buat 3 rekomendasi personal dalam format JSON array {type,title,message,priority,amount}.

Data Pengeluaran:
- Kategori Terbesar: ${top} (${fmt(sorted[0]?.[1] || 0)})
- Total Pengeluaran: ${fmt(transactions.filter((t) => t.category?.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}
- Jumlah Transaksi: ${transactions.length}
- Kategori Lain: ${sorted
      .slice(1, 5)
      .map(([cat, amount]) => `${cat} (${fmt(amount)})`)
      .join(", ")}

Rules:
- type: spending_optimization, savings_improvement, goal_acceleration, investment_advice
- priority: low, medium, high
- title: Judul rekomendasi yang spesifik dan actionable
- message: Saran konkret dengan langkah-langkah yang bisa dilakukan (minimal 3-4 kalimat)
- amount: Estimasi penghematan atau investasi yang disarankan (opsional)
- Berikan rekomendasi yang realistis dan personal berdasarkan data user
- Fokus pada solusi praktis, bukan teori

Balas HANYA JSON array valid, tanpa teks lain.`;
    const content = await callDeepSeek(prompt);
    const recs = extractJsonArray(content).slice(0, 3);

    // Jika tidak ada rekomendasi dari AI, buat fallback berdasarkan data
    if (recs.length === 0) {
      console.log("🔄 [DeepSeek] No AI recommendations, generating fallback recommendations");
      const fallbackRecs = [];

      if (transactions.length === 0) {
        fallbackRecs.push({
          type: "savings_improvement",
          title: "Mulai Catat Pengeluaran",
          message: "Mulai catat semua pengeluaran harian untuk memahami pola spending Anda. Ini adalah langkah pertama menuju pengelolaan keuangan yang lebih baik.",
          priority: "high",
        });
      } else {
        const totalExpense = transactions.filter((t) => t.category?.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        const totalIncome = transactions.filter((t) => t.category?.type === "income").reduce((s, t) => s + Number(t.amount), 0);

        if (sorted.length > 0) {
          const [topCategory, topAmount] = sorted[0];
          fallbackRecs.push({
            type: "spending_optimization",
            title: `Optimasi Pengeluaran ${topCategory}`,
            message: `Kategori ${topCategory} adalah pengeluaran terbesar Anda (${fmt(topAmount)}). Pertimbangkan untuk mengurangi atau mencari alternatif yang lebih murah.`,
            priority: "high",
          });
        }

        if (totalIncome > 0) {
          const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
          if (savingsRate < 10) {
            fallbackRecs.push({
              type: "savings_improvement",
              title: "Tingkatkan Tingkat Tabungan",
              message: `Tingkat tabungan Anda saat ini ${savingsRate.toFixed(1)}%. Targetkan minimal 10-20% dari pendapatan untuk tabungan darurat dan investasi.`,
              priority: "medium",
            });
          }
        }

        fallbackRecs.push({
          type: "investment_advice",
          title: "Mulai Investasi",
          message: "Setelah memiliki tabungan darurat, pertimbangkan untuk mulai berinvestasi dalam instrumen yang sesuai dengan profil risiko Anda.",
          priority: "low",
        });
      }

      return fallbackRecs;
    }

    return recs;
  }
  static async generateFinancialInsights(userId: string) {
    try {
      console.log("🤖 [DeepSeek] Starting generateFinancialInsights for user:", userId);

      // Summarize recent user finance to condition the model
      const [transactions, goals] = await Promise.all([
        prisma.transaction.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { transactionDate: "desc" },
          take: 60,
        }),
        prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      ]);

      const totalIncome = transactions.filter((t) => t.category?.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = transactions.filter((t) => t.category?.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

      console.log("📊 [DeepSeek] Data summary:", {
        transactionsCount: transactions.length,
        goalsCount: goals.length,
        totalIncome,
        totalExpense,
      });

      const summary = {
        totalIncome,
        totalExpense,
        goals: goals.map((g) => ({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.targetAmount),
          currentAmount: Number(g.currentAmount),
          targetDate: g.targetDate,
        })),
      };

      const prompt = `Buat 3 insight finansial singkat berbasis data berikut dalam format JSON array berisi objek {type,title,message,priority}.
Data: ${JSON.stringify(summary)}
Rules:
- type salah satu dari: spending_analysis, goal_recommendation, budget_advice, investment_advice
- priority salah satu dari: low, medium, high
- Balas HANYA JSON valid, tanpa teks lain.`;

      console.log("🚀 [DeepSeek] Calling API with prompt length:", prompt.length);
      const content = await callDeepSeek(prompt);
      console.log("📝 [DeepSeek] API Response:", content.substring(0, 200) + "...");

      let insights: Array<{ type: string; title: string; message: string; priority: string }> = [];

      // Coba parse AI response
      if (content && content.trim()) {
        try {
          insights = extractJsonArray(content);
          console.log("🔍 [DeepSeek] Parsed insights count:", insights.length);
        } catch (e) {
          console.log("❌ [DeepSeek] Failed to parse AI response:", e);
        }
      }

      // Jika AI response kosong atau tidak valid, buat AI-generated insights berdasarkan data
      if (!insights || insights.length === 0) {
        console.log("🤖 [DeepSeek] Generating AI insights from data analysis");
        const balance = totalIncome - totalExpense;
        const fmt = (n: number) => n.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

        // Generate insights berdasarkan analisis data yang lebih cerdas
        insights = [];

        // Insight 1: Analisis arus kas
        if (totalIncome > 0 || totalExpense > 0) {
          const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
          insights.push({
            type: "spending_analysis",
            title: "Analisis Arus Kas Bulanan",
            message: `Pendapatan ${fmt(totalIncome)} vs Pengeluaran ${fmt(totalExpense)}. Saldo bulan ini ${fmt(balance)}. Tingkat tabungan ${savingsRate.toFixed(1)}%.`,
            priority: balance < 0 ? "high" : savingsRate < 10 ? "medium" : "low",
          });
        }

        // Insight 2: Analisis goals
        if (goals.length > 0) {
          const totalGoalAmount = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
          const totalCurrentAmount = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
          const goalProgress = totalGoalAmount > 0 ? (totalCurrentAmount / totalGoalAmount) * 100 : 0;

          insights.push({
            type: "goal_recommendation",
            title: "Progress Target Finansial",
            message: `Anda memiliki ${goals.length} target dengan total nilai ${fmt(totalGoalAmount)}. Progress saat ini ${goalProgress.toFixed(1)}%. ${
              goalProgress < 50 ? "Perlu akselerasi untuk mencapai target tepat waktu." : "Progress bagus, pertahankan momentum!"
            }`,
            priority: goalProgress < 30 ? "high" : goalProgress < 70 ? "medium" : "low",
          });
        }

        // Insight 3: Rekomendasi berdasarkan pola
        if (transactions.length > 0) {
          const expenseTransactions = transactions.filter((t) => t.category?.type === "expense");
          const avgExpense = expenseTransactions.length > 0 ? expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / expenseTransactions.length : 0;

          insights.push({
            type: "budget_advice",
            title: "Optimasi Pengeluaran",
            message: `Rata-rata pengeluaran per transaksi ${fmt(avgExpense)}. ${avgExpense > 500000 ? "Pertimbangkan mengurangi pengeluaran besar atau membaginya ke beberapa transaksi kecil." : "Pengeluaran per transaksi terlihat wajar."}`,
            priority: avgExpense > 1000000 ? "high" : "medium",
          });
        }

        // Jika tidak ada data, berikan insight umum
        if (insights.length === 0) {
          insights.push({
            type: "budget_advice",
            title: "Mulai Kelola Keuangan",
            message: "Belum ada data transaksi yang cukup. Mulai catat pemasukan dan pengeluaran untuk mendapatkan insight finansial yang lebih akurat.",
            priority: "low",
          });
        }

        console.log("✅ [DeepSeek] Generated", insights.length, "AI insights from data analysis");
      } else {
        console.log("✅ [DeepSeek] Using AI-generated insights from API");
      }

      const now = new Date();
      const created = [] as any[];
      for (const i of insights.slice(0, 3)) {
        try {
          const rec = await prisma.insight.create({
            data: {
              type: String(i.type || "spending_analysis"),
              title: String(i.title || "AI Insight"),
              message: String(i.message || ""),
              data: {
                summary: summary,
              },
              priority: (i.priority as any) || "medium",
              userId,
              generatedAt: now,
            },
          });
          created.push(rec);
          console.log("💾 [DeepSeek] Saved insight:", rec.title);
        } catch (e) {
          console.error("❌ [DeepSeek] Failed to save insight:", e);
        }
      }

      console.log("🎉 [DeepSeek] Generated", created.length, "insights");
      return created;
    } catch (err) {
      console.error("❌ [DeepSeek] generateFinancialInsights error:", err);
      return [];
    }
  }

  static async generateRecommendations(userId: string) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { transactionDate: "desc" },
        take: 40,
      });

      const byCategory: Record<string, number> = {};
      for (const t of transactions) {
        if (t.category?.type === "expense") {
          const name = t.category?.name || "Other";
          byCategory[name] = (byCategory[name] || 0) + Number(t.amount);
        }
      }
      const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      const top = sorted[0]?.[0] || "Other";
      const topAmount = sorted[0]?.[1] || 0;

      const prompt = `Buat 3 rekomendasi finansial singkat sebagai JSON array {type,title,message,priority}.
Fokus pada pengeluaran terbesar kategori: ${top}.
Rules:
- type salah satu dari: spending_optimization, savings_improvement, goal_acceleration, investment_advice
- priority: low|medium|high
- Balas HANYA JSON valid.`;

      const content = await callDeepSeek(prompt);
      let recs: Array<{ type: string; title: string; message: string; priority: string }> = extractJsonArray(content);
      if (!recs || recs.length === 0) {
        recs = [
          {
            type: "spending_optimization",
            title: `Kurangi ${top} 10%`,
            message: `Kategori pengeluaran terbesar Anda adalah ${top}. Mengurangi 10% dapat menghemat signifikan bulan ini.`,
            priority: "medium",
          },
        ];
      }

      const now = new Date();
      const created = [] as any[];
      for (const r of recs.slice(0, 3)) {
        try {
          const rec = await prisma.recommendation.create({
            data: {
              type: String(r.type || "spending_optimization"),
              title: String(r.title || "AI Recommendation"),
              message: String(r.message || ""),
              // Estimasikan amount sebagai 10% dari pengeluaran kategori terbesar
              amount: topAmount > 0 ? Number((topAmount * 0.1).toFixed(0)) : null,
              priority: (r.priority as any) || "medium",
              isRead: false,
              userId,
              createdAt: now,
            },
          });
          created.push(rec);
        } catch (e) {
          // swallow and continue
        }
      }
      return created;
    } catch (err) {
      console.error("generateRecommendations error:", err);
      return [];
    }
  }

  static async analyzeReportSummary(input: { reportType: string; periodStart?: string; periodEnd?: string; summary: unknown }) {
    try {
      const prompt = `Analisis ringkas dalam 3 poin (JSON array) untuk laporan ${input.reportType} dengan konteks periode ${input.periodStart || "-"} s/d ${input.periodEnd || "-"}.
Data:
${JSON.stringify(input.summary)}
Balas HANYA JSON array of {title,message,priority(low|medium|high)}.`;
      const content = await callDeepSeek(prompt);
      const arr = extractJsonArray(content);
      return Array.isArray(arr) ? arr.slice(0, 3) : [];
    } catch (e) {
      return [];
    }
  }
}
