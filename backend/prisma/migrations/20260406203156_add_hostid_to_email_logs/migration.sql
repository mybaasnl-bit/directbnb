-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "hostId" TEXT;

-- CreateIndex
CREATE INDEX "email_logs_hostId_idx" ON "email_logs"("hostId");
