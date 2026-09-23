CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

CREATE INDEX "Friendship_addresseeId_status_createdAt_idx" ON "Friendship"("addresseeId", "status", "createdAt");

CREATE INDEX "Friendship_requesterId_status_createdAt_idx" ON "Friendship"("requesterId", "status", "createdAt");

CREATE UNIQUE INDEX "Friendship_pair_key"
    ON "Friendship" (LEAST("requesterId", "addresseeId"), GREATEST("requesterId", "addresseeId"));

ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Friendship" ("id", "requesterId", "addresseeId", "status", "createdAt", "respondedAt")
SELECT DISTINCT ON (LEAST(m."user1Id", m."user2Id"), GREATEST(m."user1Id", m."user2Id"))
       gen_random_uuid()::text,
       m."user1Id",
       m."user2Id",
       'accepted',
       m."createdAt",
       m."createdAt"
FROM "EventMatch" m
WHERE m."user1Id" <> m."user2Id"
ORDER BY LEAST(m."user1Id", m."user2Id"),
         GREATEST(m."user1Id", m."user2Id"),
         m."createdAt" ASC;

INSERT INTO "Friendship" ("id", "requesterId", "addresseeId", "status", "createdAt")
SELECT DISTINCT ON (LEAST(s."swiperId", s."swipedId"), GREATEST(s."swiperId", s."swipedId"))
       gen_random_uuid()::text,
       s."swiperId",
       s."swipedId",
       'pending',
       s."createdAt"
FROM "EventSwipe" s
WHERE s."direction" IN ('like', 'super')
  AND s."swiperId" <> s."swipedId"
  AND NOT EXISTS (
      SELECT 1
      FROM "Friendship" f
      WHERE LEAST(f."requesterId", f."addresseeId") = LEAST(s."swiperId", s."swipedId")
        AND GREATEST(f."requesterId", f."addresseeId") = GREATEST(s."swiperId", s."swipedId")
  )
ORDER BY LEAST(s."swiperId", s."swipedId"),
         GREATEST(s."swiperId", s."swipedId"),
         s."createdAt" ASC;

UPDATE "Notification" SET "link" = '/friends' WHERE "link" = '/likes';
