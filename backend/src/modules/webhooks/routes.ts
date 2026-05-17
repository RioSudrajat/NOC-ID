import type { FastifyPluginAsync } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const registerWebhooksRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payment-provider", async (request) => {
    const body = z.object({
      paymentId: z.string().optional(),
      providerReference: z.string().optional(),
      status: z.enum(["PENDING", "REQUIRES_SIGNATURE", "CONFIRMING", "CONFIRMED", "FAILED", "CANCELLED"]).default("CONFIRMED"),
      signature: z.string().optional()
    }).passthrough().parse(request.body);
    const payment = body.paymentId
      ? await prisma.payment.update({
          where: { id: body.paymentId },
          data: { status: body.status, signature: body.signature }
        })
      : null;
    await prisma.auditEvent.create({
      data: {
        action: "webhook.payment_provider",
        target: body.paymentId ?? body.providerReference ?? "unknown",
        details: { ...body, paymentUpdated: Boolean(payment) }
      }
    });
    return { ok: true, source: "payment-provider", paymentUpdated: Boolean(payment) };
  });

  app.post("/storage", async (request) => {
    const body = z.object({
      storageRef: z.string(),
      storage: z.enum(["irys", "s3", "minio", "r2", "ipfs"]),
      hash: z.string().min(32).optional(),
      status: z.enum(["uploaded", "mirrored", "failed"]).default("uploaded")
    }).passthrough().parse(request.body);
    await prisma.auditEvent.create({
      data: {
        action: "webhook.storage",
        target: body.storageRef,
        details: body as Prisma.InputJsonValue
      }
    });
    return { ok: true, source: "storage", storageRef: body.storageRef, status: body.status };
  });

  app.post("/solana-confirmation", async (request) => {
    const body = z.object({
      onchainJobId: z.string().optional(),
      signature: z.string().min(32),
      status: z.enum(["CONFIRMED", "FAILED"]).default("CONFIRMED"),
      slot: z.number().int().nonnegative().optional(),
      programId: z.string().optional(),
      error: z.string().optional()
    }).parse(request.body);
    if (body.onchainJobId) {
      await prisma.onchainJob.update({
        where: { id: body.onchainJobId },
        data: { status: body.status, signature: body.signature, error: body.error }
      });
    }
    await prisma.txReceipt.upsert({
      where: { signature: body.signature },
      update: {
        confirmationStatus: body.status,
        slot: body.slot == null ? undefined : BigInt(body.slot),
        programId: body.programId
      },
      create: {
        signature: body.signature,
        cluster: "devnet",
        programId: body.programId,
        slot: body.slot == null ? undefined : BigInt(body.slot),
        confirmationStatus: body.status,
        explorerUrl: `https://explorer.solana.com/tx/${body.signature}?cluster=devnet`,
        raw: body
      }
    });
    return { ok: true, source: "solana-confirmation", signature: body.signature, status: body.status };
  });
};
