import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

const credentialSchema = z.object({
  workshopId: z.string(),
  credential: z.enum(["verified_signer", "oem_certified", "manufacturer_audit_partner", "recall_executor"]),
  issuedBy: z.string(),
  enterpriseId: z.string().optional(),
  validUntil: z.string().optional()
});

export const registerCredentialsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/workshops/:workshopId", async (request) => {
    const params = z.object({ workshopId: z.string() }).parse(request.params);
    const items = await prisma.workshopCredential.findMany({
      where: { workshopId: params.workshopId },
      orderBy: { createdAt: "desc" }
    });
    return { workshopId: params.workshopId, items };
  });

  app.post("/", async (request) => {
    const body = credentialSchema.parse(request.body);
    const credential = await prisma.workshopCredential.create({
      data: {
        workshopId: body.workshopId,
        credential: body.credential,
        issuedBy: body.issuedBy,
        enterpriseId: body.enterpriseId,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined
      }
    });
    const job = await enqueueOnchainJob("grant_credential", { credentialId: credential.id, workshopId: body.workshopId, credential: body.credential });
    return { credentialId: credential.id, status: "grant_queued", onchainJobId: job.id, ...body };
  });

  app.post("/:credentialId/revoke", async (request) => {
    const params = z.object({ credentialId: z.string() }).parse(request.params);
    const body = z.object({ reason: z.string().min(1) }).parse(request.body);
    const credential = await prisma.workshopCredential.update({
      where: { id: params.credentialId },
      data: { revokedAt: new Date(), reason: body.reason }
    });
    const job = await enqueueOnchainJob("revoke_credential", { credentialId: credential.id, reason: body.reason });
    return { credentialId: params.credentialId, status: "revoke_queued", reason: body.reason, onchainJobId: job.id };
  });
};
