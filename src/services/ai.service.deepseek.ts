import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

interface DeepSeekChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
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
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in environment");
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
      throw new Error(`DeepSeek empty or invalid response`);
    }
    return data?.choices?.[0]?.message?.content || "";
  } catch (err: any) {
    const status = err?.response?.status;
    const body = typeof err?.response?.data === "string" ? err.response.data : JSON.stringify(err?.response?.data || {});
    console.error("DeepSeek API error:", status, body);
    throw new Error(`DeepSeek request failed${status ? ` (status ${status})` : ""}`);
  }
}

export class DeepseekAIService {
  static async generateFinancialInsights(userId: string) {
    try {
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

      const content = await callDeepSeek(prompt);
      let insights: Array<{ type: string; title: string; message: string; priority: string }> = extractJsonArray(content);
      if (!insights || insights.length === 0) {
        // Fallback default insights jika model gagal/format tidak valid
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
        } catch (e) {
          // swallow and continue
        }
      }
      return created;
    } catch (err) {
      console.error("generateFinancialInsights error:", err);
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
