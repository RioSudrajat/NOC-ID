import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerWarrantiesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = z.object({ status: z.string().optional(), vin: z.string().optional(), bookingId: z.string().optional() }).parse(request.query);
    const items = await prisma.warrantyClaim.findMany({
      where: {
        status: query.status,
        vin: query.vin,
        bookingId: query.bookingId
      },
      orderBy: { createdAt: "desc" }
    });
    return { items };
  });

  app.post("/", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      vin: z.string(),
      description: z.string(),
      amountIdr: z.number().int().positive(),
      evidenceHash: z.string().min(32).optional()
    }).passthrough().parse(request.body);
    const claim = await prisma.warrantyClaim.create({
      data: {
        bookingId: body.bookingId,
        vin: body.vin,
        description: body.description,
        amountIdr: body.amountIdr,
        evidenceHash: body.evidenceHash ?? sha256Hex({ type: "warranty_claim", ...body })
      }
    });
    await prisma.auditEvent.create({
      data: {
        action: "warranty.create",
        target: claim.id,
        details: { vin: claim.vin, bookingId: claim.bookingId, amountIdr: claim.amountIdr }
      }
    });
    return { warrantyClaimId: claim.id, status: claim.status, claim };
  });

  app.patch("/:claimId/status", async (request) => {
    const params = z.object({ claimId: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(["Pending", "Approved", "Rejected", "ResubmissionRequested"]), notes: z.string().optional() }).parse(request.body);
    const claim = await prisma.warrantyClaim.update({
      where: { id: params.claimId },
      data: { status: body.status }
    });
    const caseHash = sha256Hex({ type: "warranty", claimId: claim.id, status: body.status, notes: body.notes, evidenceHash: claim.evidenceHash });
    const job = await enqueueOnchainJob("anchor_case_event", { caseType: "warranty", caseId: claim.id, caseHash, status: body.status });
    await prisma.auditEvent.create({
      data: {
        action: "warranty.status.update",
        target: claim.id,
        details: { status: body.status, notes: body.notes, onchainJobId: job.id }
      }
    });
    return { claimId: params.claimId, status: claim.status, notes: body.notes, job: job.name, onchainJobId: job.id, caseHash };
  });
};
