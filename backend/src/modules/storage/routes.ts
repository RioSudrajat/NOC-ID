import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";
import { prisma } from "../../lib/prisma.js";

export const registerStorageRoutes: FastifyPluginAsync = async (app) => {
  app.get("/metadata/:hash.json", async (request, reply) => {
    const params = z.object({ hash: z.string().length(64) }).parse(request.params);
    const pending = await prisma.auditEvent.findFirst({
      where: {
        action: "pending_vehicle_passport_metadata",
        target: { contains: params.hash },
      },
      orderBy: { createdAt: "desc" }
    });
    const pendingDetails = pending?.details as Record<string, unknown> | undefined;
    const pendingMetadata = pendingDetails?.metadata;
    if (pendingMetadata && typeof pendingMetadata === "object") {
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
      return pendingMetadata;
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { metadataHash: params.hash } });
    if (!vehicle) throw app.httpErrors.notFound("Metadata not found.");
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return {
      name: `NOC ${vehicle.make} ${vehicle.model}`.replace(/\s+/g, " ").trim().slice(0, 32).trimEnd(),
      description: `NOC ID vehicle passport for ${vehicle.vin}.`,
      image: "https://gateway.irys.xyz/noc-id-placeholder-vehicle.png",
      attributes: [
        { trait_type: "VIN", value: vehicle.vin },
        { trait_type: "Make", value: vehicle.make },
        { trait_type: "Model", value: vehicle.model },
        { trait_type: "Year", value: vehicle.year },
        { trait_type: "Color", value: vehicle.color },
        { trait_type: "Health Score", value: vehicle.healthScore },
        { trait_type: "Odometer KM", value: vehicle.currentMileageKm },
      ],
      noc: {
        vehicle_id: vehicle.id,
        asset_id: vehicle.cnftAssetId,
        vehicle_record_pda: vehicle.vehicleRecordPda,
      }
    };
  });

  app.post("/metadata/upload", async (request) => {
    const body = z.object({ kind: z.enum(["vehicle", "part", "service-log", "case"]), metadata: z.record(z.unknown()) }).parse(request.body);
    const hashHex = sha256Hex(body.metadata);
    return {
      kind: body.kind,
      metadataHash: hashHex,
      uri: `irys://pending/${hashHex}`,
      public: true
    };
  });

  app.post("/evidence/register", async (request) => {
    const body = z.object({
      kind: z.enum(["ktp", "bpkb", "stnk", "invoice", "diagnostic", "audit-photo", "other"]),
      filename: z.string().min(1),
      contentType: z.string().min(1),
      byteLength: z.number().int().nonnegative(),
      sha256: z.string().length(64).optional()
    }).parse(request.body);
    const objectKey = `private-evidence/${body.kind}/${crypto.randomUUID()}-${body.filename}`;
    return {
      objectKey,
      hash: body.sha256 ?? sha256Hex(body),
      storage: "s3-compatible",
      public: false,
      policy: "Only hash may be referenced in public metadata or on-chain accounts."
    };
  });
};
