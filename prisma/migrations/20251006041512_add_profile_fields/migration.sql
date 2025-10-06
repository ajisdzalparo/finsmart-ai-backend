-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expenseCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "incomeRange" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false;
