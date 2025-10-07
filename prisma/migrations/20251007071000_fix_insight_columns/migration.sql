-- Add missing columns to match current Prisma schema and migrate data

-- 1) Add new columns if they don't exist yet
ALTER TABLE "Insight" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "Insight" ADD COLUMN IF NOT EXISTS "title" TEXT DEFAULT 'AI Insight' NOT NULL;
ALTER TABLE "Insight" ADD COLUMN IF NOT EXISTS "message" TEXT DEFAULT 'AI analysis in progress' NOT NULL;
ALTER TABLE "Insight" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'medium' NOT NULL;

-- 2) Backfill `type` from legacy `insightType` if present
UPDATE "Insight"
SET "type" = COALESCE("type", "insightType")
WHERE "insightType" IS NOT NULL;

-- 3) Ensure `type` is not null going forward
ALTER TABLE "Insight" ALTER COLUMN "type" SET NOT NULL;

-- 4) Drop legacy column if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Insight' AND column_name = 'insightType'
  ) THEN
    ALTER TABLE "Insight" DROP COLUMN "insightType";
  END IF;
END$$;


