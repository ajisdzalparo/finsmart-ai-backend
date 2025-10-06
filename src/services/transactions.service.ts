import { prisma } from "../utils/database";

export type TransactionInput = {
  amount: number;
  currency: string;
  description?: string;
  transactionDate: string;
  categoryId?: string;
  templateId?: string;
};

export function listTransactions(userId: string | undefined) {
  return prisma.transaction.findMany({ where: { userId }, orderBy: { transactionDate: "desc" } });
}

export function createQuickTransaction(userId: string | undefined, input: TransactionInput) {
  return prisma.transaction.create({
    data: {
      ...input,
      transactionDate: new Date(input.transactionDate),
      userId: userId!,
    },
  });
}

export function createBatch(userId: string | undefined, description: string | undefined) {
  return prisma.transactionBatch.create({ data: { description, userId: userId! } });
}

export function createBatchItems(userId: string | undefined, batchId: string, items: TransactionInput[]) {
  return prisma.$transaction(
    items.map((t) =>
      prisma.transaction.create({
        data: {
          ...t,
          transactionDate: new Date(t.transactionDate),
          userId: userId!,
          batchId,
        },
      })
    )
  );
}

export function getTransactionById(userId: string | undefined, transactionId: string) {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId: userId!,
    },
    include: {
      category: true,
    },
  });
}

export function updateTransaction(userId: string | undefined, transactionId: string, input: Partial<TransactionInput>) {
  return prisma.transaction.update({
    where: {
      id: transactionId,
      userId: userId!,
    },
    data: {
      ...input,
      transactionDate: input.transactionDate ? new Date(input.transactionDate) : undefined,
    },
    include: {
      category: true,
    },
  });
}

export function deleteTransaction(userId: string | undefined, transactionId: string) {
  return prisma.transaction.delete({
    where: {
      id: transactionId,
      userId: userId!,
    },
  });
}

export function getTransactionsByCategory(userId: string | undefined, categoryId: string) {
  return prisma.transaction.findMany({
    where: {
      userId,
      categoryId,
    },
    orderBy: { transactionDate: "desc" },
    include: {
      category: true,
    },
  });
}

export async function checkTransactionNameUnique(userId: string | undefined, description: string, categoryId: string, excludeId?: string) {
  const whereClause: any = {
    userId,
    description,
    categoryId,
  };

  // Jika ada excludeId (untuk update), exclude transaksi tersebut
  if (excludeId) {
    whereClause.id = { not: excludeId };
  }

  const existingTransaction = await prisma.transaction.findFirst({
    where: whereClause,
    include: {
      category: true,
    },
  });

  return existingTransaction;
}
