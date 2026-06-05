import type { FastifyPluginAsync } from "fastify";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { env } from "../../config/env.js";
import { buildAnchorServiceLogPlan } from "../../lib/anchorTransactionPlan.js";
import { buildAnchorServiceLogTx, credentialIndex, estimateLegacyTransactionBase64, estimateRentExemption, explorerUrl, pda, sha256Bytes } from "../../lib/clientSignedTx.js";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { anchorServiceLogOnchain, ensureWorkshopSignerCredential } from "../../lib/onchainAuthority.js";
import { prisma } from "../../lib/prisma.js";

export const registerServiceLogRoutes: FastifyPluginAsync = async (app) => {
  const serviceLogRecordDataSize = 213;

  function isValidPubkey(value: string | null | undefined) {
    if (!value) return false;
    try {
      new PublicKey(value);
      return true;
    } catch {
      return false;
    }
  }

  function bytes(value: Uint8Array | number[] | undefined | null) {
    return value ? Array.from(value) : null;
  }

  function trimCnftName(value: string) {
    return value.replace(/\s+/g, " ").trim().slice(0, 32).trimEnd();
  }

  function publicBackendUrl(request: { protocol?: string; hostname?: string }) {
    const configured = process.env.PUBLIC_BACKEND_URL;
    if (configured) return configured.replace(/\/$/, "");
    const protocol = request.protocol ?? "http";
    const hostname = request.hostname ?? `localhost:${env.PORT}`;
    return `${protocol}://${hostname}`;
  }

  async function requireBubblegumV2TreeConfig(merkleTree: string) {
    const bubblegumProgramId = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
    const tree = new PublicKey(merkleTree);
    const [treeConfig] = PublicKey.findProgramAddressSync([tree.toBuffer()], bubblegumProgramId);
    const account = await import("../../lib/onchainAuthority.js").then(({ getConnection }) =>
      getConnection().getAccountInfo(treeConfig, "confirmed")
    );
    if (!account || !account.owner.equals(bubblegumProgramId)) {
      throw app.httpErrors.badRequest(
        `TreeConfig Bubblegum V2 belum terinisialisasi untuk tree ${merkleTree}. cNFT ini tidak bisa di-update metadata-nya dengan UpdateMetadataV2. Mint kendaraan ke Bubblegum V2 tree aktif lalu ulangi service flow.`
      );
    }
    return treeConfig.toBase58();
  }

  async function getAssetWithProof(assetId: string) {
    if (!env.SOLANA_DAS_RPC_URL) {
      throw app.httpErrors.badRequest("SOLANA_DAS_RPC_URL wajib diisi untuk update cNFT metadata real.");
    }
    const [{ createUmi }, { dasApi }, { getAssetWithProof, mplBubblegum }, { publicKey }] = await Promise.all([
      import("@metaplex-foundation/umi-bundle-defaults"),
      import("@metaplex-foundation/digital-asset-standard-api"),
      import("@metaplex-foundation/mpl-bubblegum"),
      import("@metaplex-foundation/umi"),
    ]);
    return getAssetWithProof(
      createUmi(env.SOLANA_DAS_RPC_URL).use(mplBubblegum()).use(dasApi()) as any,
      publicKey(assetId),
      { truncateCanopy: true }
    );
  }

  function normalizeParts(parts: unknown) {
    if (!Array.isArray(parts)) return [];
    return parts.map((part) => {
      const item = typeof part === "object" && part ? part as Record<string, unknown> : {};
      return {
        name: String(item.name ?? item.componentName ?? "Part"),
        partNumber: String(item.partNumber ?? ""),
        action: String(item.serviceAction ?? "serviced"),
        isOEM: Boolean(item.isOEM),
        price: Number(item.price ?? 0),
        componentId: typeof item.componentId === "string" ? item.componentId : null,
      };
    });
  }

  function buildVehiclePassportMetadata(input: {
    vehicle: { id: string; vin: string; make: string; model: string; year: number; color: string; healthScore: number; currentMileageKm: number; cnftAssetId: string | null };
    serviceLog: { id: string; recordPda: string | null; txSignature: string | null; odometerKm: number };
    invoice: { id: string; totalIdr: number; parts: unknown };
    workshopName: string;
  }) {
    const parts = normalizeParts(input.invoice.parts);
    const repairedPartCount = parts.filter((part) => ["replace", "replaced", "serviced"].includes(part.action.toLowerCase())).length;
    const healthScore = Math.min(100, Math.max(input.vehicle.healthScore, input.vehicle.healthScore + 3 + repairedPartCount * 4));
    const serviceCount = 1;
    return {
      healthScore,
      metadata: {
        name: trimCnftName(`NOC ${input.vehicle.make} ${input.vehicle.model}`),
        description: `NOC ID vehicle passport for ${input.vehicle.vin}. Updated after verified service anchoring.`,
        image: "https://gateway.irys.xyz/noc-id-placeholder-vehicle.png",
        external_url: "https://noc-id.dev/vehicles/" + input.vehicle.id,
        attributes: [
          { trait_type: "VIN", value: input.vehicle.vin },
          { trait_type: "Make", value: input.vehicle.make },
          { trait_type: "Model", value: input.vehicle.model },
          { trait_type: "Year", value: input.vehicle.year },
          { trait_type: "Color", value: input.vehicle.color },
          { trait_type: "Health Score", value: healthScore },
          { trait_type: "Odometer KM", value: input.serviceLog.odometerKm || input.vehicle.currentMileageKm },
          { trait_type: "Last Service Workshop", value: input.workshopName },
          { trait_type: "Last Service Log PDA", value: input.serviceLog.recordPda ?? "" },
          { trait_type: "Last Service Signature", value: input.serviceLog.txSignature ?? "" },
          { trait_type: "Serviced Parts", value: parts.map((part) => part.name).join(", ") || "None" },
        ],
        properties: {
          category: "vehicle-passport",
          files: [],
        },
        noc: {
          vehicle_id: input.vehicle.id,
          asset_id: input.vehicle.cnftAssetId,
          service_log_id: input.serviceLog.id,
          service_log_pda: input.serviceLog.recordPda,
          service_signature: input.serviceLog.txSignature,
          service_count: serviceCount,
          total_invoice_idr: input.invoice.totalIdr,
          parts,
          updated_at: new Date().toISOString(),
        },
      }
    };
  }

  function optionValue<T>(input: unknown): T | null {
    if (input && typeof input === "object" && "__option" in input && (input as { __option?: string }).__option === "Some") {
      return (input as unknown as { value: T }).value;
    }
    return null;
  }

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

  app.post("/anchor-devnet/draft", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      odometerKm: z.number().int().nonnegative().default(0),
      evidenceHash: z.string().min(32).optional(),
      workshopAuthorityWallet: z.string().min(32)
    }).parse(request.body);
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { vehicle: true, workshop: true, invoice: true, serviceLog: true }
    });
    if (!booking) throw app.httpErrors.notFound("Booking not found.");
    if (!booking.invoice) throw app.httpErrors.badRequest("Invoice wajib ada sebelum anchoring.");
    if (!["PAID", "ANCHORING"].includes(booking.status)) {
      throw app.httpErrors.badRequest("Booking harus PAID sebelum service log di-anchor.");
    }
    if (!booking.vehicle.vehicleRecordPda) {
      throw app.httpErrors.badRequest("VehicleRecord PDA belum tersedia. Kendaraan harus minted dan registered on-chain dulu.");
    }
    const storedWorkshopAuthority = booking.workshop.authorityWallet;
    const shouldAdoptSigner =
      !storedWorkshopAuthority ||
      storedWorkshopAuthority.startsWith("DemoWorkshop") ||
      !isValidPubkey(storedWorkshopAuthority);
    if (shouldAdoptSigner) {
      await prisma.workshop.update({
        where: { id: booking.workshopId },
        data: { authorityWallet: body.workshopAuthorityWallet }
      });
      booking.workshop.authorityWallet = body.workshopAuthorityWallet;
    }
    if (booking.workshop.authorityWallet !== body.workshopAuthorityWallet) {
      throw app.httpErrors.badRequest(`Wallet Phantom ${body.workshopAuthorityWallet} bukan workshop authority ${booking.workshop.authorityWallet ?? "unset"}.`);
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
    const workshopBootstrap = await ensureWorkshopSignerCredential({
      workshopId: booking.workshopId,
      authorityWallet: body.workshopAuthorityWallet,
      metadataHash: booking.workshop.metadataHash,
    });
    await prisma.workshop.update({
      where: { id: booking.workshopId },
      data: {
        recordPda: workshopBootstrap.workshopRecordPda,
        authorityWallet: body.workshopAuthorityWallet,
      }
    });
    const existingVerifiedSigner = await prisma.workshopCredential.findFirst({
      where: { workshopId: booking.workshopId, credential: "verified_signer", revokedAt: null },
      orderBy: { createdAt: "desc" }
    });
    if (existingVerifiedSigner) {
      await prisma.workshopCredential.update({
        where: { id: existingVerifiedSigner.id },
        data: {
          recordPda: workshopBootstrap.credentialRecordPda,
          txSignature: workshopBootstrap.signature ?? existingVerifiedSigner.txSignature,
          issuedBy: existingVerifiedSigner.issuedBy || "platform",
        }
      });
    } else {
      await prisma.workshopCredential.create({
        data: {
          workshopId: booking.workshopId,
          credential: "verified_signer",
          issuedBy: "platform",
          recordPda: workshopBootstrap.credentialRecordPda,
          txSignature: workshopBootstrap.signature,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      });
    }
    const workshopRecordPda = workshopBootstrap.workshopRecordPda;
    const verifiedSignerIndex = credentialIndex.verified_signer;
    const credentialRecordPda = pda(["credential", Buffer.from(new PublicKey(workshopRecordPda).toBytes()), Buffer.from([verifiedSignerIndex])]).toBase58();
    const storedCredential = await prisma.workshopCredential.findFirst({
      where: { workshopId: booking.workshopId, credential: "verified_signer", revokedAt: null },
      orderBy: { createdAt: "desc" }
    });
    if (storedCredential?.recordPda && storedCredential.recordPda !== credentialRecordPda) {
      throw app.httpErrors.badRequest("Credential PDA di DB tidak cocok dengan PDA program. Sync credential dulu.");
    }
    const serviceLogRecordPda = pda(["service-log", Buffer.from(new PublicKey(booking.vehicle.vehicleRecordPda).toBytes()), sha256Bytes(serviceLog.id)]).toBase58();
    await prisma.serviceLog.update({ where: { id: serviceLog.id }, data: { recordPda: serviceLogRecordPda, invoiceHash, partsHash, evidenceHash: body.evidenceHash } });
    const tx = await buildAnchorServiceLogTx({
      payerWallet: body.workshopAuthorityWallet,
      workshopAuthorityWallet: body.workshopAuthorityWallet,
      vehicleRecordPda: booking.vehicle.vehicleRecordPda,
      workshopRecordPda,
      credentialRecordPda,
      serviceLogRecordPda,
      serviceLogId: serviceLog.id,
      odometerKm: body.odometerKm || booking.vehicle.currentMileageKm,
      invoiceHash,
      partsHash,
      evidenceHash: body.evidenceHash,
    });
    const [feeEstimate, rentEstimate] = await Promise.all([
      estimateLegacyTransactionBase64(tx.transactionBase64),
      estimateRentExemption(serviceLogRecordDataSize)
    ]);
    const totalLamports = feeEstimate.networkFeeLamports + rentEstimate.rentLamports;
    return {
      status: "READY_FOR_WALLET_SIGNATURE",
      serviceLogId: serviceLog.id,
      bookingId: booking.id,
      transactionBase64: tx.transactionBase64,
      summary: {
        action: "anchor_service_log",
        cluster: env.SOLANA_CLUSTER,
        feePayer: body.workshopAuthorityWallet,
        signerRequired: "workshop verified_signer wallet",
        affectedVehicle: booking.vehicle.vin,
        serviceIdHash: tx.serviceIdHash,
        invoiceHash,
        partsHash,
      },
      costEstimate: {
        networkFeeLamports: feeEstimate.networkFeeLamports,
        networkFeeSol: feeEstimate.networkFeeSol,
        storageRentLamports: rentEstimate.rentLamports,
        storageRentSol: rentEstimate.rentSol,
        storageAccountBytes: rentEstimate.dataSize,
        totalLamports,
        totalSol: totalLamports / 1_000_000_000,
        note: "Phantom menampilkan network fee sebagai biaya transaksi. Storage rent adalah deposit rent-exempt untuk PDA ServiceLogRecord baru dan terlihat sebagai perubahan saldo pada detail transaksi."
      },
      accounts: {
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        vehicleRecordPda: booking.vehicle.vehicleRecordPda,
        workshopRecordPda,
        credentialRecordPda,
        serviceLogRecordPda,
      }
    };
  });

  app.post("/:serviceLogId/confirm-signed", async (request) => {
    const params = z.object({ serviceLogId: z.string() }).parse(request.params);
    const body = z.object({
      signature: z.string().min(32),
      signerWallet: z.string().min(32)
    }).parse(request.body);
    const serviceLog = await prisma.serviceLog.findUnique({ where: { id: params.serviceLogId }, include: { booking: true, workshop: true } });
    if (!serviceLog) throw app.httpErrors.notFound("Service log not found.");
    if (serviceLog.workshop.authorityWallet && serviceLog.workshop.authorityWallet !== body.signerWallet) {
      throw app.httpErrors.badRequest("Workshop signer wallet mismatch.");
    }
    await prisma.serviceLog.update({ where: { id: serviceLog.id }, data: { txSignature: body.signature } });
    if (serviceLog.bookingId) {
      await prisma.booking.update({ where: { id: serviceLog.bookingId }, data: { status: "ANCHORING" } });
    }
    await prisma.txReceipt.upsert({
      where: { signature: body.signature },
      update: { programId: env.NOC_REGISTRY_PROGRAM_ID, confirmationStatus: "CONFIRMED", raw: { action: "client_signed_anchor_service_log", serviceLogId: serviceLog.id, bookingId: serviceLog.bookingId, vehicleId: serviceLog.vehicleId, workshopId: serviceLog.workshopId, signerWallet: body.signerWallet, feePayer: body.signerWallet } },
      create: {
        signature: body.signature,
        cluster: env.SOLANA_CLUSTER,
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        confirmationStatus: "CONFIRMED",
        explorerUrl: explorerUrl(body.signature),
        raw: { action: "client_signed_anchor_service_log", serviceLogId: serviceLog.id, bookingId: serviceLog.bookingId, vehicleId: serviceLog.vehicleId, workshopId: serviceLog.workshopId, signerWallet: body.signerWallet, feePayer: body.signerWallet }
      }
    });
    const job = await enqueueOnchainJob("anchor_service_log", {
      serviceLogId: serviceLog.id,
      vehicleId: serviceLog.vehicleId,
      workshopId: serviceLog.workshopId,
      signature: body.signature,
      serviceLogRecordPda: serviceLog.recordPda
    });
    return {
      serviceLogId: serviceLog.id,
      bookingId: serviceLog.bookingId,
      status: "ANCHORING",
      signature: body.signature,
      explorerUrl: explorerUrl(body.signature),
      onchainJobId: job.id
    };
  });

  app.post("/:serviceLogId/passport-update/draft", async (request) => {
    const params = z.object({ serviceLogId: z.string() }).parse(request.params);
    const body = z.object({ authorityWallet: z.string().min(32) }).parse(request.body);
    const serviceLog = await prisma.serviceLog.findUnique({
      where: { id: params.serviceLogId },
      include: {
        vehicle: true,
        workshop: true,
        booking: { include: { invoice: true } }
      }
    });
    if (!serviceLog) throw app.httpErrors.notFound("Service log not found.");
    if (!serviceLog.txSignature) throw app.httpErrors.badRequest("Service log harus anchored dulu sebelum update cNFT metadata.");
    if (!serviceLog.booking?.invoice) throw app.httpErrors.badRequest("Invoice tidak ditemukan untuk menyusun vehicle passport metadata.");
    if (!serviceLog.vehicle.cnftAssetId || !serviceLog.vehicle.treeAddress) {
      throw app.httpErrors.badRequest("Vehicle belum punya cNFT asset/tree lengkap.");
    }
    const asset = await getAssetWithProof(serviceLog.vehicle.cnftAssetId);
    const proofMerkleTree = String(asset.merkleTree);
    if (serviceLog.vehicle.treeAddress !== proofMerkleTree) {
      throw app.httpErrors.badRequest(
        `Tree kendaraan di database (${serviceLog.vehicle.treeAddress}) tidak sama dengan tree dari DAS proof (${proofMerkleTree}). Sync cNFT refs kendaraan sebelum update metadata.`
      );
    }
    const treeConfig = await requireBubblegumV2TreeConfig(proofMerkleTree);
    const passport = buildVehiclePassportMetadata({
      vehicle: serviceLog.vehicle,
      serviceLog,
      invoice: serviceLog.booking.invoice,
      workshopName: serviceLog.workshop.name,
    });
    const metadataHash = sha256Hex(passport.metadata);
    const metadataUri = `${publicBackendUrl(request)}/storage/metadata/${metadataHash}.json`;
    const pendingTarget = `vehicle-passport:${serviceLog.vehicleId}:${metadataHash}`;
    await prisma.auditEvent.create({
      data: {
        action: "pending_vehicle_passport_metadata",
        target: pendingTarget,
        details: {
          serviceLogId: serviceLog.id,
          vehicleId: serviceLog.vehicleId,
          authorityWallet: body.authorityWallet,
          metadataHash,
          metadataUri,
          healthScore: passport.healthScore,
          odometerKm: serviceLog.odometerKm || serviceLog.vehicle.currentMileageKm,
          metadata: passport.metadata,
        }
      }
    });
    const assetMetadata = asset.metadata as any;
    const collectionValue = optionValue<{ key?: unknown } | string>(assetMetadata.collection);
    const collectionAddress = collectionValue
      ? String(typeof collectionValue === "object" && "key" in collectionValue ? collectionValue.key : collectionValue)
      : null;
    const tokenStandard = optionValue<number>(assetMetadata.tokenStandard);
    const creators = Array.isArray(assetMetadata.creators)
      ? assetMetadata.creators.map((creator: any) => ({
        address: String(creator.address),
        verified: Boolean(creator.verified),
        share: Number(creator.share ?? 0),
      }))
      : [{ address: body.authorityWallet, verified: false, share: 100 }];
    return {
      status: "READY_FOR_WALLET_SIGNATURE",
      serviceLogId: serviceLog.id,
      vehicleId: serviceLog.vehicleId,
      assetId: serviceLog.vehicle.cnftAssetId,
      metadataHash,
      metadataUri,
      authorityWallet: body.authorityWallet,
      collectionAddress,
      currentMetadata: {
        name: String(assetMetadata.name ?? `NOC ${serviceLog.vehicle.make} ${serviceLog.vehicle.model}`),
        symbol: String(assetMetadata.symbol ?? ""),
        uri: String(assetMetadata.uri ?? serviceLog.vehicle.metadataUri ?? ""),
        sellerFeeBasisPoints: Number(assetMetadata.sellerFeeBasisPoints ?? 0),
        primarySaleHappened: Boolean(assetMetadata.primarySaleHappened ?? false),
        isMutable: assetMetadata.isMutable !== false,
        tokenStandard,
        creators,
        collection: collectionAddress,
      },
      updateArgs: {
        uri: metadataUri,
      },
      proof: {
        leafOwner: String(asset.leafOwner),
        leafDelegate: String(asset.leafDelegate),
        treeConfig,
        merkleTree: proofMerkleTree,
        root: bytes(asset.root),
        assetDataHash: bytes(asset.asset_data_hash),
        flags: asset.flags,
        nonce: Number(asset.nonce),
        index: Number(asset.index),
        proof: asset.proof.map((item: unknown) => String(item)),
      },
      costEstimate: {
        networkFeeSol: 0.00008,
        storageRentSol: 0,
        totalSol: 0.00008,
        note: "Update cNFT metadata mengubah leaf metadata pointer. Tidak membuat PDA baru. Address Lookup Table dipakai agar proof cNFT muat di transaksi v0."
      },
      summary: {
        action: "update_cnft_metadata",
        cluster: env.SOLANA_CLUSTER,
        signerRequired: "collection/tree metadata authority",
        affectedVehicle: serviceLog.vehicle.vin,
        newMetadataUri: metadataUri,
      }
    };
  });

  app.post("/:serviceLogId/passport-update/confirm", async (request) => {
    const params = z.object({ serviceLogId: z.string() }).parse(request.params);
    const body = z.object({
      signature: z.string().min(32),
      signerWallet: z.string().min(32),
      metadataHash: z.string().length(64),
      metadataUri: z.string().url()
    }).parse(request.body);
    const serviceLog = await prisma.serviceLog.findUnique({ where: { id: params.serviceLogId }, include: { vehicle: true, booking: true } });
    if (!serviceLog) throw app.httpErrors.notFound("Service log not found.");
    const pending = await prisma.auditEvent.findFirst({
      where: {
        action: "pending_vehicle_passport_metadata",
        target: `vehicle-passport:${serviceLog.vehicleId}:${body.metadataHash}`,
      },
      orderBy: { createdAt: "desc" }
    });
    if (!pending) throw app.httpErrors.badRequest("Pending passport metadata draft tidak ditemukan.");
    const details = pending.details as Record<string, any>;
    await prisma.vehicle.update({
      where: { id: serviceLog.vehicleId },
      data: {
        metadataHash: body.metadataHash,
        metadataUri: body.metadataUri,
        currentMileageKm: Number(details.odometerKm ?? serviceLog.odometerKm ?? serviceLog.vehicle.currentMileageKm),
        healthScore: Number(details.healthScore ?? serviceLog.vehicle.healthScore),
      }
    });
    if (serviceLog.bookingId) {
      await prisma.booking.update({
        where: { id: serviceLog.bookingId },
        data: { status: "ANCHORED" }
      });
    }
    await prisma.txReceipt.upsert({
      where: { signature: body.signature },
      update: { programId: "mpl-bubblegum", confirmationStatus: "CONFIRMED", raw: { action: "client_signed_update_cnft_metadata", serviceLogId: serviceLog.id, vehicleId: serviceLog.vehicleId, metadataHash: body.metadataHash, metadataUri: body.metadataUri, signerWallet: body.signerWallet, feePayer: body.signerWallet } },
      create: {
        signature: body.signature,
        cluster: env.SOLANA_CLUSTER,
        programId: "mpl-bubblegum",
        confirmationStatus: "CONFIRMED",
        explorerUrl: explorerUrl(body.signature),
        raw: { action: "client_signed_update_cnft_metadata", serviceLogId: serviceLog.id, vehicleId: serviceLog.vehicleId, metadataHash: body.metadataHash, metadataUri: body.metadataUri, signerWallet: body.signerWallet, feePayer: body.signerWallet }
      }
    });
    const job = await enqueueOnchainJob("update_cnft_metadata", {
      serviceLogId: serviceLog.id,
      vehicleId: serviceLog.vehicleId,
      signerWallet: body.signerWallet,
      signature: body.signature,
      metadataHash: body.metadataHash,
      metadataUri: body.metadataUri,
    });
    return {
      serviceLogId: serviceLog.id,
      vehicleId: serviceLog.vehicleId,
      status: "PASSPORT_UPDATED",
      signature: body.signature,
      explorerUrl: explorerUrl(body.signature),
      metadataHash: body.metadataHash,
      metadataUri: body.metadataUri,
      onchainJobId: job.id
    };
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
    if (!booking.vehicle.vehicleRecordPda) {
      throw app.httpErrors.badRequest("VehicleRecord PDA belum tersedia. Kendaraan harus minted dan registered on-chain dulu.");
    }
    const onchain = await anchorServiceLogOnchain({
      serviceLogId: serviceLog.id,
      vehicleId: booking.vehicleId,
      workshopId: booking.workshopId,
      workshopAuthorityWallet: booking.workshop.authorityWallet,
      workshopMetadataHash: booking.workshop.metadataHash,
      vehicleRecordPda: booking.vehicle.vehicleRecordPda,
      odometerKm: body.odometerKm || booking.vehicle.currentMileageKm,
      invoiceHash,
      partsHash,
      evidenceHash: body.evidenceHash,
    });
    await prisma.workshop.update({
      where: { id: booking.workshopId },
      data: { recordPda: onchain.workshopRecordPda }
    });
    await prisma.workshopCredential.updateMany({
      where: { workshopId: booking.workshopId, credential: "verified_signer", revokedAt: null },
      data: { recordPda: onchain.credentialRecordPda }
    });
    await prisma.serviceLog.update({ where: { id: serviceLog.id }, data: { txSignature: onchain.signature ?? serviceLog.txSignature, recordPda: onchain.recordPda } });
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "ANCHORED" } });
    const job = await enqueueOnchainJob("anchor_service_log", {
      serviceLogId: serviceLog.id,
      vehicleId: booking.vehicleId,
      workshopId: booking.workshopId,
      signature: onchain.signature ?? serviceLog.txSignature,
      serviceLogRecordPda: onchain.recordPda
    });
    return {
      serviceLogId: serviceLog.id,
      bookingId: booking.id,
      status: "ANCHORED",
      signature: onchain.signature ?? serviceLog.txSignature,
      explorerUrl: onchain.explorerUrl ?? (serviceLog.txSignature ? `https://explorer.solana.com/tx/${serviceLog.txSignature}?cluster=${env.SOLANA_CLUSTER}` : null),
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
