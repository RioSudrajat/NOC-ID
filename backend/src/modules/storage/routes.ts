import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";

export const registerStorageRoutes: FastifyPluginAsync = async (app) => {
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
