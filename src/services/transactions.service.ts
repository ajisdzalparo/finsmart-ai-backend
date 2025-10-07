import { prisma } from "../utils/database";

export type TransactionInput = {
  amount: number;
  currency: string;
  description?: string;
  transactionDate: string;
  categoryId?: string;
  templateId?: string;
  // Optional: alokasikan sebagian/seluruh transaksi ke satu/lebih goals
  goalAllocations?: Array<{
    goalId: string;
    amount: number;
  }>;
};

export function listTransactions(userId: string | undefined) {
  return prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function listTransactionsPaginated(
  userId: string | undefined,
  page: number,
  limit: number,
  options?: {
    type?: "income" | "expense" | "transfer" | "all";
    q?: string;
  }
) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
  const skip = (safePage - 1) * safeLimit;

  const whereClause: any = { userId };

  // Filter berdasarkan tipe kategori jika disediakan
  const type = options?.type && options.type !== "all" ? options.type : undefined;
  if (type) {
    whereClause.category = { ...(whereClause.category || {}), type };
  }

  // Pencarian dengan q pada description atau nama kategori (case-insensitive)
  const q = options?.q?.trim();
  if (q) {
    const orConditions: any[] = [{ description: { contains: q, mode: "insensitive" } }, { category: { name: { contains: q, mode: "insensitive" } } }];
    whereClause.OR = orConditions;
  }

  const [total, items] = await Promise.all([
    prisma.transaction.count({ where: whereClause }),
    prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
      include: { category: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return { items, total, page: safePage, limit: safeLimit, totalPages };
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

export async function createBatchItems(userId: string | undefined, batchId: string, items: TransactionInput[]) {
  // Buat semua transaksi terlebih dahulu
  const created = await prisma.$transaction(
    items.map((t) =>
      prisma.transaction.create({
        data: {
          amount: t.amount,
          currency: t.currency,
          description: t.description,
          transactionDate: new Date(t.transactionDate),
          categoryId: t.categoryId ?? null,
          templateId: t.templateId ?? null,
          userId: userId!,
          batchId,
        },
      })
    )
  );

  // Setelah transaksi dibuat, proses alokasi ke goals (jika ada)
  const allocationOps: any[] = [];

  items.forEach((t, idx) => {
    const allocs = t.goalAllocations || [];
    if (!allocs.length) return;

    // Validasi sederhana: amount alokasi tidak melampaui amount transaksi
    const totalAlloc = allocs.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    if (totalAlloc > Number(t.amount)) {
      // Jika melebihi, batalkan seluruh batch dengan melempar error
      throw new Error("Total alokasi goal melebihi jumlah transaksi");
    }

    // Siapkan increment currentAmount per goal
    for (const a of allocs) {
      if (!a.goalId || !(Number(a.amount) > 0)) continue;
      allocationOps.push(
        prisma.goal.update({
          where: { id: a.goalId, userId: userId! },
          data: { currentAmount: { increment: Number(a.amount) } },
        })
      );
    }
  });

  if (allocationOps.length > 0) {
    await prisma.$transaction(allocationOps as any);
  }

  return created;
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
    orderBy: { createdAt: "desc" },
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
