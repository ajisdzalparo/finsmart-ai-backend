import { prisma } from '../utils/database';

export type TemplateInput = {
  name: string;
  amount: number;
  currency: string;
  description?: string;
  frequency?: string;
  nextRunDate?: string;
  isActive?: boolean;
  categoryId?: string;
};

export function listTemplates(userId: string | undefined) {
  return prisma.transactionTemplate.findMany({ where: { userId } });
}

export function createTemplate(userId: string | undefined, input: TemplateInput) {
  return prisma.transactionTemplate.create({
    data: {
      ...input,
      nextRunDate: input.nextRunDate ? new Date(input.nextRunDate) : undefined,
      userId: userId!,
    },
  });
}


