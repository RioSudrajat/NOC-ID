import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { buildAnchorServiceLogPlan } from "../../lib/anchorTransactionPlan.js";
import { createDevnetUiSignature } from "../../lib/devnetSignature.js";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerServiceLogRoutes: FastifyPluginAsync = async (app) => {
  app.post("/draft", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      vehicleId: z.string(),
      workshopId: z.string(),
      odometerKm: z.number().int().nonnegative(),
      invoiceHash: z.string().min(32).optional(),
      partsHash: z.string().min(32).optional(),
      evidenceHash: z.string().min(32).optional()
    }).passthrough().parse(request.body);
    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId }, include: { invoice: true } });
    const serviceLog = await prisma.serviceLog.create({
      data: {
        bookingId: body.bookingId,
        vehicleId: body.vehicleId,
        workshopId: body.workshopId,
        odometerKm: body.odometerKm,
        invoiceHash: body.invoiceHash ?? sha256Hex(booking?.invoice ?? body.bookingId),
        partsHash: body.partsHash ?? sha256Hex(booking?.invoice?.parts ?? []),
        evidenceHash: body.evidenceHash
      }
    });
    await prisma.booking.update({ where: { id: body.bookingId }, data: { status: "ANCHORING" } });
    return { serviceLogId: serviceLog.id, status: "DRAFT", serviceLog };
  });

  app.post("/anchor-devnet", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      odometerKm: z.number().int().nonnegative().default(0),
      evidenceHash: z.string().min(32).optional(),
      feeSignature: z.string().min(32).optional(),
      feePayer: z.string().min(32).optional()
    }).parse(request.body);
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { vehicle: true, workshop: true, invoice: true, serviceLog: true }
    });
    if (!booking) throw app.httpErrors.notFound("Booking not found.");
    if (!booking.invoice) throw app.httpErrors.badRequest("Invoice wajib ada sebelum anchoring.");
    if (!["PAID", "ANCHORING", "ANCHORED"].includes(booking.status)) {
      throw app.httpErrors.badRequest("Booking harus sudah PAID sebelum service log di-anchor.");
    }
    const invoiceHash = sha256Hex(booking.invoice);
    const partsHash = sha256Hex(booking.invoice.parts ?? []);
    const serviceLog = booking.serviceLog ?? await prisma.serviceLog.create({
      data: {
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        workshopId: booking.workshopId,
        odometerKm: body.odometerKm || booking.vehicle.currentMileageKm,
        invoiceHash,
        partsHash,
        evidenceHash: body.evidenceHash
      }
    });
    const signature = body.feeSignature ?? createDevnetUiSignature("anchor_service_log", {
      serviceLogId: serviceLog.id,
      vehicleId: booking.vehicleId,
      workshopId: booking.workshopId
    });
    await prisma.serviceLog.update({ where: { id: serviceLog.id }, data: { txSignature: signature } });
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "ANCHORED" } });
    const job = await enqueueOnchainJob("anchor_service_log", {
      serviceLogId: serviceLog.id,
      vehicleId: booking.vehicleId,
      workshopId: booking.workshopId,
      signature
    });
    return {
      serviceLogId: serviceLog.id,
      bookingId: booking.id,
      status: "ANCHORED",
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${env.SOLANA_CLUSTER}`,
      onchainJobId: job.id
    };
  });

  app.post("/:serviceLogId/build-tx", async (request) => {
    const params = z.object({ serviceLogId: z.string() }).parse(request.params);
    const serviceLog = await prisma.serviceLog.findUnique({ where: { id: params.serviceLogId }, include: { workshop: true, vehicle: true } });
    if (!serviceLog) {
      throw app.httpErrors.notFound("Service log not found.");
    }
    const credential = await prisma.workshopCredential.findFirst({
      where: {
        workshopId: serviceLog.workshopId,
        credential: "verified_signer",
        revokedAt: null
      },
      orderBy: { createdAt: "desc" }
    });
    if (!credential) {
      throw app.httpErrors.forbidden("Workshop needs verified_signer credential before anchoring service logs.");
    }
    const serviceIdHash = sha256Hex(serviceLog.id);
    const transactionPlan = buildAnchorServiceLogPlan({
      programId: env.NOC_REGISTRY_PROGRAM_ID,
      payer: serviceLog.workshop.authorityWallet,
      workshopAuthority: serviceLog.workshop.authorityWallet,
      vehicleRecordPda: serviceLog.vehicle.vehicleRecordPda,
      workshopRecordPda: serviceLog.workshop.recordPda,
      credentialRecordPda: credential.recordPda,
      serviceLogRecordPda: serviceLog.recordPda,
      serviceIdHash,
      odometerKm: serviceLog.odometerKm,
      invoiceHash: serviceLog.invoiceHash,
      partsHash: serviceLog.partsHash,
      evidenceHash: serviceLog.evidenceHash
    });
    return {
      serviceLogId: params.serviceLogId,
      transactionPlan,
      summary: {
        action: "anchor_service_log",
        cluster: env.SOLANA_CLUSTER,
        feePayer: serviceLog.workshop.authorityWallet,
        signerRequired: "workshop verified_signer wallet",
        affectedVehicle: serviceLog.vehicle.vin,
        serviceIdHash,
        odometerKm: serviceLog.odometerKm,
        invoiceHash: serviceLog.invoiceHash,
        partsHash: serviceLog.partsHash,
        evidenceHash: serviceLog.evidenceHash ?? "0".repeat(64)
      },
      accounts: {
        programId: process.env.NOC_REGISTRY_PROGRAM_ID,
        vehicleRecordPda: serviceLog.vehicle.vehicleRecordPda,
        workshopRecordPda: serviceLog.workshop.recordPda,
        credentialRecordPda: credential.recordPda
      },
      nextAction: transactionPlan.buildStatus === "ready_for_client_assembly" ? "client_assembles_transaction_then_calls_/solana/simulate" : "deploy_program_and_store_pdAs_before_client_assembly"
    };
  });

  app.post("/:serviceLogId/submit-signed", async (request) => {
    const params = z.object({ serviceLogId: z.string() }).parse(request.params);
    const body = z.object({ signature: z.string().min(32) }).parse(request.body);
    const serviceLog = await prisma.serviceLog.update({
      where: { id: params.serviceLogId },
      data: { txSignature: body.signature }
    });
    if (serviceLog.bookingId) {
      await prisma.booking.update({
        where: { id: serviceLog.bookingId },
        data: { status: "ANCHORED" }
      });
    }
    const job = await enqueueOnchainJob("anchor_service_log", {
      serviceLogId: serviceLog.id,
      vehicleId: serviceLog.vehicleId,
      workshopId: serviceLog.workshopId,
      signature: body.signature
    });
    return { serviceLogId: params.serviceLogId, signature: body.signature, status: "ANCHORED", onchainJobId: job.id };
  });
};
