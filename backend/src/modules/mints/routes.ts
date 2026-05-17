import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { createDevnetUiSignature } from "../../lib/devnetSignature.js";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerMintsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/vehicle-batch", async (request) => {
    const body = z.object({
      enterpriseId: z.string().optional(),
      feeSignature: z.string().min(32).optional(),
      feePayer: z.string().min(32).optional(),
      vehicles: z.array(z.object({
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
      }).passthrough()).min(1)
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
    const vehicleIds = vehicles.map((vehicle) => vehicle.id);
    const signature = body.feeSignature ?? createDevnetUiSignature("mint_vehicle_cnft", { enterpriseId: enterprise.id, vehicleIds });
    await Promise.all(vehicles.map((vehicle, index) => prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        mintStatus: "minted",
        treeAddress: env.BUBBLEGUM_TREE_ADDRESS ?? "devnet-tree-pending",
        leafIndex: vehicle.leafIndex ?? index,
        cnftAssetId: vehicle.cnftAssetId ?? `devnet-cnft-${vehicle.id}`,
        vehicleRecordPda: vehicle.vehicleRecordPda ?? `devnet-vehicle-record-${vehicle.id}`
      }
    })));
    const job = await enqueueOnchainJob("mint_vehicle_cnft", {
      enterpriseId: enterprise.id,
      vehicleIds,
      signature,
      feePayer: body.feePayer
    });
    return {
      mintBatchId: job.id,
      status: "QUEUED",
      count: vehicles.length,
      vehicleIds,
      enterpriseId: enterprise.id,
      signature,
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
};
