import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { createDevnetUiSignature } from "../../lib/devnetSignature.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerVehiclesRoutes: FastifyPluginAsync = async (app) => {
  async function currentUserId(request: FastifyRequest) {
    try {
      const payload = await request.jwtVerify<{ sub: string }>();
      return payload.sub;
    } catch {
      return null;
    }
  }

  app.get("/", async (request) => {
    const query = z.object({
      ownerId: z.string().optional(),
      enterpriseId: z.string().optional(),
      transferable: z.coerce.boolean().optional(),
      vin: z.string().optional()
    }).parse(request.query);
    const ownerId = query.ownerId === "me" ? await currentUserId(request) : query.ownerId;
    const items = await prisma.vehicle.findMany({
      where: {
        currentOwnerId: ownerId ?? undefined,
        enterpriseId: query.enterpriseId,
        vin: query.vin,
        mintStatus: query.transferable ? { in: ["minted", "escrow"] } : undefined
      },
      include: {
        currentOwner: true,
        enterprise: true,
        serviceLogs: { orderBy: { createdAt: "desc" }, take: 5 }
      },
      orderBy: { updatedAt: "desc" }
    });
    return { items, source: "postgres", ownerId: ownerId ?? null, enterpriseId: query.enterpriseId ?? null };
  });

  app.post("/resolve", async (request) => {
    const body = z.object({ query: z.string().min(1) }).parse(request.body);
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(body.query);
    } catch {
      parsed = null;
    }
    const qr = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    const vehicleId = typeof qr.vehicleId === "string" ? qr.vehicleId : undefined;
    const vin = typeof qr.vin === "string" ? qr.vin : body.query;
    const assetId = typeof qr.cnftAssetId === "string" ? qr.cnftAssetId : body.query;
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        OR: [
          vehicleId ? { id: vehicleId } : undefined,
          vin ? { vin } : undefined,
          assetId ? { cnftAssetId: assetId } : undefined
        ].filter(Boolean) as Array<{ id: string } | { vin: string } | { cnftAssetId: string }>
      },
      include: { currentOwner: true, enterprise: true }
    });
    if (!vehicle) throw app.httpErrors.notFound("Vehicle not found from QR/NFT/VIN.");
    return {
      vehicle,
      qrPayload: {
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        cnftAssetId: vehicle.cnftAssetId,
        treeAddress: vehicle.treeAddress,
        vehicleRecordPda: vehicle.vehicleRecordPda
      }
    };
  });

  app.get("/:vehicleId/timeline", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
      include: {
        serviceLogs: { include: { workshop: true, booking: { include: { invoice: true } } }, orderBy: { createdAt: "desc" } },
        bookings: { include: { workshop: true, invoice: { include: { payments: true } }, serviceLog: true }, orderBy: { createdAt: "desc" } },
        trips: { orderBy: { startedAt: "desc" }, take: 10 }
      }
    });
    if (!vehicle) throw app.httpErrors.notFound("Vehicle not found.");
    const signatures = [
      ...vehicle.serviceLogs.map((item) => item.txSignature),
      ...vehicle.bookings.flatMap((booking) => booking.invoice?.payments.map((payment) => payment.signature) ?? [])
    ].filter((signature): signature is string => typeof signature === "string");
    const receipts = signatures.length
      ? await prisma.txReceipt.findMany({ where: { signature: { in: signatures } } })
      : [];
    return {
      vehicleId: vehicle.id,
      vin: vehicle.vin,
      items: [
        ...vehicle.serviceLogs.map((item) => ({ type: "service_log", at: item.createdAt, item })),
        ...vehicle.bookings.map((item) => ({ type: "booking", at: item.createdAt, item })),
        ...vehicle.trips.map((item) => ({ type: "trip", at: item.startedAt, item }))
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
      receipts,
      cluster: env.SOLANA_CLUSTER
    };
  });

  app.get("/:vehicleId", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
      include: {
        currentOwner: true,
        enterprise: true,
        serviceLogs: { include: { workshop: true }, orderBy: { createdAt: "desc" } },
        bookings: { include: { workshop: true, invoice: { include: { payments: true } } }, orderBy: { createdAt: "desc" } },
        trips: { orderBy: { startedAt: "desc" }, take: 10 }
      }
    });
    if (!vehicle) {
      throw app.httpErrors.notFound("Vehicle not found.");
    }
    return {
      vehicle,
      timeline: [
        ...vehicle.serviceLogs.map((item) => ({ type: "service_log", at: item.createdAt, item })),
        ...vehicle.bookings.map((item) => ({ type: "booking", at: item.createdAt, item })),
        ...vehicle.trips.map((item) => ({ type: "trip", at: item.startedAt, item }))
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
      cnft: vehicle.cnftAssetId ? { assetId: vehicle.cnftAssetId, treeAddress: vehicle.treeAddress, leafIndex: vehicle.leafIndex } : null,
      recordPda: vehicle.vehicleRecordPda
    };
  });

  app.post("/:vehicleId/claim", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const body = z.object({ ownerWallet: z.string().min(32) }).parse(request.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: params.vehicleId } });
    if (!vehicle) {
      throw app.httpErrors.notFound("Vehicle not found.");
    }
    const job = await enqueueOnchainJob("claim_vehicle", { vehicleId: vehicle.id, ownerWallet: body.ownerWallet });
    return { vehicleId: params.vehicleId, ownerWallet: body.ownerWallet, job: job.name, onchainJobId: job.id };
  });

  app.post("/:vehicleId/transfer", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const body = z.object({
      newOwnerId: z.string().optional(),
      newOwnerEmail: z.string().email().optional(),
      newOwnerWallet: z.string().min(32).optional(),
      enterpriseAuthorityWallet: z.string().min(32).optional(),
      feeSignature: z.string().min(32).optional(),
      feePayer: z.string().min(32).optional()
    }).parse(request.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: params.vehicleId }, include: { enterprise: true } });
    if (!vehicle) {
      throw app.httpErrors.notFound("Vehicle not found.");
    }
    if (vehicle.mintStatus === "transferred") {
      const currentOwner = await prisma.user.findUnique({ where: { id: vehicle.currentOwnerId ?? "" } }).catch(() => null);
      if (currentOwner && (
        (body.newOwnerId && currentOwner.id === body.newOwnerId) ||
        (body.newOwnerEmail && currentOwner.email?.toLowerCase() === body.newOwnerEmail.toLowerCase()) ||
        (body.newOwnerWallet && [currentOwner.embeddedWalletAddress, currentOwner.selfCustodyAddress].includes(body.newOwnerWallet))
      )) {
        return {
          vehicleId: vehicle.id,
          status: vehicle.mintStatus,
          newOwnerId: currentOwner.id,
          newOwnerWallet: currentOwner.embeddedWalletAddress ?? currentOwner.selfCustodyAddress,
          signature: body.feeSignature ?? createDevnetUiSignature("mark_vehicle_transferred_idempotent", { vehicleId: vehicle.id, ownerId: currentOwner.id }),
          explorerUrl: `https://explorer.solana.com/tx/${body.feeSignature ?? ""}?cluster=${env.SOLANA_CLUSTER}`,
          dasMode: env.SOLANA_DAS_RPC_URL ? "configured" : "devnet_receipt_only",
          alreadyTransferred: true
        };
      }
    }
    if (!["minted", "escrow"].includes(vehicle.mintStatus)) {
      throw app.httpErrors.badRequest("Vehicle must be minted before transfer.");
    }
    const buyer = await prisma.user.findFirst({
      where: {
        OR: [
          body.newOwnerId ? { id: body.newOwnerId } : undefined,
          body.newOwnerEmail ? { email: body.newOwnerEmail.toLowerCase() } : undefined,
          body.newOwnerWallet ? { embeddedWalletAddress: body.newOwnerWallet } : undefined,
          body.newOwnerWallet ? { selfCustodyAddress: body.newOwnerWallet } : undefined
        ].filter(Boolean) as Array<{ id: string } | { email: string } | { embeddedWalletAddress: string } | { selfCustodyAddress: string }>
      }
    });
    if (!buyer?.embeddedWalletAddress && !buyer?.selfCustodyAddress) {
      throw app.httpErrors.badRequest("Buyer harus sudah register dan punya wallet NOC ID.");
    }
    const newOwnerWallet = buyer.embeddedWalletAddress ?? buyer.selfCustodyAddress;
    const signature = body.feeSignature ?? createDevnetUiSignature("mark_vehicle_transferred", { vehicleId: vehicle.id, buyerId: buyer.id, newOwnerWallet });
    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { currentOwnerId: buyer.id, mintStatus: "transferred" }
    });
    const job = await enqueueOnchainJob("mark_vehicle_transferred", {
      vehicleId: vehicle.id,
      vehicleRecordPda: vehicle.vehicleRecordPda,
      newOwnerId: buyer.id,
      newOwnerWallet,
      enterpriseAuthorityWallet: body.enterpriseAuthorityWallet ?? vehicle.enterprise?.authorityWallet,
      signature,
      feePayer: body.feePayer
    });
    return {
      vehicleId: vehicle.id,
      status: updated.mintStatus,
      newOwnerId: buyer.id,
      newOwnerWallet,
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${env.SOLANA_CLUSTER}`,
      dasMode: env.SOLANA_DAS_RPC_URL ? "configured" : "devnet_receipt_only",
      job: job.name,
      onchainJobId: job.id
    };
  });
};
