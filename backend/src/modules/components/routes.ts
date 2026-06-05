import type { FastifyPluginAsync } from "fastify";
import type { Prisma } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { env } from "../../config/env.js";
import {
  buildVerifyComponentOriginTx,
  credentialIndex,
  estimateLegacyTransactionBase64,
  estimateRentExemption,
  explorerUrl,
  pda,
  sha256Bytes,
} from "../../lib/clientSignedTx.js";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { ensureWorkshopOemCredential } from "../../lib/onchainAuthority.js";
import { prisma } from "../../lib/prisma.js";

const componentOriginRecordDataSize = 211;
const DEVNET_WORKSHOP_BOOTSTRAP_WALLET = "7hdVuqeijPCQEmH8gYUm3Vxkz1P3CRKkkHVUeAv4UoHP";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function canonicalHash(value: unknown) {
  return sha256Hex(canonicalize(value));
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isOemPart(part: Record<string, unknown>) {
  return Boolean(part.isOem ?? part.isOEM);
}

function requiresOriginVerification(part: Record<string, unknown>) {
  const action = normalized(part.serviceAction);
  return action === "replace" || action === "inspect";
}

function vehicleCompatibilityTokens(vehicle: { make: string; model: string }) {
  const text = normalized(`${vehicle.make} ${vehicle.model}`);
  const tokens = new Set([
    normalized(vehicle.model),
    text,
  ]);
  if (text.includes("bmw") || text.includes("m4") || text.includes("g82")) tokens.add("bmw_m4");
  if (text.includes("harley") || text.includes("sportster")) tokens.add("harley");
  if (text.includes("pcx")) tokens.add("pcx_150");
  if (text.includes("supra") || text.includes("veilside")) tokens.add("supra");
  return [...tokens].filter(Boolean);
}

function publicPart(part: Record<string, unknown>) {
  return {
    componentId: typeof part.componentId === "string" ? part.componentId : null,
    componentName: typeof part.componentName === "string" ? part.componentName : String(part.name ?? ""),
    name: String(part.name ?? part.componentName ?? "OEM Part"),
    partNumber: String(part.partNumber ?? ""),
    manufacturer: String(part.manufacturer ?? ""),
    price: Number(part.price ?? part.priceIDR ?? part.priceIdr ?? 0),
    isOEM: isOemPart(part),
    serviceAction: typeof part.serviceAction === "string" ? part.serviceAction : "service",
  };
}

async function resolveCatalogPart(input: {
  vehicle: { make: string; model: string };
  partNumber: string;
  manufacturer?: string;
  componentId?: string | null;
}) {
  const candidates = await prisma.partCatalogItem.findMany({
    where: { partNumber: { equals: input.partNumber, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
  const manufacturer = normalized(input.manufacturer);
  const vehicleModelTokens = [...vehicleCompatibilityTokens(input.vehicle), normalized(input.componentId)].filter(Boolean);
  return candidates.find((item) => {
    if (manufacturer && normalized(item.manufacturer) !== manufacturer) return false;
    const refsReady = Boolean(item.cnftAssetId && item.treeAddress && item.metadataHash);
    if (!refsReady) return false;
    if (item.compatibleModels.length === 0) return true;
    const compatible = item.compatibleModels.map(normalized);
    return compatible.some((model) => vehicleModelTokens.some((token) => token.includes(model) || model.includes(token)));
  }) ?? null;
}

export const registerComponentsRoutes: FastifyPluginAsync = async (app) => {
  const partSchema = z.record(z.unknown());

  app.post("/origin/resolve", async (request) => {
    const body = z.object({
      vehicleId: z.string(),
      partNumber: z.string().min(1),
      manufacturer: z.string().optional(),
      componentId: z.string().optional(),
    }).parse(request.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
    if (!vehicle) throw app.httpErrors.notFound("Vehicle not found.");
    const catalogItem = await resolveCatalogPart({
      vehicle,
      partNumber: body.partNumber,
      manufacturer: body.manufacturer,
      componentId: body.componentId,
    });
    if (!catalogItem) {
      return {
        eligible: false,
        reason: "OEM part belum ada di minted part catalog atau tidak cocok dengan manufacturer/model kendaraan.",
        catalogItem: null,
      };
    }
    return {
      eligible: true,
      reason: "OEM part catalog cNFT refs valid.",
      catalogItem,
    };
  });

  app.post("/origin/draft", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      workshopWallet: z.string().min(32),
      parts: z.array(partSchema).min(1),
    }).parse(request.body);
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { vehicle: true, workshop: true, invoice: true, serviceLog: true },
    });
    if (!booking) throw app.httpErrors.notFound("Booking not found.");
    if (booking.workshop.authorityWallet !== body.workshopWallet) {
      throw app.httpErrors.badRequest(`Wallet Phantom ${body.workshopWallet} bukan workshop authority ${booking.workshop.authorityWallet ?? "unset"}.`);
    }
    if (!booking.vehicle.vehicleRecordPda) {
      throw app.httpErrors.badRequest("VehicleRecord PDA belum tersedia. Kendaraan harus minted dan registered on-chain dulu.");
    }
    if (!booking.workshop.recordPda && body.workshopWallet !== DEVNET_WORKSHOP_BOOTSTRAP_WALLET) {
      throw app.httpErrors.badRequest("WorkshopRecord PDA belum tersedia. Grant credential/register workshop dulu.");
    }
    const originParts = body.parts
      .filter(requiresOriginVerification)
      .map(publicPart)
      .filter((part) => part.componentId || part.name.trim() || (part.partNumber && part.partNumber !== "-"));
    if (originParts.length === 0) {
      throw app.httpErrors.badRequest("Tidak ada part replace/inspect yang perlu diverifikasi.");
    }
    let oemCredential = await prisma.workshopCredential.findFirst({
      where: { workshopId: booking.workshopId, credential: "oem_certified", revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!oemCredential?.recordPda) {
      if (body.workshopWallet !== DEVNET_WORKSHOP_BOOTSTRAP_WALLET) {
        throw app.httpErrors.forbidden("Workshop wajib punya credential oem_certified aktif sebelum verify component origin.");
      }
      const ensured = await ensureWorkshopOemCredential({
        workshopId: booking.workshopId,
        authorityWallet: body.workshopWallet,
        metadataHash: booking.workshop.metadataHash,
      });
      await prisma.workshop.update({
        where: { id: booking.workshopId },
        data: {
          recordPda: ensured.workshopRecordPda,
          authorityWallet: ensured.authorityWallet,
          status: "approved",
        },
      });
      oemCredential = await prisma.workshopCredential.create({
        data: {
          workshopId: booking.workshopId,
          credential: "oem_certified",
          issuedBy: DEVNET_WORKSHOP_BOOTSTRAP_WALLET,
          recordPda: ensured.credentialRecordPda,
          txSignature: ensured.signature ?? undefined,
          reason: "devnet bootstrap for component origin verification",
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      booking.workshop.recordPda = ensured.workshopRecordPda;
    }

    const resolved = [];
    for (const part of originParts) {
      const catalogItem = await resolveCatalogPart({
        vehicle: booking.vehicle,
        partNumber: part.partNumber,
        manufacturer: part.manufacturer,
        componentId: part.componentId,
      });
      resolved.push({
        ...part,
        isOEM: Boolean(catalogItem),
        originStatus: catalogItem ? "verified_oem" : "verified_non_oem",
        originLabel: catalogItem ? "Terverifikasi OEM" : "Bukan OEM",
        catalogItemId: catalogItem?.id ?? null,
        catalogPartNumber: catalogItem?.partNumber ?? null,
        catalogManufacturer: catalogItem?.manufacturer ?? null,
        cnftAssetId: catalogItem?.cnftAssetId ?? null,
        treeAddress: catalogItem?.treeAddress ?? null,
        leafIndex: catalogItem?.leafIndex ?? null,
        metadataHash: catalogItem?.metadataHash ?? null,
      });
    }

    const invoicePayload = booking.invoice
      ? { invoiceId: booking.invoice.id, totalIdr: booking.invoice.totalIdr, parts: booking.invoice.parts }
      : { bookingId: booking.id, parts: resolved };
    const partsHash = canonicalHash(resolved);
    const catalogHash = canonicalHash(resolved.map((part) => ({
      catalogItemId: part.catalogItemId,
      partNumber: part.catalogPartNumber,
      cnftAssetId: part.cnftAssetId,
      metadataHash: part.metadataHash,
    })));
    const invoiceHash = canonicalHash(invoicePayload);
    const serviceIdentity = booking.serviceLog?.id ?? booking.id;
    const serviceIdHash = sha256Bytes(serviceIdentity).toString("hex");
    const componentOriginRecordPda = pda([
      "component-origin",
      Buffer.from(new PublicKey(booking.vehicle.vehicleRecordPda).toBytes()),
      Buffer.from(serviceIdHash, "hex"),
    ]).toBase58();
    const workshopRecordPda = booking.workshop.recordPda;
    if (!workshopRecordPda) {
      throw app.httpErrors.badRequest("WorkshopRecord PDA belum tersedia setelah bootstrap credential.");
    }
    const oemCredentialRecordPda = pda([
      "credential",
      Buffer.from(new PublicKey(workshopRecordPda).toBytes()),
      Buffer.from([credentialIndex.oem_certified]),
    ]).toBase58();
    if (oemCredential.recordPda !== oemCredentialRecordPda) {
      throw app.httpErrors.badRequest("Credential oem_certified PDA di DB tidak cocok dengan PDA program. Grant ulang credential OEM.");
    }

    const tx = await buildVerifyComponentOriginTx({
      payerWallet: body.workshopWallet,
      workshopAuthorityWallet: body.workshopWallet,
      vehicleRecordPda: booking.vehicle.vehicleRecordPda,
      workshopRecordPda,
      credentialRecordPda: oemCredentialRecordPda,
      componentOriginRecordPda,
      serviceLogId: serviceIdentity,
      invoiceHash,
      partsHash,
      catalogHash,
      verifiedPartCount: resolved.length,
    });
    const [feeEstimate, rentEstimate] = await Promise.all([
      estimateLegacyTransactionBase64(tx.transactionBase64),
      estimateRentExemption(componentOriginRecordDataSize),
    ]);

    await prisma.componentOriginVerification.upsert({
      where: { bookingId: booking.id },
      update: {
        invoiceId: booking.invoice?.id,
        serviceLogId: booking.serviceLog?.id,
        vehicleId: booking.vehicleId,
        workshopId: booking.workshopId,
        parts: resolved as Prisma.InputJsonValue,
        partsHash,
        catalogHash,
        invoiceHash,
        verifiedPartCount: resolved.length,
        status: "DRAFT",
        recordPda: componentOriginRecordPda,
      },
      create: {
        bookingId: booking.id,
        invoiceId: booking.invoice?.id,
        serviceLogId: booking.serviceLog?.id,
        vehicleId: booking.vehicleId,
        workshopId: booking.workshopId,
        parts: resolved as Prisma.InputJsonValue,
        partsHash,
        catalogHash,
        invoiceHash,
        verifiedPartCount: resolved.length,
        status: "DRAFT",
        recordPda: componentOriginRecordPda,
      },
    });

    return {
      status: "READY_FOR_WALLET_SIGNATURE",
      bookingId: booking.id,
      transactionBase64: tx.transactionBase64,
      componentOriginRecordPda,
      serviceIdHash,
      invoiceHash,
      partsHash,
      catalogHash,
      verifiedPartCount: resolved.length,
      parts: resolved,
      costEstimate: {
        networkFeeLamports: feeEstimate.networkFeeLamports,
        networkFeeSol: feeEstimate.networkFeeSol,
        storageRentLamports: rentEstimate.rentLamports,
        storageRentSol: rentEstimate.rentSol,
        storageAccountBytes: rentEstimate.dataSize,
        totalLamports: feeEstimate.networkFeeLamports + rentEstimate.rentLamports,
        totalSol: (feeEstimate.networkFeeLamports + rentEstimate.rentLamports) / 1_000_000_000,
      },
      accounts: {
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        vehicleRecordPda: booking.vehicle.vehicleRecordPda,
        workshopRecordPda: booking.workshop.recordPda,
        credentialRecordPda: oemCredentialRecordPda,
      },
    };
  });

  app.post("/origin/confirm", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      signature: z.string().min(32),
      signerWallet: z.string().min(32),
      componentOriginRecordPda: z.string().min(32),
      invoiceHash: z.string().length(64),
      partsHash: z.string().length(64),
      catalogHash: z.string().length(64),
    }).parse(request.body);
    const verification = await prisma.componentOriginVerification.findUnique({
      where: { bookingId: body.bookingId },
    });
    if (!verification) throw app.httpErrors.notFound("Component origin draft not found.");
    const workshop = await prisma.workshop.findUnique({ where: { id: verification.workshopId } });
    if (workshop?.authorityWallet !== body.signerWallet) {
      throw app.httpErrors.badRequest("Workshop signer wallet mismatch.");
    }
    if (
      verification.recordPda !== body.componentOriginRecordPda ||
      verification.invoiceHash !== body.invoiceHash ||
      verification.partsHash !== body.partsHash ||
      verification.catalogHash !== body.catalogHash
    ) {
      throw app.httpErrors.badRequest("Signed component origin payload does not match draft hashes.");
    }
    const explorer = explorerUrl(body.signature);
    const confirmed = await prisma.componentOriginVerification.update({
      where: { bookingId: body.bookingId },
      data: {
        status: "CONFIRMED",
        txSignature: body.signature,
        explorerUrl: explorer,
        signerWallet: body.signerWallet,
        recordPda: body.componentOriginRecordPda,
      },
    });
    await prisma.txReceipt.upsert({
      where: { signature: body.signature },
      update: {
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        confirmationStatus: "CONFIRMED",
        raw: {
          action: "client_signed_verify_component_origin",
          bookingId: body.bookingId,
          vehicleId: confirmed.vehicleId,
          workshopId: confirmed.workshopId,
          recordPda: body.componentOriginRecordPda,
          signerWallet: body.signerWallet,
          feePayer: body.signerWallet,
        },
      },
      create: {
        signature: body.signature,
        cluster: env.SOLANA_CLUSTER,
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        confirmationStatus: "CONFIRMED",
        explorerUrl: explorer,
        raw: {
          action: "client_signed_verify_component_origin",
          bookingId: body.bookingId,
          vehicleId: confirmed.vehicleId,
          workshopId: confirmed.workshopId,
          recordPda: body.componentOriginRecordPda,
          signerWallet: body.signerWallet,
          feePayer: body.signerWallet,
        },
      },
    });
    const job = await enqueueOnchainJob("verify_component_origin", {
      bookingId: body.bookingId,
      vehicleId: confirmed.vehicleId,
      workshopId: confirmed.workshopId,
      signature: body.signature,
      componentOriginRecordPda: body.componentOriginRecordPda,
    });
    return {
      status: confirmed.status,
      bookingId: body.bookingId,
      signature: body.signature,
      explorerUrl: explorer,
      componentOriginRecordPda: body.componentOriginRecordPda,
      onchainJobId: job.id,
    };
  });
};
