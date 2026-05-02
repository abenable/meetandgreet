-- Add isPublic column to Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Add photo column to Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "photo" TEXT;
