-- AlterTable
ALTER TABLE "App" ADD COLUMN     "iapExclusivityAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "setupChecklist" JSONB;

-- CreateTable
CREATE TABLE "RegulatoryUpdate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionRequired" TEXT,

    CONSTRAINT "RegulatoryUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryUpdateRead" (
    "id" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,

    CONSTRAINT "RegulatoryUpdateRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegulatoryUpdateRead_clerkUserId_idx" ON "RegulatoryUpdateRead"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryUpdateRead_updateId_clerkUserId_key" ON "RegulatoryUpdateRead"("updateId", "clerkUserId");

-- AddForeignKey
ALTER TABLE "RegulatoryUpdateRead" ADD CONSTRAINT "RegulatoryUpdateRead_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "RegulatoryUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
