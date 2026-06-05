-- Store devnet component origin proofs linked to booking/invoice/service flow.
CREATE TABLE "ComponentOriginVerification" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "serviceLogId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "partsHash" TEXT NOT NULL,
    "catalogHash" TEXT NOT NULL,
    "invoiceHash" TEXT NOT NULL,
    "verifiedPartCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recordPda" TEXT,
    "txSignature" TEXT,
    "explorerUrl" TEXT,
    "signerWallet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentOriginVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComponentOriginVerification_bookingId_key" ON "ComponentOriginVerification"("bookingId");
CREATE INDEX "ComponentOriginVerification_vehicleId_idx" ON "ComponentOriginVerification"("vehicleId");
CREATE INDEX "ComponentOriginVerification_workshopId_idx" ON "ComponentOriginVerification"("workshopId");
CREATE INDEX "ComponentOriginVerification_status_idx" ON "ComponentOriginVerification"("status");
