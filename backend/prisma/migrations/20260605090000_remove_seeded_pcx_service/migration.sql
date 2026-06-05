DELETE FROM "Payment"
WHERE "invoiceId" IN (
  SELECT i.id
  FROM "Invoice" i
  JOIN "Booking" b ON b.id = i."bookingId"
  JOIN "Vehicle" v ON v.id = b."vehicleId"
  WHERE v.vin = 'NOCDEVNETVIN001'
    AND b.complaint = 'Routine devnet service and brake inspection'
);

DELETE FROM "Invoice"
WHERE "bookingId" IN (
  SELECT b.id
  FROM "Booking" b
  JOIN "Vehicle" v ON v.id = b."vehicleId"
  WHERE v.vin = 'NOCDEVNETVIN001'
    AND b.complaint = 'Routine devnet service and brake inspection'
);

UPDATE "VehicleQrToken"
SET "bookingId" = NULL
WHERE "bookingId" IN (
  SELECT b.id
  FROM "Booking" b
  JOIN "Vehicle" v ON v.id = b."vehicleId"
  WHERE v.vin = 'NOCDEVNETVIN001'
    AND b.complaint = 'Routine devnet service and brake inspection'
);

DELETE FROM "Booking"
WHERE id IN (
  SELECT b.id
  FROM "Booking" b
  JOIN "Vehicle" v ON v.id = b."vehicleId"
  WHERE v.vin = 'NOCDEVNETVIN001'
    AND b.complaint = 'Routine devnet service and brake inspection'
);
