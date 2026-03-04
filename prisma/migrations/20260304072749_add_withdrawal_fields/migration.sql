-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "fee" DECIMAL(12,2);
