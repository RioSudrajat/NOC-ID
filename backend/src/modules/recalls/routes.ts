import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerRecallsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = z.object({ enterpriseId: z.string().optional(), severity: z.string().optional() }).parse(request.query);
    const items = await prisma.recall.findMany({
      where: {
        enterpriseId: query.enterpriseId,
        severity: query.severity
      },
      orderBy: { createdAt: "desc" }
    });
    return { items };
  });

  app.post("/", async (request) => {
    const body = z.object({
      enterpriseId: z.string(),
      title: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      affectedVinHashes: z.array(z.string()).default([])
    }).parse(request.body);
    const recall = await prisma.recall.create({
      data: {
        enterpriseId: body.enterpriseId,
        title: body.title,
        severity: body.severity,
        affectedVinHashes: body.affectedVinHashes
      }
    });
    const caseHash = sha256Hex({ type: "recall", recallId: recall.id, ...body });
    const job = await enqueueOnchainJob("anchor_case_event", { caseType: "recall", caseId: recall.id, caseHash, severity: recall.severity });
    await prisma.notification.create({
      data: {
        targetRole: "owner",
        type: "recall",
        title: recall.title,
        message: `${recall.severity.toUpperCase()} recall issued for ${recall.affectedVinHashes.length} VIN hash(es).`
      }
    });
    await prisma.auditEvent.create({
      data: {
        action: "recall.issue",
        target: recall.id,
        details: { enterpriseId: recall.enterpriseId, severity: recall.severity, affectedCount: recall.affectedVinHashes.length, onchainJobId: job.id }
      }
    });
    return { recallId: recall.id, status: "issued", job: job.name, onchainJobId: job.id, caseHash, recall };
  });
};
