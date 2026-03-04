-- AlterTable
ALTER TABLE "Bet" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Bet_status_idx" ON "Bet"("status");
