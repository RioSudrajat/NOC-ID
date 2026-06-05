import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildVehicleQrPayload, hashVehicleQrToken } from "../src/lib/vehicleQr.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://noc:noc@localhost:5432/noc_test";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-jwt";
process.env.VEHICLE_QR_EXPIRY_SECONDS = "300";

const prismaMock = vi.hoisted(() => {
  const client: {
    user: { findUnique: ReturnType<typeof vi.fn> };
    vehicle: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
    vehicleQrToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    workshop: { findUnique: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
    booking: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    txReceipt: { findMany: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  } = {
    user: { findUnique: vi.fn() },
    vehicle: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    vehicleQrToken: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    workshop: { findUnique: vi.fn(), findFirst: vi.fn() },
    booking: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    txReceipt: { findMany: vi.fn() },
    $transaction: vi.fn()
  };
  client.$transaction.mockImplementation(async (callback: (tx: typeof client) => unknown) => callback(client));
  return client;
});

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(sensible);
  await app.register(jwt, { secret: process.env.JWT_SECRET! });
  const { registerVehiclesRoutes } = await import("../src/modules/vehicles/routes.js");
  const { registerBookingsRoutes } = await import("../src/modules/bookings/routes.js");
  await app.register(registerVehiclesRoutes, { prefix: "/vehicles" });
  await app.register(registerBookingsRoutes, { prefix: "/bookings" });
  await app.ready();
  return app;
}

function userToken(app: FastifyInstance, sub = "user-1") {
  return app.jwt.sign({ sub, role: "user" });
}

function workshopToken(app: FastifyInstance, sub = "workshop-user-1", workshopId: string | null = "workshop-1") {
  return app.jwt.sign({
    sub,
    role: "workshop_owner",
    ...(workshopId ? { workshopId } : {})
  });
}

function vehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: "vehicle-1",
    vin: "MHKTESTVIN000001",
    make: "Harley-Davidson",
    model: "Sportster S",
    year: 2030,
    currentOwnerId: "user-1",
    cnftAssetId: "asset-1",
    treeAddress: "tree-1",
    vehicleRecordPda: "record-1",
    healthScore: 97,
    currentMileageKm: 1200,
    currentOwner: { id: "user-1", displayName: "Owner" },
    enterprise: null,
    serviceLogs: [{ id: "service-log-1", notes: "Oil change" }],
    ...overrides
  };
}

describe("vehicle QR token flow", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock));
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("allows the current owner to issue a QR token and stores only the token hash", async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(vehicle());
    prismaMock.vehicleQrToken.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "qr-token-1", ...data }));

    const response = await app.inject({
      method: "POST",
      url: "/vehicles/vehicle-1/qr-tokens",
      headers: { authorization: `Bearer ${userToken(app)}` },
      payload: { includeServiceHistory: true }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.qrPayload).toMatchObject({ type: "noc_vehicle_qr", version: 1, vehicleId: "vehicle-1" });
    expect(body.qrPayload.token).toBeTruthy();
    const storedData = prismaMock.vehicleQrToken.create.mock.calls[0][0].data;
    expect(storedData.tokenHash).toBe(hashVehicleQrToken(body.qrPayload.token));
    expect(storedData).not.toHaveProperty("token");
    expect(JSON.stringify(storedData)).not.toContain(body.qrPayload.token);
    expect(storedData.includeServiceHistory).toBe(true);
  });

  it("rejects QR issuing for non-owned vehicles", async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(vehicle({ currentOwnerId: "someone-else" }));

    const response = await app.inject({
      method: "POST",
      url: "/vehicles/vehicle-1/qr-tokens",
      headers: { authorization: `Bearer ${userToken(app)}` },
      payload: { includeServiceHistory: false }
    });

    expect(response.statusCode).toBe(403);
    expect(prismaMock.vehicleQrToken.create).not.toHaveBeenCalled();
  });

  it("verifies a valid QR once and rejects reuse", async () => {
    const rawToken = "qr-token-secret-that-is-long-enough";
    const expiresAt = new Date(Date.now() + 60_000);
    const qrPayload = buildVehicleQrPayload({ token: rawToken, vehicleId: "vehicle-1", expiresAt });
    prismaMock.user.findUnique.mockResolvedValue({ role: "workshop_owner", workshopId: "workshop-1" });
    prismaMock.workshop.findUnique.mockResolvedValue({ id: "workshop-1", name: "NOC Workshop" });
    prismaMock.vehicleQrToken.findUnique
      .mockResolvedValueOnce({
        id: "qr-token-1",
        tokenHash: hashVehicleQrToken(rawToken),
        vehicleId: "vehicle-1",
        includeServiceHistory: true,
        expiresAt,
        consumedAt: null,
        vehicle: vehicle()
      })
      .mockResolvedValueOnce({
        id: "qr-token-1",
        tokenHash: hashVehicleQrToken(rawToken),
        vehicleId: "vehicle-1",
        includeServiceHistory: true,
        expiresAt,
        consumedAt: new Date(),
        vehicle: vehicle()
      });
    prismaMock.vehicleQrToken.updateMany.mockResolvedValue({ count: 1 });

    const first = await app.inject({
      method: "POST",
      url: "/vehicles/qr/verify",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { payload: JSON.stringify(qrPayload), workshopId: "workshop-1" }
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      scanSessionId: "qr-token-1",
      includeServiceHistory: true,
      workshop: { id: "workshop-1", name: "NOC Workshop" }
    });
    expect(first.json().serviceHistory).toHaveLength(1);
    expect(prismaMock.vehicleQrToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ consumedByWorkshopId: "workshop-1" })
    }));

    const second = await app.inject({
      method: "POST",
      url: "/vehicles/qr/verify",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { payload: JSON.stringify(qrPayload), workshopId: "workshop-1" }
    });
    expect(second.statusCode).toBe(400);
  });

  it("verifies through an approved workshop fallback when the workshop user is not linked yet", async () => {
    const rawToken = "legacy-workshop-qr-token-secret-long-enough";
    const expiresAt = new Date(Date.now() + 60_000);
    const qrPayload = buildVehicleQrPayload({ token: rawToken, vehicleId: "vehicle-1", expiresAt });
    prismaMock.user.findUnique.mockResolvedValue({
      role: "workshop_owner",
      workshopId: null,
      embeddedWalletAddress: null,
      selfCustodyAddress: null
    });
    prismaMock.workshop.findFirst.mockResolvedValue({ id: "workshop-1" });
    prismaMock.workshop.findUnique.mockResolvedValue({ id: "workshop-1", name: "NOC Workshop" });
    prismaMock.vehicleQrToken.findUnique.mockResolvedValue({
      id: "qr-token-legacy",
      tokenHash: hashVehicleQrToken(rawToken),
      vehicleId: "vehicle-1",
      includeServiceHistory: false,
      expiresAt,
      consumedAt: null,
      vehicle: vehicle()
    });
    prismaMock.vehicleQrToken.updateMany.mockResolvedValue({ count: 1 });

    const response = await app.inject({
      method: "POST",
      url: "/vehicles/qr/verify",
      headers: { authorization: `Bearer ${workshopToken(app, "workshop-user-legacy", null)}` },
      payload: { payload: JSON.stringify(qrPayload) }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scanSessionId: "qr-token-legacy",
      workshop: { id: "workshop-1", name: "NOC Workshop" }
    });
  });

  it("rejects malformed, foreign, and expired QR payloads", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "workshop_owner", workshopId: "workshop-1" });
    prismaMock.workshop.findUnique.mockResolvedValue({ id: "workshop-1", name: "NOC Workshop" });

    const malformed = await app.inject({
      method: "POST",
      url: "/vehicles/qr/verify",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { payload: JSON.stringify({ vin: "MHKTESTVIN000001" }), workshopId: "workshop-1" }
    });
    expect(malformed.statusCode).toBe(400);

    const foreignPayload = buildVehicleQrPayload({
      token: "unknown-qr-token-secret-that-is-long-enough",
      vehicleId: "vehicle-1",
      expiresAt: new Date(Date.now() + 60_000)
    });
    prismaMock.vehicleQrToken.findUnique.mockResolvedValueOnce(null);
    const foreign = await app.inject({
      method: "POST",
      url: "/vehicles/qr/verify",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { payload: JSON.stringify(foreignPayload), workshopId: "workshop-1" }
    });
    expect(foreign.statusCode).toBe(400);

    const expiredAt = new Date(Date.now() - 60_000);
    const expiredPayload = buildVehicleQrPayload({
      token: "expired-qr-token-secret-that-is-long-enough",
      vehicleId: "vehicle-1",
      expiresAt: expiredAt
    });
    prismaMock.vehicleQrToken.findUnique.mockResolvedValueOnce({
      id: "qr-token-expired",
      tokenHash: hashVehicleQrToken(expiredPayload.token),
      vehicleId: "vehicle-1",
      includeServiceHistory: false,
      expiresAt: expiredAt,
      consumedAt: null,
      vehicle: vehicle()
    });
    const expired = await app.inject({
      method: "POST",
      url: "/vehicles/qr/verify",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { payload: JSON.stringify(expiredPayload), workshopId: "workshop-1" }
    });
    expect(expired.statusCode).toBe(400);
  });

  it("requires a matching verified scan session for QR walk-in bookings", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "workshop_owner", workshopId: "workshop-1" });
    prismaMock.vehicleQrToken.findUnique.mockResolvedValue({
      id: "qr-token-1",
      vehicleId: "vehicle-1",
      consumedAt: new Date(),
      consumedByWorkshopId: "workshop-1",
      bookingId: null
    });
    prismaMock.booking.create.mockResolvedValue({
      id: "booking-1",
      status: "ACCEPTED",
      vehicleId: "vehicle-1",
      workshopId: "workshop-1"
    });
    prismaMock.vehicleQrToken.update.mockResolvedValue({ id: "qr-token-1", bookingId: "booking-1" });

    const missingScanSession = await app.inject({
      method: "POST",
      url: "/bookings/walk-in",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { vehicleId: "vehicle-1", workshopId: "workshop-1", complaint: "Walk-in" }
    });
    expect(missingScanSession.statusCode).toBe(400);

    const accepted = await app.inject({
      method: "POST",
      url: "/bookings/walk-in",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { vehicleId: "vehicle-1", workshopId: "workshop-1", scanSessionId: "qr-token-1", complaint: "Walk-in" }
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json()).toMatchObject({ bookingId: "booking-1", status: "ACCEPTED" });
    expect(prismaMock.vehicleQrToken.update).toHaveBeenCalledWith({
      where: { id: "qr-token-1" },
      data: { bookingId: "booking-1" }
    });

    prismaMock.vehicleQrToken.findUnique.mockResolvedValueOnce({
      id: "qr-token-2",
      vehicleId: "vehicle-1",
      consumedAt: new Date(),
      consumedByWorkshopId: "other-workshop",
      bookingId: null
    });
    const wrongWorkshop = await app.inject({
      method: "POST",
      url: "/bookings/walk-in",
      headers: { authorization: `Bearer ${workshopToken(app)}` },
      payload: { vehicleId: "vehicle-1", workshopId: "workshop-1", scanSessionId: "qr-token-2", complaint: "Walk-in" }
    });
    expect(wrongWorkshop.statusCode).toBe(400);
  });
});
