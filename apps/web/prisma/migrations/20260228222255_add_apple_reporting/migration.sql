-- CreateEnum
CREATE TYPE "AppleReportStatus" AS ENUM ('PENDING', 'REPORTED', 'FAILED');

-- AlterTable
ALTER TABLE "App" ADD COLUMN     "appleBundleId" TEXT,
ADD COLUMN     "appleIssuerId" TEXT,
ADD COLUMN     "appleKeyId" TEXT,
ADD COLUMN     "applePrivateKey" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "appleExternalPurchaseToken" TEXT,
ADD COLUMN     "appleReportError" TEXT,
ADD COLUMN     "appleReportStatus" "AppleReportStatus",
ADD COLUMN     "appleReportedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Transaction_appleReportStatus_idx" ON "Transaction"("appleReportStatus");
