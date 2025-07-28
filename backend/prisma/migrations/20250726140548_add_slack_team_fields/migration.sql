/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider,teamId]` on the table `UserIntegration` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserIntegration_userId_provider_key";

-- AlterTable
ALTER TABLE "UserIntegration" ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "teamName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserIntegration_userId_provider_teamId_key" ON "UserIntegration"("userId", "provider", "teamId");
