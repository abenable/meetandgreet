-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "maxAttendees" INTEGER,
ADD COLUMN     "startsAt" TIMESTAMP(3);
