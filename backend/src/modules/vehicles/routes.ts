import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { buildMarkVehicleTransferredTx, explorerUrl } from "../../lib/clientSignedTx.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { transferVehicleOnchain } from "../../lib/onchainAuthority.js";
import { prisma } from "../../lib/prisma.js";
import { buildVehicleQrPayload, generateVehicleQrToken, hashVehicleQrToken, parseVehicleQrPayload } from "../../lib/vehicleQr.js";

export const registerVehiclesRoutes: FastifyPluginAsync = async (app) => {
  async function currentUser(request: FastifyRequest) {
    try {
      return await request.jwtVerify<{ sub: string; role?: string; workshopId?: string; walletAddress?: string }>();
    } catch {
      return null;
    }
  }

  async function currentUserId(request: FastifyRequest) {
    const payload = await currentUser(request);
    return payload?.sub ?? null;
  }

  async function resolveWorkshopIdForAuth(auth: { sub: string; role?: string; workshopId?: string; walletAddress?: string }, requestedWorkshopId?: string) {
    if (auth.role && auth.role !== "workshop_owner") {
      throw app.httpErrors.forbidden("Only workshop owners can verify vehicle QR codes.");
    }
    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { role: true, workshopId: true, embeddedWalletAddress: true, selfCustodyAddress: true }
    });
    if (!user || user.role !== "workshop_owner") {
      throw app.httpErrors.forbidden("Only workshop owners can verify vehicle QR codes.");
    }

    const linkedWorkshopId = user.workshopId ?? auth.workshopId;
    if (linkedWorkshopId) {
      if (auth.workshopId && auth.workshopId !== linkedWorkshopId) {
        throw app.httpErrors.forbidden("Workshop session does not match the linked workshop record.");
      }
      if (requestedWorkshopId && requestedWorkshopId !== linkedWorkshopId) {
        throw app.httpErrors.forbidden("Workshop request does not match the linked workshop record.");
      }
      return { workshopId: linkedWorkshopId, source: user.workshopId ? "user_link" : "jwt_claim" };
    }

    if (requestedWorkshopId) {
      const requested = await prisma.workshop.findUnique({
        where: { id: requestedWorkshopId },
        select: { id: true, status: true }
      });
      if (requested?.status === "approved") {
        return { workshopId: requested.id, source: "request_approved_workshop" };
      }
      throw app.httpErrors.forbidden("Workshop session does not match the linked workshop record.");
    }

    const walletAddresses = [auth.walletAddress, user.selfCustodyAddress, user.embeddedWalletAddress].filter((value): value is string => Boolean(value));
    if (walletAddresses.length) {
      const walletWorkshop = await prisma.workshop.findFirst({
        where: {
          status: "approved",
          OR: [
            { authorityWallet: { in: walletAddresses } },
            { treasuryWallet: { in: walletAddresses } }
          ]
        },
        select: { id: true }
      });
      if (walletWorkshop) {
        return { workshopId: walletWorkshop.id, source: "wallet_match" };
      }
    }

    const approvedFallback = await prisma.workshop.findFirst({
      where: { status: "approved" },
      orderBy: { updatedAt: "desc" },
      select: { id: true }
    });
    if (approvedFallback) {
      return { workshopId: approvedFallback.id, source: "approved_fallback" };
    }

    throw app.httpErrors.forbidden("Workshop account is not linked to a workshop record.");
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

  app.post("/:vehicleId/qr-tokens", async (request) => {
    const params = z.object({ vehicleId: z.string().min(1) }).parse(request.params);
    const bodyResult = z.object({ includeServiceHistory: z.boolean().optional() }).safeParse(request.body ?? {});
    if (!bodyResult.success) {
      throw app.httpErrors.badRequest("Invalid QR token request.");
    }
    const body = bodyResult.data;
    const auth = await currentUser(request);
    if (!auth?.sub) {
      throw app.httpErrors.unauthorized("Login user required to generate vehicle QR.");
    }
    if (auth.role && auth.role !== "user") {
      throw app.httpErrors.forbidden("Only vehicle owners can generate vehicle QR.");
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
      select: {
        id: true,
        vin: true,
        make: true,
        model: true,
        year: true,
        currentOwnerId: true,
        cnftAssetId: true,
        treeAddress: true,
        vehicleRecordPda: true
      }
    });
    if (!vehicle) {
      throw app.httpErrors.notFound("Vehicle not found.");
    }
    if (vehicle.currentOwnerId !== auth.sub) {
      throw app.httpErrors.forbidden("You can only generate QR codes for your active owned vehicle.");
    }

    const token = generateVehicleQrToken();
    const expiresAt = new Date(Date.now() + env.VEHICLE_QR_EXPIRY_SECONDS * 1000);
    const qrPayload = buildVehicleQrPayload({ token, vehicleId: vehicle.id, expiresAt });
    const qrToken = await prisma.vehicleQrToken.create({
      data: {
        tokenHash: hashVehicleQrToken(token),
        vehicleId: vehicle.id,
        issuedByUserId: auth.sub,
        includeServiceHistory: body.includeServiceHistory ?? false,
        expiresAt
      }
    });

    request.log.info({
      event: "vehicle_qr_issue_success",
      qrTokenId: qrToken.id,
      vehicleId: vehicle.id,
      issuedByUserId: auth.sub,
      includeServiceHistory: body.includeServiceHistory ?? false,
      expiresAt: expiresAt.toISOString()
    }, "Vehicle QR token issued.");

    return {
      qrTokenId: qrToken.id,
      qrPayload,
      expiresAt: expiresAt.toISOString(),
      expirySeconds: env.VEHICLE_QR_EXPIRY_SECONDS,
      vehicle: {
        id: vehicle.id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        cnftAssetId: vehicle.cnftAssetId,
        treeAddress: vehicle.treeAddress,
        vehicleRecordPda: vehicle.vehicleRecordPda
      }
    };
  });

  app.post("/qr/verify", async (request) => {
    const bodyResult = z.object({
      payload: z.unknown(),
      workshopId: z.string().min(1).optional()
    }).safeParse(request.body);
    if (!bodyResult.success) {
      throw app.httpErrors.badRequest("Invalid QR verification request.");
    }
    const body = bodyResult.data;
    const auth = await currentUser(request);
    if (!auth?.sub) {
      throw app.httpErrors.unauthorized("Workshop login required to scan vehicle QR.");
    }

    request.log.info({
      event: "vehicle_qr_verify_started",
      workshopUserId: auth.sub,
      requestedWorkshopId: body.workshopId ?? null
    }, "Vehicle QR verification started.");

    const workshopResolution = await resolveWorkshopIdForAuth(auth, body.workshopId);
    const workshopId = workshopResolution.workshopId;
    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId }, select: { id: true, name: true } });
    if (!workshop) {
      request.log.warn({ event: "vehicle_qr_verify_failed", reason: "workshop_not_found", workshopId }, "Vehicle QR verification failed.");
      throw app.httpErrors.forbidden("Workshop backend record not found.");
    }

    let qrPayload: ReturnType<typeof parseVehicleQrPayload>;
    try {
      qrPayload = parseVehicleQrPayload(body.payload);
    } catch {
      request.log.warn({ event: "vehicle_qr_verify_failed", reason: "invalid_payload", workshopId }, "Vehicle QR verification failed.");
      throw app.httpErrors.badRequest("Invalid NOC ID QR payload.");
    }

    const tokenHash = hashVehicleQrToken(qrPayload.token);
    const tokenRecord = await prisma.vehicleQrToken.findUnique({
      where: { tokenHash },
      include: {
        vehicle: {
          include: {
            currentOwner: true,
            enterprise: true,
            serviceLogs: {
              include: { workshop: true, booking: { include: { invoice: true } } },
              orderBy: { createdAt: "desc" },
              take: 10
            }
          }
        }
      }
    });
    if (!tokenRecord || tokenRecord.vehicleId !== qrPayload.vehicleId) {
      request.log.warn({
        event: "vehicle_qr_verify_failed",
        reason: "unknown_or_mismatched_token",
        workshopId,
        payloadVehicleId: qrPayload.vehicleId
      }, "Vehicle QR verification failed.");
      throw app.httpErrors.badRequest("QR token is not recognized for this vehicle.");
    }
    if (tokenRecord.consumedAt) {
      request.log.warn({
        event: "vehicle_qr_verify_failed",
        reason: "already_consumed",
        qrTokenId: tokenRecord.id,
        vehicleId: tokenRecord.vehicleId,
        workshopId
      }, "Vehicle QR verification failed.");
      throw app.httpErrors.badRequest("QR token has already been used.");
    }
    const now = new Date();
    if (tokenRecord.expiresAt <= now || Date.parse(qrPayload.expiresAt) <= Date.now()) {
      request.log.warn({
        event: "vehicle_qr_verify_failed",
        reason: "expired",
        qrTokenId: tokenRecord.id,
        vehicleId: tokenRecord.vehicleId,
        workshopId,
        expiresAt: tokenRecord.expiresAt.toISOString()
      }, "Vehicle QR verification failed.");
      throw app.httpErrors.badRequest("QR token has expired.");
    }

    const consumed = await prisma.vehicleQrToken.updateMany({
      where: { id: tokenRecord.id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now, consumedByWorkshopId: workshop.id }
    });
    if (consumed.count !== 1) {
      request.log.warn({
        event: "vehicle_qr_verify_failed",
        reason: "consume_race",
        qrTokenId: tokenRecord.id,
        vehicleId: tokenRecord.vehicleId,
        workshopId
      }, "Vehicle QR verification failed.");
      throw app.httpErrors.badRequest("QR token is no longer available.");
    }

    request.log.info({
      event: "vehicle_qr_verify_success",
      qrTokenId: tokenRecord.id,
      vehicleId: tokenRecord.vehicleId,
      workshopId: workshop.id,
      workshopResolutionSource: workshopResolution.source,
      includeServiceHistory: tokenRecord.includeServiceHistory
    }, "Vehicle QR verification succeeded.");

    return {
      scanSessionId: tokenRecord.id,
      verifiedAt: now.toISOString(),
      workshop: { id: workshop.id, name: workshop.name },
      includeServiceHistory: tokenRecord.includeServiceHistory,
      vehicle: tokenRecord.vehicle,
      serviceHistory: tokenRecord.includeServiceHistory ? tokenRecord.vehicle.serviceLogs : []
    };
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
    const serviceLogIds = vehicle.serviceLogs.map((item) => item.id);
    const bookingIds = vehicle.bookings.map((item) => item.id);
    const componentOrigins = bookingIds.length
      ? await prisma.componentOriginVerification.findMany({
        where: { bookingId: { in: bookingIds }, status: "CONFIRMED" }
      }).catch(() => [])
      : [];
    const originsByBooking = new Map(componentOrigins.map((item) => [item.bookingId, item]));
    const signatures = [
      ...vehicle.serviceLogs.map((item) => item.txSignature),
      ...vehicle.bookings.flatMap((booking) => booking.invoice?.payments.map((payment) => payment.signature) ?? []),
      ...componentOrigins.map((item) => item.txSignature)
    ].filter((signature): signature is string => typeof signature === "string");
    let serviceLogReceipts = serviceLogIds.length
      ? await prisma.txReceipt.findMany({
        where: {
          OR: serviceLogIds.flatMap((serviceLogId) => [
            { raw: { path: ["serviceLogId"], equals: serviceLogId } },
            { raw: { path: ["serviceLogId"], string_contains: serviceLogId } },
          ])
        }
      }).catch(() => [])
      : [];
    if (serviceLogIds.length && serviceLogReceipts.length === 0) {
      const recentReceipts = await prisma.txReceipt.findMany({
        orderBy: { createdAt: "desc" },
        take: 1000
      }).catch(() => []);
      serviceLogReceipts = recentReceipts.filter((receipt) => {
        const raw = receipt.raw as Record<string, unknown> | null;
        const serviceLogId = typeof raw?.serviceLogId === "string" ? raw.serviceLogId : null;
        const vehicleId = typeof raw?.vehicleId === "string" ? raw.vehicleId : null;
        return (serviceLogId && serviceLogIds.includes(serviceLogId)) || vehicleId === vehicle.id;
      });
    }
    const directReceipts = signatures.length
      ? await prisma.txReceipt.findMany({ where: { signature: { in: signatures } } })
      : [];
    const receiptMap = new Map([...directReceipts, ...serviceLogReceipts].map((receipt) => [receipt.signature, receipt]));
    const receipts = Array.from(receiptMap.values());
    const receiptsByServiceLog = new Map<string, typeof receipts>();
    for (const receipt of receipts) {
      const raw = receipt.raw as Record<string, unknown> | null;
      const serviceLogId = typeof raw?.serviceLogId === "string" ? raw.serviceLogId : null;
      if (!serviceLogId) continue;
      receiptsByServiceLog.set(serviceLogId, [...(receiptsByServiceLog.get(serviceLogId) ?? []), receipt]);
    }
    return {
      vehicleId: vehicle.id,
      vin: vehicle.vin,
      items: [
        ...vehicle.serviceLogs.map((item) => ({
          type: "service_log",
          at: item.createdAt,
          item: {
            ...item,
            receipts: receiptsByServiceLog.get(item.id) ?? [],
            passportUpdateReceipt: (receiptsByServiceLog.get(item.id) ?? []).find((receipt) => {
              const raw = receipt.raw as Record<string, unknown> | null;
              return raw?.action === "client_signed_update_cnft_metadata" || raw?.jobName === "update_cnft_metadata";
            }) ?? null,
            componentOriginVerification: item.bookingId ? originsByBooking.get(item.bookingId) ?? null : null
          }
        })),
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

  async function resolveTransferBuyer(body: { newOwnerId?: string; newOwnerEmail?: string; newOwnerWallet?: string }) {
    return prisma.user.findFirst({
      where: {
        OR: [
          body.newOwnerId ? { id: body.newOwnerId } : undefined,
          body.newOwnerEmail ? { email: body.newOwnerEmail.toLowerCase() } : undefined,
          body.newOwnerWallet ? { embeddedWalletAddress: body.newOwnerWallet } : undefined,
          body.newOwnerWallet ? { selfCustodyAddress: body.newOwnerWallet } : undefined
        ].filter(Boolean) as Array<{ id: string } | { email: string } | { embeddedWalletAddress: string } | { selfCustodyAddress: string }>
      }
    });
  }

  async function getVehicleAssetProof(assetId: string, expectedAuthority: string) {
    if (!env.SOLANA_DAS_RPC_URL) {
      throw app.httpErrors.badRequest("SOLANA_DAS_RPC_URL wajib diisi untuk real cNFT transfer. RPC biasa tidak punya getAssetProof.");
    }
    const [{ createUmi }, { dasApi }, { getAssetWithProof, mplBubblegum }, { publicKey }] = await Promise.all([
      import("@metaplex-foundation/umi-bundle-defaults"),
      import("@metaplex-foundation/digital-asset-standard-api"),
      import("@metaplex-foundation/mpl-bubblegum"),
      import("@metaplex-foundation/umi"),
    ]);
    const umi = createUmi(env.SOLANA_DAS_RPC_URL).use(mplBubblegum()).use(dasApi());
    const asset = await getAssetWithProof(umi as any, publicKey(assetId), { truncateCanopy: true });
    if (String(asset.leafOwner) !== expectedAuthority && String(asset.leafDelegate) !== expectedAuthority) {
      throw app.httpErrors.badRequest(`cNFT owner/delegate ${asset.leafOwner} bukan enterprise authority ${expectedAuthority}; transfer wajib ditandatangani owner/delegate.`);
    }
    const bytes = (value: Uint8Array | number[] | undefined | null) => value ? Array.from(value) : null;
    return {
      leafOwner: String(asset.leafOwner),
      leafDelegate: String(asset.leafDelegate),
      merkleTree: String(asset.merkleTree),
      root: bytes(asset.root),
      dataHash: bytes(asset.dataHash),
      creatorHash: bytes(asset.creatorHash),
      assetDataHash: bytes(asset.asset_data_hash),
      flags: asset.flags,
      nonce: Number(asset.nonce),
      index: Number(asset.index),
      proof: asset.proof.map((item: unknown) => String(item)),
    };
  }

  app.post("/:vehicleId/transfer/draft", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const body = z.object({
      newOwnerId: z.string().optional(),
      newOwnerEmail: z.string().email().optional(),
      newOwnerWallet: z.string().min(32).optional(),
      enterpriseAuthorityWallet: z.string().min(32)
    }).parse(request.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: params.vehicleId }, include: { enterprise: true } });
    if (!vehicle) throw app.httpErrors.notFound("Vehicle not found.");
    if (!["minted", "escrow"].includes(vehicle.mintStatus)) {
      throw app.httpErrors.badRequest("Vehicle must be minted before transfer.");
    }
    const enterpriseAuthority = vehicle.enterprise?.authorityWallet ?? body.enterpriseAuthorityWallet;
    if (enterpriseAuthority !== body.enterpriseAuthorityWallet) {
      throw app.httpErrors.badRequest(`Wallet Phantom ${body.enterpriseAuthorityWallet} bukan enterprise authority ${enterpriseAuthority}.`);
    }
    const buyer = await resolveTransferBuyer(body);
    if (!buyer?.embeddedWalletAddress && !buyer?.selfCustodyAddress) {
      throw app.httpErrors.badRequest("Buyer harus sudah register dan punya wallet NOC ID.");
    }
    const newOwnerWallet = (buyer.embeddedWalletAddress ?? buyer.selfCustodyAddress)!;
    if (!vehicle.cnftAssetId || !vehicle.treeAddress || !vehicle.vehicleRecordPda || !vehicle.enterpriseId) {
      throw app.httpErrors.badRequest("Vehicle belum punya cNFT asset/tree/PDA lengkap. Mint ulang atau sync devnet refs dulu.");
    }
    const transferProof = await getVehicleAssetProof(vehicle.cnftAssetId, body.enterpriseAuthorityWallet);
    const registryTx = await buildMarkVehicleTransferredTx({
      enterpriseAuthorityWallet: body.enterpriseAuthorityWallet,
      enterpriseId: vehicle.enterpriseId,
      vehicleRecordPda: vehicle.vehicleRecordPda,
      newOwnerWallet,
    });
    return {
      status: "READY_FOR_WALLET_SIGNATURE",
      vehicleId: vehicle.id,
      assetId: vehicle.cnftAssetId,
      newOwnerId: buyer.id,
      newOwnerWallet,
      authorityWallet: body.enterpriseAuthorityWallet,
      collectionAddress: env.METAPLEX_CORE_COLLECTION_ADDRESS ?? null,
      transferProof,
      registryTransactionBase64: registryTx.transactionBase64,
      registryAccounts: registryTx.accounts,
      summary: {
        cluster: env.SOLANA_CLUSTER,
        signerRequired: "enterprise authority wallet",
        feePayer: body.enterpriseAuthorityWallet,
        action: "transfer_vehicle_cnft_then_mark_vehicle_transferred"
      }
    };
  });

  app.post("/:vehicleId/transfer/confirm", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const body = z.object({
      newOwnerId: z.string(),
      newOwnerWallet: z.string().min(32),
      enterpriseAuthorityWallet: z.string().min(32),
      cnftTransferSignature: z.string().min(32),
      registrySignature: z.string().min(32)
    }).parse(request.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: params.vehicleId }, include: { enterprise: true } });
    if (!vehicle?.cnftAssetId) throw app.httpErrors.notFound("Vehicle/cNFT not found.");
    const buyer = await prisma.user.findUnique({ where: { id: body.newOwnerId } });
    if (!buyer) throw app.httpErrors.notFound("Buyer not found.");
    if (vehicle.enterprise?.authorityWallet && vehicle.enterprise.authorityWallet !== body.enterpriseAuthorityWallet) {
      throw app.httpErrors.badRequest("Enterprise authority mismatch.");
    }
    if (env.SOLANA_DAS_RPC_URL) {
      const response = await fetch(env.SOLANA_DAS_RPC_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "noc-transfer-confirm", method: "getAsset", params: { id: vehicle.cnftAssetId } })
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw app.httpErrors.badGateway(JSON.stringify(payload.error ?? payload));
      }
      const owner = payload.result?.ownership?.owner;
      if (owner !== body.newOwnerWallet) {
        throw app.httpErrors.badRequest(`DAS owner ${owner} belum berubah ke ${body.newOwnerWallet}. Tunggu konfirmasi lalu coba confirm lagi.`);
      }
    }
    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { currentOwnerId: buyer.id, mintStatus: "transferred" }
    });
    await prisma.txReceipt.upsert({
      where: { signature: body.cnftTransferSignature },
      update: { programId: "mpl-bubblegum", confirmationStatus: "CONFIRMED", raw: { action: "client_signed_transfer_vehicle_cnft", vehicleId: vehicle.id, newOwnerWallet: body.newOwnerWallet, signerWallet: body.enterpriseAuthorityWallet, feePayer: body.enterpriseAuthorityWallet } },
      create: {
        signature: body.cnftTransferSignature,
        cluster: env.SOLANA_CLUSTER,
        programId: "mpl-bubblegum",
        confirmationStatus: "CONFIRMED",
        explorerUrl: explorerUrl(body.cnftTransferSignature),
        raw: { action: "client_signed_transfer_vehicle_cnft", vehicleId: vehicle.id, newOwnerWallet: body.newOwnerWallet, signerWallet: body.enterpriseAuthorityWallet, feePayer: body.enterpriseAuthorityWallet }
      }
    });
    await prisma.txReceipt.upsert({
      where: { signature: body.registrySignature },
      update: { programId: env.NOC_REGISTRY_PROGRAM_ID, confirmationStatus: "CONFIRMED", raw: { action: "client_signed_mark_vehicle_transferred", vehicleId: vehicle.id, newOwnerWallet: body.newOwnerWallet, signerWallet: body.enterpriseAuthorityWallet, feePayer: body.enterpriseAuthorityWallet } },
      create: {
        signature: body.registrySignature,
        cluster: env.SOLANA_CLUSTER,
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        confirmationStatus: "CONFIRMED",
        explorerUrl: explorerUrl(body.registrySignature),
        raw: { action: "client_signed_mark_vehicle_transferred", vehicleId: vehicle.id, newOwnerWallet: body.newOwnerWallet, signerWallet: body.enterpriseAuthorityWallet, feePayer: body.enterpriseAuthorityWallet }
      }
    });
    const job = await enqueueOnchainJob("mark_vehicle_transferred", {
      vehicleId: vehicle.id,
      vehicleRecordPda: vehicle.vehicleRecordPda,
      newOwnerId: buyer.id,
      newOwnerWallet: body.newOwnerWallet,
      enterpriseAuthorityWallet: body.enterpriseAuthorityWallet,
      signature: body.registrySignature,
      cnftTransferSignature: body.cnftTransferSignature,
      feePayer: body.enterpriseAuthorityWallet
    });
    return {
      vehicleId: vehicle.id,
      status: updated.mintStatus,
      newOwnerId: buyer.id,
      newOwnerWallet: body.newOwnerWallet,
      signature: body.registrySignature,
      cnftTransferSignature: body.cnftTransferSignature,
      explorerUrl: explorerUrl(body.registrySignature),
      onchainJobId: job.id
    };
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
          signature: vehicle.cnftAssetId ?? vehicle.vehicleRecordPda ?? vehicle.id,
          explorerUrl: "",
          dasMode: env.SOLANA_DAS_RPC_URL ? "configured" : "missing",
          alreadyTransferred: true
        };
      }
    }
    if (!["minted", "escrow"].includes(vehicle.mintStatus)) {
      throw app.httpErrors.badRequest("Vehicle must be minted before transfer.");
    }
    const buyer = await resolveTransferBuyer(body);
    if (!buyer?.embeddedWalletAddress && !buyer?.selfCustodyAddress) {
      throw app.httpErrors.badRequest("Buyer harus sudah register dan punya wallet NOC ID.");
    }
    const newOwnerWallet = (buyer.embeddedWalletAddress ?? buyer.selfCustodyAddress)!;
    if (!vehicle.cnftAssetId || !vehicle.treeAddress || !vehicle.vehicleRecordPda || !vehicle.enterpriseId) {
      throw app.httpErrors.badRequest("Vehicle belum punya cNFT asset/tree/PDA lengkap. Mint ulang atau sync devnet refs dulu.");
    }
    const onchain = await transferVehicleOnchain({
      vehicleId: vehicle.id,
      enterpriseId: vehicle.enterpriseId,
      enterpriseAuthorityWallet: body.enterpriseAuthorityWallet ?? vehicle.enterprise?.authorityWallet,
      cnftAssetId: vehicle.cnftAssetId,
      treeAddress: vehicle.treeAddress,
      vehicleRecordPda: vehicle.vehicleRecordPda,
      newOwnerWallet,
    });
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
      signature: onchain.registrySignature,
      cnftTransferSignature: onchain.cnftTransferSignature,
      feePayer: body.feePayer
    });
    return {
      vehicleId: vehicle.id,
      status: updated.mintStatus,
      newOwnerId: buyer.id,
      newOwnerWallet,
      signature: onchain.registrySignature,
      cnftTransferSignature: onchain.cnftTransferSignature,
      explorerUrl: onchain.explorerUrl,
      dasMode: "real_cnft_transfer",
      job: job.name,
      onchainJobId: job.id
    };
  });
};
