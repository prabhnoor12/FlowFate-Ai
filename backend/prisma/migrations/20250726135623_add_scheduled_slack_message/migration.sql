/*
  Warnings:

  - You are about to drop the column `cc` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `slackChannel` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `slackToken` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `cc` on the `Transcript` table. All the data in the column will be lost.
  - You are about to drop the column `slackChannel` on the `Transcript` table. All the data in the column will be lost.
  - You are about to drop the column `slackToken` on the `Transcript` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "cc",
DROP COLUMN "slackChannel",
DROP COLUMN "slackToken";

-- AlterTable
ALTER TABLE "Transcript" DROP COLUMN "cc",
DROP COLUMN "slackChannel",
DROP COLUMN "slackToken";

-- CreateTable
CREATE TABLE "ScheduledSlackMessage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workspace" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledSlackMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledSlackMessage" ADD CONSTRAINT "ScheduledSlackMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
