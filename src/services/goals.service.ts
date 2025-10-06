import { prisma } from '../utils/database';

export type GoalInput = {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  goalType: string;
  isActive?: boolean;
};

export function listGoals(userId: string | undefined) {
  return prisma.goal.findMany({ where: { userId } });
}

export function createGoal(userId: string | undefined, input: GoalInput) {
  return prisma.goal.create({
    data: {
      ...input,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      userId: userId!,
    },
  });
}


