-- CreateTable
CREATE TABLE "VehicleQrToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "includeServiceHistory" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "consumedByWorkshopId" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleQrToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleQrToken_tokenHash_key" ON "VehicleQrToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleQrToken_bookingId_key" ON "VehicleQrToken"("bookingId");

-- CreateIndex
CREATE INDEX "VehicleQrToken_vehicleId_idx" ON "VehicleQrToken"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleQrToken_issuedByUserId_idx" ON "VehicleQrToken"("issuedByUserId");

-- CreateIndex
CREATE INDEX "VehicleQrToken_expiresAt_idx" ON "VehicleQrToken"("expiresAt");

-- CreateIndex
CREATE INDEX "VehicleQrToken_consumedByWorkshopId_idx" ON "VehicleQrToken"("consumedByWorkshopId");

-- AddForeignKey
ALTER TABLE "VehicleQrToken" ADD CONSTRAINT "VehicleQrToken_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleQrToken" ADD CONSTRAINT "VehicleQrToken_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleQrToken" ADD CONSTRAINT "VehicleQrToken_consumedByWorkshopId_fkey" FOREIGN KEY ("consumedByWorkshopId") REFERENCES "Workshop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleQrToken" ADD CONSTRAINT "VehicleQrToken_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
