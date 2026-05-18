ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "lastBoostedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "DailySwipeLimit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailySwipeLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailySwipeLimit_userId_eventId_date_key" ON "DailySwipeLimit"("userId", "eventId", "date");
