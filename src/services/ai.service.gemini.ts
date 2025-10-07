import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function extractJsonArray(text: string): any[] {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start >= 0 && end >= 0 && end > start) {
      const sliced = text.slice(start, end + 1);
      return JSON.parse(sliced);
    }
    return JSON.parse(text);
  } catch (e) {
    // fallback to single object
    try {
      return [JSON.parse(text)];
    } catch {
      return [];
    }
  }
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment");
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const { data } = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          response_mime_type: "application/json",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 20000,
        validateStatus: () => true,
      }
    );

    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  } catch (err: any) {
    const status = err?.response?.status;
    const body = typeof err?.response?.data === "string" ? err.response.data : JSON.stringify(err?.response?.data || {});
    console.error("Gemini API error:", status, body);
    throw new Error(`Gemini request failed${status ? ` (status ${status})` : ""}`);
  }
}

export class GeminiAIService {
  static async generateFinancialInsights(userId: string) {
    try {
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

      const prompt = `Buat 3 insight finansial singkat berbasis data berikut dalam format JSON array berisi objek {type,title,message,priority}.
Data: ${JSON.stringify(summary)}
Rules:
- type salah satu dari: spending_analysis, goal_recommendation, budget_advice, investment_advice
- priority salah satu dari: low, medium, high
- Balas HANYA JSON valid, tanpa teks lain.`;

      const content = await callGemini(prompt);
      let insights: Array<{ type: string; title: string; message: string; priority: string }> = extractJsonArray(content);
      if (!insights || insights.length === 0) {
        const balance = totalIncome - totalExpense;
        insights = [
          {
            type: "spending_analysis",
            title: "Ringkasan Arus Kas",
            message: `Pendapatan ${Math.round(totalIncome)} vs Pengeluaran ${Math.round(totalExpense)}. Saldo bulan ini ${Math.round(balance)}.`,
            priority: balance < 0 ? "high" : balance < totalIncome * 0.1 ? "medium" : "low",
          },
          {
            type: "budget_advice",
            title: "Optimasi Pengeluaran",
            message: "Pertimbangkan menetapkan batas pengeluaran bulanan dan pantau kategori terbesar Anda.",
            priority: "medium",
          },
          {
            type: "goal_recommendation",
            title: "Akselerasi Target Tabungan",
            message: "Sisihkan minimal 10% dari pendapatan ke tabungan atau tujuan finansial utama Anda.",
            priority: "low",
          },
        ];
      }

      const now = new Date();
      const created: any[] = [];
      for (const i of insights.slice(0, 3)) {
        try {
          const insight = await prisma.insight.create({
            data: {
              userId,
              title: String(i.title || "AI Insight"),
              message: String(i.message || ""),
              type: String(i.type || "spending_analysis"),
              priority: (i.priority as any) || "medium",
              data: {
                summary: summary,
              },
              generatedAt: now,
            },
          });
          created.push(insight);
        } catch {}
      }
      return created;
    } catch (err) {
      console.error("generateFinancialInsights (Gemini) error:", err);
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

      const content = await callGemini(prompt);
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
      const created: any[] = [];
      for (const r of recs.slice(0, 3)) {
        try {
          const rec = await prisma.recommendation.create({
            data: {
              type: String(r.type || "spending_optimization"),
              title: String(r.title || "AI Recommendation"),
              message: String(r.message || ""),
              amount: topAmount > 0 ? Number((topAmount * 0.1).toFixed(0)) : null,
              priority: (r.priority as any) || "medium",
              isRead: false,
              userId,
              createdAt: now,
            },
          });
          created.push(rec);
        } catch {}
      }
      return created;
    } catch (err) {
      console.error("generateRecommendations (Gemini) error:", err);
      return [];
    }
  }
}
