ALTER TABLE "Profile" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "notifyMessages" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "notifyFriends" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "notifyMatches" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "notifyEvents" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Profile_hidden_discoveryMode_idx" ON "Profile" ("hidden", "discoveryMode");
