import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@finsmart.local";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  await prisma.profile.create({
    data: { name: "Demo User", age: 30, userId: user.id },
  });

  await prisma.insight.create({
    data: {
      insightType: "trend",
      data: { message: "Spending increased 10% last month" },
      userId: user.id,
    },
  });

  // seed a few categories and transactions
  const food = await prisma.category.create({ data: { name: "Food & Dining", type: "expense", userId: user.id } });
  const salary = await prisma.category.create({ data: { name: "Salary", type: "income", userId: user.id } });

  await prisma.transaction.createMany({
    data: [
      { amount: 2000, currency: "USD", description: "Monthly salary", transactionDate: new Date(), userId: user.id, categoryId: salary.id, isRecurring: true, autoCategorized: true },
      { amount: 120, currency: "USD", description: "Restaurant", transactionDate: new Date(), userId: user.id, categoryId: food.id, isRecurring: false, autoCategorized: false },
      { amount: 80, currency: "USD", description: "Groceries", transactionDate: new Date(), userId: user.id, categoryId: food.id, isRecurring: false, autoCategorized: false },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // Use globalThis.process to avoid "Cannot find name 'process'" error in some environments
    if (typeof globalThis.process !== "undefined") {
      globalThis.process.exit(1);
    } else {
      throw e;
    }
  });
