import "dotenv/config";
import type { Prisma } from "@prisma/client";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

function signatureFromPayload(data: Record<string, unknown>) {
  return typeof data.signature === "string" && data.signature.length >= 32 ? data.signature : null;
}

async function recordReceipt(jobName: string, data: Record<string, unknown>) {
  const signature = signatureFromPayload(data);
  if (!signature) return;
  await prisma.txReceipt.upsert({
    where: { signature },
    update: {
      confirmationStatus: "CONFIRMED",
      programId: env.NOC_REGISTRY_PROGRAM_ID,
      raw: data as Prisma.InputJsonValue
    },
    create: {
      signature,
      cluster: env.SOLANA_CLUSTER,
      programId: env.NOC_REGISTRY_PROGRAM_ID,
      confirmationStatus: "CONFIRMED",
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${env.SOLANA_CLUSTER}`,
      raw: { jobName, ...data } as Prisma.InputJsonValue
    }
  });
}

async function applyConfirmedSideEffects(jobName: string, data: Record<string, unknown>) {
  switch (jobName) {
    case "record_payment_receipt": {
      const paymentId = typeof data.paymentId === "string" ? data.paymentId : null;
      if (!paymentId) return;
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "CONFIRMED", receiptRecordPda: `devnet-payment-${paymentId}` },
        include: { invoice: true }
      });
      await prisma.booking.update({ where: { id: payment.invoice.bookingId }, data: { status: "PAID" } });
      return;
    }
    case "anchor_service_log": {
      const serviceLogId = typeof data.serviceLogId === "string" ? data.serviceLogId : null;
      if (!serviceLogId) return;
      const serviceLog = await prisma.serviceLog.update({
        where: { id: serviceLogId },
        data: { recordPda: `devnet-service-log-${serviceLogId}` }
      });
      if (serviceLog.bookingId) {
        await prisma.booking.update({ where: { id: serviceLog.bookingId }, data: { status: "ANCHORED" } });
      }
      return;
    }
    case "grant_credential": {
      const credentialId = typeof data.credentialId === "string" ? data.credentialId : null;
      if (credentialId) {
        await prisma.workshopCredential.update({ where: { id: credentialId }, data: { recordPda: `devnet-credential-${credentialId}` } });
      }
      return;
    }
    case "mint_vehicle_cnft": {
      const vehicleIds = Array.isArray(data.vehicleIds) ? data.vehicleIds.filter((id): id is string => typeof id === "string") : [];
      if (vehicleIds.length) {
        await Promise.all(vehicleIds.map((vehicleId, index) => prisma.vehicle.update({
          where: { id: vehicleId },
          data: {
            mintStatus: "minted",
            treeAddress: env.BUBBLEGUM_TREE_ADDRESS ?? "devnet-tree-pending",
            leafIndex: index,
            cnftAssetId: `devnet-cnft-${vehicleId}`,
            vehicleRecordPda: `devnet-vehicle-record-${vehicleId}`
          }
        })));
      }
      return;
    }
    case "mint_part_catalog_cnft": {
      const partIds = Array.isArray(data.partIds) ? data.partIds.filter((id): id is string => typeof id === "string") : [];
      if (partIds.length) {
        await prisma.partCatalogItem.updateMany({ where: { id: { in: partIds } }, data: { treeAddress: "devnet-tree-pending", cnftAssetId: "devnet-part-cnft-pending" } });
      }
      return;
    }
    case "mark_vehicle_transferred": {
      const vehicleId = typeof data.vehicleId === "string" ? data.vehicleId : null;
      const newOwnerId = typeof data.newOwnerId === "string" ? data.newOwnerId : null;
      if (vehicleId) {
        await prisma.vehicle.update({ where: { id: vehicleId }, data: { currentOwnerId: newOwnerId, mintStatus: "transferred" } });
      }
      return;
    }
    default:
      return;
  }
}

const worker = new Worker(
  "noc-onchain",
  async (job) => {
    const onchainJobId = typeof job.data.onchainJobId === "string" ? job.data.onchainJobId : null;
    if (onchainJobId) {
      await prisma.onchainJob.update({
        where: { id: onchainJobId },
        data: { status: "RUNNING", attempts: { increment: 1 } }
      });
    }

    const result = {
      status: "confirmed_local_worker",
      cluster: env.SOLANA_CLUSTER,
      programId: env.NOC_REGISTRY_PROGRAM_ID,
      job: job.name,
      data: job.data
    };

    switch (job.name) {
      case "anchor_service_log":
      case "record_payment_receipt":
      case "mint_vehicle_cnft":
      case "mint_part_catalog_cnft":
      case "grant_credential":
      case "revoke_credential":
      case "register_workshop_pda":
      case "set_platform_config":
      case "mark_vehicle_transferred":
      case "claim_vehicle":
      case "anchor_trip_summary":
      case "anchor_case_event":
        await recordReceipt(job.name, job.data);
        await applyConfirmedSideEffects(job.name, job.data);
        if (onchainJobId) {
          await prisma.onchainJob.update({
            where: { id: onchainJobId },
            data: { status: "CONFIRMED", signature: signatureFromPayload(job.data) ?? undefined }
          });
        }
        return result;
      default:
        throw new Error(`Unknown on-chain job: ${job.name}`);
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.info(`[onchain-worker] completed ${job.name}#${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`[onchain-worker] failed ${job?.name}#${job?.id}`, error);
  const onchainJobId = typeof job?.data?.onchainJobId === "string" ? job.data.onchainJobId : null;
  if (onchainJobId) {
    void prisma.onchainJob.update({
      where: { id: onchainJobId },
      data: { status: "FAILED", error: error.message }
    });
  }
});
