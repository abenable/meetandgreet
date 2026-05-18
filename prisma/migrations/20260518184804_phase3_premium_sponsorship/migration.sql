-- Add subscription tier fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);

-- Add boostedUntil to Profile
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);

-- Add sponsor fields to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sponsorName" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sponsorLogo" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sponsorFrameUrl" TEXT;
