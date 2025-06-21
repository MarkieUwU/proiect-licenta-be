-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "data" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
