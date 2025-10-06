import { prisma } from '../utils/database';

export type InsightInput = {
  insightType: string;
  data: any;
};

export function listInsights(userId: string | undefined) {
  return prisma.insight.findMany({ where: { userId } });
}

export function createInsight(userId: string | undefined, input: InsightInput) {
  return prisma.insight.create({ data: { ...input, userId: userId! } });
}


