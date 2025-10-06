import { prisma } from "../utils/database";

export async function getDashboardData(userId: string) {
  const [income, expense, recent] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        category: { is: { type: "income" } },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        category: { is: { type: "expense" } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        category: { isNot: null }, // Hanya ambil transaksi yang memiliki category
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        category: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    }),
  ]);

  // Hapus categoryId dari setiap transaction
  const recentWithoutCategoryId = recent.map((transaction) => {
    const { categoryId, ...transactionWithoutCategoryId } = transaction;
    return transactionWithoutCategoryId;
  });

  return {
    totals: {
      income: Number(income._sum.amount) || 0,
      expense: Number(expense._sum.amount) || 0,
    },
    recent: recentWithoutCategoryId,
  };
}
