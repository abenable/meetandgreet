-- Phase 2: Engagement & Gamification

-- Event posts
CREATE TABLE "EventPost" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPost_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EventPost_eventId_createdAt_idx" ON "EventPost"("eventId", "createdAt");
ALTER TABLE "EventPost" ADD CONSTRAINT "EventPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mystery mode
ALTER TABLE "Event" ADD COLUMN     "mysteryMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EventMatch" ADD COLUMN "messagesUnlockedAt" TIMESTAMP(3);

-- Voice messages
ALTER TABLE "EventMessage" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "EventMessage" ADD COLUMN "audioUrl" TEXT;

-- Badges & streaks
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserBadge_userId_type_key" ON "UserBadge"("userId", "type");
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN     "streakCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN     "lastActiveDate" TIMESTAMP(3);
