import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { ensureEnterpriseRecord, mintVehicleCnft, registerVehicleRecordOnchain } from "../../lib/onchainAuthority.js";
import { prisma } from "../../lib/prisma.js";

export const registerMintsRoutes: FastifyPluginAsync = async (app) => {
  const vehicleInputSchema = z.object({
    vin: z.string(),
    make: z.string().default("NOC"),
    model: z.string().optional(),
    modelKey: z.string().optional(),
    year: z.number().int(),
    color: z.string().default("Unknown"),
    category: z.enum(["car", "motorcycle_matic", "motorcycle_big"]).default("car"),
    transmissionType: z.string().default("automatic"),
    fuelType: z.string().default("gasoline"),
    licensePlate: z.string().default("TBD")
  }).passthrough();

  app.post("/vehicle-batch/draft", async (request) => {
    const body = z.object({
      enterpriseId: z.string().optional(),
      minterWallet: z.string().min(32),
      vehicles: z.array(vehicleInputSchema).min(1)
    }).parse(request.body);
    const enterprise = body.enterpriseId
      ? await prisma.enterprise.findUnique({ where: { id: body.enterpriseId } })
      : await prisma.enterprise.findFirst({ orderBy: { createdAt: "asc" } });
    if (!enterprise) throw app.httpErrors.badRequest("Enterprise belum tersedia. Seed/register enterprise dulu.");
    if (enterprise.authorityWallet && enterprise.authorityWallet !== body.minterWallet) {
      throw app.httpErrors.badRequest(`Wallet Phantom ${body.minterWallet} bukan enterprise authority ${enterprise.authorityWallet}. Login enterprise dengan wallet authority yang benar.`);
    }
    const vehicles = await prisma.$transaction(body.vehicles.map((vehicle) => prisma.vehicle.upsert({
      where: { vin: vehicle.vin },
      update: {
        enterpriseId: enterprise.id,
        mintStatus: "pending",
        metadataHash: sha256Hex(vehicle),
        metadataUri: `${env.IRYS_GATEWAY_URL}/noc-id-devnet-${encodeURIComponent(vehicle.vin)}.json`
      },
      create: {
        enterpriseId: enterprise.id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model ?? vehicle.modelKey ?? "Unknown Model",
        year: vehicle.year,
        color: vehicle.color,
        category: vehicle.category,
        transmissionType: vehicle.transmissionType,
        fuelType: vehicle.fuelType,
        licensePlate: vehicle.licensePlate,
        mintStatus: "pending",
        metadataUri: `${env.IRYS_GATEWAY_URL}/noc-id-devnet-${encodeURIComponent(vehicle.vin)}.json`,
        metadataHash: sha256Hex(vehicle)
      }
    })));
    return {
      status: "READY_FOR_PHANTOM_MINT",
      enterpriseId: enterprise.id,
      treeAddress: env.BUBBLEGUM_TREE_ADDRESS ?? null,
      collectionAddress: env.METAPLEX_CORE_COLLECTION_ADDRESS ?? null,
      vehicles: vehicles.map((vehicle) => ({
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        name: `NOC ${vehicle.make} ${vehicle.model}`.replace(/\s+/g, " ").trim().slice(0, 32).trimEnd(),
        uri: vehicle.metadataUri,
        metadataHash: vehicle.metadataHash
      }))
    };
  });

  app.post("/vehicle-batch/confirm", async (request) => {
    const body = z.object({
      enterpriseId: z.string(),
      minterWallet: z.string().min(32),
      minted: z.array(z.object({
        vehicleId: z.string(),
        cnftAssetId: z.string().min(32),
        treeAddress: z.string().min(32),
        leafIndex: z.number().int().nonnegative(),
        mintSignature: z.string().min(32),
        feeLamports: z.number().int().nonnegative().nullable().optional()
      })).min(1)
    }).parse(request.body);
    const enterprise = await prisma.enterprise.findUnique({ where: { id: body.enterpriseId } });
    if (!enterprise) throw app.httpErrors.badRequest("Enterprise tidak ditemukan.");
    if (enterprise.authorityWallet && enterprise.authorityWallet !== body.minterWallet) {
      throw app.httpErrors.badRequest(`Mint signer ${body.minterWallet} bukan enterprise authority ${enterprise.authorityWallet}.`);
    }

    const confirmed = [];
    for (const item of body.minted) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: item.vehicleId }, include: { enterprise: true } });
      if (!vehicle) throw app.httpErrors.notFound(`Vehicle ${item.vehicleId} tidak ditemukan.`);
      const updatedRefs = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          mintStatus: "minted",
          cnftAssetId: item.cnftAssetId,
          treeAddress: item.treeAddress,
          leafIndex: item.leafIndex,
        }
      });
      const vehicleRecord = await registerVehicleRecordOnchain({
        enterpriseId: body.enterpriseId,
        enterpriseAuthorityWallet: enterprise.authorityWallet,
        enterpriseMetadataHash: enterprise.metadataHash,
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        metadataHash: vehicle.metadataHash,
        cnftAssetId: item.cnftAssetId,
        treeAddress: item.treeAddress,
        leafIndex: item.leafIndex,
      });
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { vehicleRecordPda: vehicleRecord.recordPda }
      });
      await prisma.txReceipt.upsert({
        where: { signature: item.mintSignature },
        update: {
          programId: "mpl-bubblegum",
          confirmationStatus: "CONFIRMED",
          raw: { action: "client_signed_mint_vehicle_cnft", vehicleId: vehicle.id, cnftAssetId: item.cnftAssetId, feeLamports: item.feeLamports, feePayer: body.minterWallet, signerWallet: body.minterWallet }
        },
        create: {
          signature: item.mintSignature,
          cluster: env.SOLANA_CLUSTER,
          programId: "mpl-bubblegum",
          confirmationStatus: "CONFIRMED",
          explorerUrl: `https://explorer.solana.com/tx/${item.mintSignature}?cluster=${env.SOLANA_CLUSTER}`,
          raw: { action: "client_signed_mint_vehicle_cnft", vehicleId: vehicle.id, cnftAssetId: item.cnftAssetId, feeLamports: item.feeLamports, feePayer: body.minterWallet, signerWallet: body.minterWallet }
        }
      });
      confirmed.push({
        vehicleId: updatedRefs.id,
        vin: updatedRefs.vin,
        mintSignature: item.mintSignature,
        registerSignature: vehicleRecord.signature,
        cnftAssetId: item.cnftAssetId,
        vehicleRecordPda: vehicleRecord.recordPda,
      });
    }

    return {
      status: "MINTED_BY_PHANTOM",
      count: confirmed.length,
      vehicleIds: confirmed.map((item) => item.vehicleId),
      signature: confirmed[confirmed.length - 1]?.mintSignature ?? "",
      confirmed
    };
  });

  app.post("/vehicle-batch", async (request) => {
    const body = z.object({
      enterpriseId: z.string().optional(),
      feeSignature: z.string().min(32).optional(),
      feePayer: z.string().min(32).optional(),
      vehicles: z.array(vehicleInputSchema).min(1)
    }).parse(request.body);
    const enterprise = body.enterpriseId
      ? await prisma.enterprise.findUnique({ where: { id: body.enterpriseId } })
      : await prisma.enterprise.findFirst({ orderBy: { createdAt: "asc" } });
    if (!enterprise) throw app.httpErrors.badRequest("Enterprise belum tersedia. Seed/register enterprise dulu.");
    const vehicles = await prisma.$transaction(body.vehicles.map((vehicle) => prisma.vehicle.upsert({
      where: { vin: vehicle.vin },
      update: {
        enterpriseId: enterprise.id,
        mintStatus: "pending",
        metadataHash: sha256Hex(vehicle),
        metadataUri: `${env.IRYS_GATEWAY_URL}/noc-id-devnet-${encodeURIComponent(vehicle.vin)}.json`
      },
      create: {
        enterpriseId: enterprise.id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model ?? vehicle.modelKey ?? "Unknown Model",
        year: vehicle.year,
        color: vehicle.color,
        category: vehicle.category,
        transmissionType: vehicle.transmissionType,
        fuelType: vehicle.fuelType,
        licensePlate: vehicle.licensePlate,
        mintStatus: "pending",
        metadataUri: `${env.IRYS_GATEWAY_URL}/noc-id-devnet-${encodeURIComponent(vehicle.vin)}.json`,
        metadataHash: sha256Hex(vehicle)
      }
    })));
    const enterpriseRecord = await ensureEnterpriseRecord({
      enterpriseId: enterprise.id,
      authorityWallet: enterprise.authorityWallet,
      metadataHash: enterprise.metadataHash,
    });
    await prisma.enterprise.update({
      where: { id: enterprise.id },
      data: {
        recordPda: enterpriseRecord.recordPda,
        authorityWallet: enterpriseRecord.authorityWallet,
      }
    });

    const minted = [];
    for (const vehicle of vehicles) {
      if (vehicle.vehicleRecordPda && vehicle.cnftAssetId && vehicle.treeAddress && vehicle.leafIndex !== null) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { mintStatus: "minted" }
        });
        minted.push({
          vehicleId: vehicle.id,
          vin: vehicle.vin,
          cnftAssetId: vehicle.cnftAssetId,
          leafIndex: vehicle.leafIndex,
          mintSignature: null,
          registerSignature: null,
          vehicleRecordPda: vehicle.vehicleRecordPda,
          skipped: "already_minted_onchain",
        });
        continue;
      }
      if (vehicle.vehicleRecordPda || vehicle.cnftAssetId || vehicle.treeAddress || vehicle.leafIndex !== null) {
        throw app.httpErrors.conflict(`VIN ${vehicle.vin} punya devnet refs tidak lengkap. Sync vehicle refs sebelum mint ulang.`);
      }
      const cnft = await mintVehicleCnft({
        leafOwner: enterpriseRecord.authorityWallet,
        name: `NOC ID Vehicle Passport - ${vehicle.make} ${vehicle.model}`,
        uri: vehicle.metadataUri ?? `${env.IRYS_GATEWAY_URL}/noc-id-devnet-${encodeURIComponent(vehicle.vin)}.json`,
      });
      const vehicleRecord = await registerVehicleRecordOnchain({
        enterpriseId: enterprise.id,
        enterpriseAuthorityWallet: enterpriseRecord.authorityWallet,
        enterpriseMetadataHash: enterprise.metadataHash,
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        metadataHash: vehicle.metadataHash,
        cnftAssetId: cnft.assetId,
        treeAddress: cnft.treeAddress,
        leafIndex: cnft.leafIndex,
      });
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          mintStatus: "minted",
          treeAddress: cnft.treeAddress,
          leafIndex: cnft.leafIndex,
          cnftAssetId: cnft.assetId,
          vehicleRecordPda: vehicleRecord.recordPda,
        }
      });
      minted.push({
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        cnftAssetId: cnft.assetId,
        leafIndex: cnft.leafIndex,
        mintSignature: cnft.signature,
        registerSignature: vehicleRecord.signature,
        vehicleRecordPda: vehicleRecord.recordPda,
      });
    }
    const vehicleIds = vehicles.map((vehicle) => vehicle.id);
    return {
      mintBatchId: minted[0]?.mintSignature ?? "minted",
      status: "MINTED_ONCHAIN",
      count: vehicles.length,
      vehicleIds,
      enterpriseId: enterprise.id,
      signature: minted[minted.length - 1]?.registerSignature ?? minted[minted.length - 1]?.mintSignature ?? "",
      minted,
      treeAddress: env.BUBBLEGUM_TREE_ADDRESS ?? null,
      collectionAddress: env.METAPLEX_CORE_COLLECTION_ADDRESS ?? null
    };
  });

  app.post("/part-catalog", async (request) => {
    const body = z.object({
      enterpriseId: z.string(),
      parts: z.array(z.object({
        name: z.string(),
        partNumber: z.string(),
        category: z.string(),
        manufacturer: z.string(),
        compatibleModels: z.array(z.string()).default([]),
        priceIdr: z.number().int().nonnegative()
      })).min(1)
    }).parse(request.body);
    const parts = await prisma.$transaction(body.parts.map((part) => prisma.partCatalogItem.create({
      data: {
        enterpriseId: body.enterpriseId,
        name: part.name,
        partNumber: part.partNumber,
        category: part.category,
        manufacturer: part.manufacturer,
        compatibleModels: part.compatibleModels,
        priceIdr: part.priceIdr,
        metadataHash: sha256Hex(part)
      }
    })));
    const job = await enqueueOnchainJob("mint_part_catalog_cnft", { enterpriseId: body.enterpriseId, partIds: parts.map((part) => part.id) });
    return { mintBatchId: job.id, status: "QUEUED", count: parts.length, partIds: parts.map((part) => part.id) };
  });

  app.post("/part-catalog/draft", async (request) => {
    const body = z.object({
      enterpriseId: z.string(),
      minterWallet: z.string().min(32),
      parts: z.array(z.object({
        name: z.string(),
        partNumber: z.string(),
        category: z.string(),
        manufacturer: z.string(),
        compatibleModels: z.array(z.string()).default([]),
        priceIdr: z.number().int().nonnegative()
      })).min(1)
    }).parse(request.body);
    const enterprise = await prisma.enterprise.findUnique({ where: { id: body.enterpriseId } });
    if (!enterprise) throw app.httpErrors.badRequest("Enterprise tidak ditemukan.");
    if (enterprise.authorityWallet && enterprise.authorityWallet !== body.minterWallet) {
      throw app.httpErrors.badRequest(`Wallet Phantom ${body.minterWallet} bukan enterprise authority ${enterprise.authorityWallet}.`);
    }
    const parts = [];
    for (const part of body.parts) {
      const metadataHash = sha256Hex(part);
      const item = await prisma.partCatalogItem.create({
        data: {
          enterpriseId: body.enterpriseId,
          name: part.name,
          partNumber: part.partNumber,
          category: part.category,
          manufacturer: part.manufacturer,
          compatibleModels: part.compatibleModels,
          priceIdr: part.priceIdr,
          metadataHash,
          metadataUri: `${env.IRYS_GATEWAY_URL}/noc-id-part-${encodeURIComponent(part.partNumber)}.json`
        }
      });
      parts.push(item);
    }
    return {
      status: "READY_FOR_PHANTOM_MINT",
      enterpriseId: body.enterpriseId,
      treeAddress: env.BUBBLEGUM_TREE_ADDRESS ?? null,
      collectionAddress: env.METAPLEX_CORE_COLLECTION_ADDRESS ?? null,
      parts: parts.map((part) => ({
        partId: part.id,
        name: `NOC Part ${part.partNumber}`.replace(/\s+/g, " ").trim().slice(0, 32).trimEnd(),
        uri: part.metadataUri,
        metadataHash: part.metadataHash
      }))
    };
  });

  app.post("/part-catalog/confirm", async (request) => {
    const body = z.object({
      enterpriseId: z.string(),
      minterWallet: z.string().min(32),
      minted: z.array(z.object({
        partId: z.string(),
        cnftAssetId: z.string().min(32),
        treeAddress: z.string().min(32),
        leafIndex: z.number().int().nonnegative(),
        mintSignature: z.string().min(32),
        feeLamports: z.number().int().nonnegative().nullable().optional()
      })).min(1)
    }).parse(request.body);
    const enterprise = await prisma.enterprise.findUnique({ where: { id: body.enterpriseId } });
    if (!enterprise) throw app.httpErrors.badRequest("Enterprise tidak ditemukan.");
    if (enterprise.authorityWallet && enterprise.authorityWallet !== body.minterWallet) {
      throw app.httpErrors.badRequest(`Mint signer ${body.minterWallet} bukan enterprise authority ${enterprise.authorityWallet}.`);
    }
    const confirmed = [];
    for (const item of body.minted) {
      const part = await prisma.partCatalogItem.update({
        where: { id: item.partId },
        data: {
          cnftAssetId: item.cnftAssetId,
          treeAddress: item.treeAddress,
          leafIndex: item.leafIndex,
        }
      });
      await prisma.txReceipt.upsert({
        where: { signature: item.mintSignature },
        update: {
          programId: "mpl-bubblegum",
          confirmationStatus: "CONFIRMED",
          raw: { action: "client_signed_mint_part_catalog_cnft", partId: item.partId, cnftAssetId: item.cnftAssetId, feeLamports: item.feeLamports, feePayer: body.minterWallet, signerWallet: body.minterWallet }
        },
        create: {
          signature: item.mintSignature,
          cluster: env.SOLANA_CLUSTER,
          programId: "mpl-bubblegum",
          confirmationStatus: "CONFIRMED",
          explorerUrl: `https://explorer.solana.com/tx/${item.mintSignature}?cluster=${env.SOLANA_CLUSTER}`,
          raw: { action: "client_signed_mint_part_catalog_cnft", partId: item.partId, cnftAssetId: item.cnftAssetId, feeLamports: item.feeLamports, feePayer: body.minterWallet, signerWallet: body.minterWallet }
        }
      });
      confirmed.push(part);
    }
    return {
      status: "PART_CATALOG_MINTED_BY_PHANTOM",
      count: confirmed.length,
      partIds: confirmed.map((part) => part.id),
      signature: body.minted[body.minted.length - 1]?.mintSignature ?? "",
      confirmed
    };
  });
};
