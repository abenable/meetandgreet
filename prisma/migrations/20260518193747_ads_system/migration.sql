CREATE TABLE IF NOT EXISTS "AdView" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "reward" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdView_userId_type_createdAt_idx" ON "AdView"("userId", "type", "createdAt");
