/*
  Warnings:

  - You are about to drop the column `appleBundleId` on the `App` table. All the data in the column will be lost.
  - You are about to drop the column `appleIssuerId` on the `App` table. All the data in the column will be lost.
  - You are about to drop the column `appleKeyId` on the `App` table. All the data in the column will be lost.
  - You are about to drop the column `applePrivateKey` on the `App` table. All the data in the column will be lost.
  - You are about to drop the column `iapExclusivityAcknowledgedAt` on the `App` table. All the data in the column will be lost.
  - You are about to drop the column `setupChecklist` on the `App` table. All the data in the column will be lost.
  - You are about to drop the column `appleExternalPurchaseToken` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `appleReportError` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `appleReportStatus` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `appleReportedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `RegulatoryUpdate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegulatoryUpdateRead` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RegulatoryUpdateRead" DROP CONSTRAINT "RegulatoryUpdateRead_updateId_fkey";

-- DropIndex
DROP INDEX "Transaction_appleReportStatus_idx";

-- AlterTable
ALTER TABLE "App" DROP COLUMN "appleBundleId",
DROP COLUMN "appleIssuerId",
DROP COLUMN "appleKeyId",
DROP COLUMN "applePrivateKey",
DROP COLUMN "iapExclusivityAcknowledgedAt",
DROP COLUMN "setupChecklist",
ADD COLUMN     "plan" TEXT,
ADD COLUMN     "revenueTier" TEXT;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "appleExternalPurchaseToken",
DROP COLUMN "appleReportError",
DROP COLUMN "appleReportStatus",
DROP COLUMN "appleReportedAt";

-- DropTable
DROP TABLE "RegulatoryUpdate";

-- DropTable
DROP TABLE "RegulatoryUpdateRead";

-- DropEnum
DROP TYPE "AppleReportStatus";
