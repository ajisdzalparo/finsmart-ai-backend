import { prisma } from "../utils/database";

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

export function getGoalById(id: string, userId: string | undefined) {
  return prisma.goal.findFirst({
    where: {
      id,
      userId,
    },
  });
}

export function updateGoal(id: string, userId: string | undefined, input: Partial<GoalInput>) {
  return prisma.goal.update({
    where: {
      id,
      userId,
    },
    data: {
      ...input,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
    },
  });
}

export function deleteGoal(id: string, userId: string | undefined) {
  return prisma.goal.delete({
    where: {
      id,
      userId,
    },
  });
}

export async function addMoneyToGoal(id: string, userId: string | undefined, amount: number) {
  // Get goal details first
  const goal = await getGoalById(id, userId);
  if (!goal) {
    throw new Error('Goal not found');
  }

  // Create transaction record for the goal contribution
  const transaction = await prisma.transaction.create({
    data: {
      amount: amount,
      currency: 'IDR',
      description: `Goal Contribution: ${goal.name}`,
      transactionDate: new Date(),
      userId: userId!,
      categoryId: null, // Goals don't need category
      isRecurring: false,
      autoCategorized: false,
    },
  });

  // Update goal with new amount
  const updatedGoal = await prisma.goal.update({
    where: {
      id,
      userId,
    },
    data: {
      currentAmount: {
        increment: amount,
      },
    },
  });

  return {
    goal: updatedGoal,
    transaction: transaction,
  };
}
