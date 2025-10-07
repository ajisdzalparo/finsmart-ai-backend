-- Create Recommendation table to match current Prisma schema

CREATE TABLE IF NOT EXISTS "Recommendation" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'spending_optimization',
  "title" TEXT NOT NULL DEFAULT 'AI Recommendation',
  "message" TEXT NOT NULL DEFAULT 'AI recommendation in progress',
  "amount" DECIMAL(65,30),
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- Add FK to User if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Recommendation_userId_fkey'
      AND table_name = 'Recommendation'
  ) THEN
    ALTER TABLE "Recommendation"
      ADD CONSTRAINT "Recommendation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;


