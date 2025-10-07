import { prisma } from "../utils/database";
import { DeepseekAIService } from "./ai.service.deepseek";
import { GeminiAIService } from "./ai.service.gemini";
import cron from "node-cron";

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  status: "active" | "inactive";
  lastRun: Date | null;
  nextRun: Date | null;
  job?: any;
  userId?: string;
}

export class AISchedulerService {
  private static tasks: Map<string, ScheduledTask> = new Map();

  static initialize() {
    // Daily insights generation - every day at 8 AM
    this.scheduleTask("daily-insights", "0 8 * * *", async () => {
      await this.generateInsightsForAllUsers();
    });

    // Weekly recommendations - every Monday at 9 AM
    this.scheduleTask("weekly-recommendations", "0 9 * * 1", async () => {
      await this.generateRecommendationsForAllUsers();
    });

    // Monthly analysis - 1st of every month at 10 AM
    this.scheduleTask("monthly-analysis", "0 10 1 * *", async () => {
      await this.generateMonthlyAnalysisForAllUsers();
    });
  }

  private static scheduleTask(id: string, cronExpression: string, task: () => Promise<void>) {
    const job = cron.schedule(
      cronExpression,
      async () => {
        try {
          await task();
        } catch (error) {
          console.error(`❌ Error in scheduled task ${id}:`, error);
        }
      },
      {
        timezone: "Asia/Jakarta",
      }
    );

    this.tasks.set(id, {
      id,
      name: this.getTaskName(id),
      schedule: cronExpression,
      status: "active",
      lastRun: null,
      nextRun: this.getNextRunTime(cronExpression),
      job,
    });

    job.start();
  }

  private static getTaskName(id: string): string {
    const names: Record<string, string> = {
      "daily-insights": "Daily AI Insights Generation",
      "weekly-recommendations": "Weekly AI Recommendations",
      "monthly-analysis": "Monthly Financial Analysis",
    };
    return names[id] || id;
  }

  private static getNextRunTime(cronExpression: string): Date {
    // Simple implementation - in production, use a proper cron parser
    const now = new Date();
    const next = new Date(now);

    if (cronExpression.includes("0 8 * * *")) {
      // Daily at 8 AM
      next.setHours(8, 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else if (cronExpression.includes("0 9 * * 1")) {
      // Weekly on Monday at 9 AM
      const daysUntilMonday = (1 - now.getDay() + 7) % 7;
      next.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
      next.setHours(9, 0, 0, 0);
    } else if (cronExpression.includes("0 10 1 * *")) {
      // Monthly on 1st at 10 AM
      next.setMonth(now.getMonth() + 1);
      next.setDate(1);
      next.setHours(10, 0, 0, 0);
    }

    return next;
  }

  private static async generateInsightsForAllUsers() {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
      });

      for (const user of users) {
        try {
          // Generate insights using DeepSeek AI
          await DeepseekAIService.generateFinancialInsights(user.id);
        } catch (error) {
          console.error(`❌ Failed to generate insights for user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error in generateInsightsForAllUsers:", error);
    }
  }

  private static async generateRecommendationsForAllUsers() {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
      });

      for (const user of users) {
        try {
          // Generate recommendations using DeepSeek AI
          await DeepseekAIService.generateRecommendations(user.id);
        } catch (error) {
          console.error(`❌ Failed to generate recommendations for user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error in generateRecommendationsForAllUsers:", error);
    }
  }

  private static async generateMonthlyAnalysisForAllUsers() {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
      });

      for (const user of users) {
        try {
          // Generate both insights and recommendations for monthly analysis
          await DeepseekAIService.generateFinancialInsights(user.id);
          await DeepseekAIService.generateRecommendations(user.id);
        } catch (error) {
          console.error(`❌ Failed to generate monthly analysis for user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error in generateMonthlyAnalysisForAllUsers:", error);
    }
  }

  static getScheduledTasks(): any[] {
    return Array.from(this.tasks.values()).map((task) => ({
      id: task.id,
      name: task.name,
      schedule: task.schedule,
      status: task.status,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
      // Exclude job object to avoid circular reference
    }));
  }

  static getTaskStatus(id: string): any | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    return {
      id: task.id,
      name: task.name,
      schedule: task.schedule,
      status: task.status,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
      // Exclude job object to avoid circular reference
    };
  }

  static async runTaskNow(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task || task.status !== "active") {
      return false;
    }

    try {
      switch (id) {
        case "daily-insights":
          await this.generateInsightsForAllUsers();
          break;
        case "weekly-recommendations":
          await this.generateRecommendationsForAllUsers();
          break;
        case "monthly-analysis":
          await this.generateMonthlyAnalysisForAllUsers();
          break;
        default:
          return false;
      }

      // Update last run time
      task.lastRun = new Date();
      task.nextRun = this.getNextRunTime(task.schedule);

      return true;
    } catch (error) {
      console.error(`❌ Error running task ${id}:`, error);
      return false;
    }
  }

  static async toggleTask(taskId: string, activate: boolean): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        console.error(`❌ Task ${taskId} not found`);
        return false;
      }

      if (activate) {
        // Start the task
        task.job?.start();
        task.status = "active";
      } else {
        // Stop the task
        task.job?.stop();
        task.status = "inactive";
      }

      return true;
    } catch (error) {
      console.error(`❌ Error toggling task ${taskId}:`, error);
      return false;
    }
  }
}
