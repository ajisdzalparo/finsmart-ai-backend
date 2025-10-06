import { prisma } from '../utils/database';

export type ReportInput = {
  reportType: string;
  periodStart?: string;
  periodEnd?: string;
  exportFormat?: string;
};

export async function createReport(userId: string | undefined, input: ReportInput) {
  const where: any = {
    userId,
    transactionDate: {
      gte: input.periodStart ? new Date(input.periodStart) : undefined,
      lte: input.periodEnd ? new Date(input.periodEnd) : undefined,
    },
  };

  const byCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    _sum: { amount: true },
    where,
  });

  return prisma.report.create({
    data: {
      userId: userId!,
      reportType: input.reportType,
      periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
      exportFormat: input.exportFormat,
      summary: JSON.stringify(byCategory),
    },
  });
}


