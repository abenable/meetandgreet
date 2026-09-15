-- Remove profile boost feature: drop boost columns and the composite index
-- that ordered the first discovery page by boostedUntil.
DROP INDEX IF EXISTS "Profile_discoveryMode_boostedUntil_idx";
CREATE INDEX "Profile_discoveryMode_idx" ON "Profile"("discoveryMode");

ALTER TABLE "Profile" DROP COLUMN IF EXISTS "boostedUntil";
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "lastBoostedAt";
