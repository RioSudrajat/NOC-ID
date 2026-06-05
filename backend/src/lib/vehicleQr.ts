import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sha256Hex } from "./hash.js";

export const VEHICLE_QR_TYPE = "noc_vehicle_qr";
export const VEHICLE_QR_VERSION = 1;

const vehicleQrPayloadSchema = z.object({
  type: z.literal(VEHICLE_QR_TYPE),
  version: z.literal(VEHICLE_QR_VERSION),
  token: z.string().min(32),
  vehicleId: z.string().min(1),
  expiresAt: z.string().datetime()
});

export type VehicleQrPayload = z.infer<typeof vehicleQrPayloadSchema>;

export function generateVehicleQrToken() {
  return randomBytes(32).toString("base64url");
}

export function hashVehicleQrToken(token: string) {
  return sha256Hex(token);
}

export function buildVehicleQrPayload(input: { token: string; vehicleId: string; expiresAt: Date }): VehicleQrPayload {
  return {
    type: VEHICLE_QR_TYPE,
    version: VEHICLE_QR_VERSION,
    token: input.token,
    vehicleId: input.vehicleId,
    expiresAt: input.expiresAt.toISOString()
  };
}

export function parseVehicleQrPayload(input: unknown) {
  const candidate = typeof input === "string" ? JSON.parse(input) : input;
  return vehicleQrPayloadSchema.parse(candidate);
}
