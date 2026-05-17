import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerDisputesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = z.object({ status: z.string().optional(), type: z.string().optional(), workshopId: z.string().optional() }).parse(request.query);
    const items = await prisma.dispute.findMany({
      where: {
        status: query.status,
        type: query.type,
        workshopId: query.workshopId
      },
      orderBy: { createdAt: "desc" }
    });
    return { items };
  });

  app.post("/", async (request) => {
    const body = z.object({
      type: z.enum(["payment", "service_quality", "part_authenticity", "warranty"]),
      bookingId: z.string().optional(),
      workshopId: z.string().optional(),
      amountIdr: z.number().int().nonnegative().default(0)
    }).passthrough().parse(request.body);
    const dispute = await prisma.dispute.create({
      data: {
        type: body.type,
        bookingId: body.bookingId,
        workshopId: body.workshopId,
        amountIdr: body.amountIdr
      }
    });
    await prisma.auditEvent.create({
      data: {
        action: "dispute.create",
        target: dispute.id,
        details: { type: dispute.type, bookingId: dispute.bookingId, workshopId: dispute.workshopId, amountIdr: dispute.amountIdr }
      }
    });
    return { disputeId: dispute.id, status: dispute.status, dispute };
  });

  app.post("/:disputeId/resolve", async (request) => {
    const params = z.object({ disputeId: z.string() }).parse(request.params);
    const body = z.object({ resolution: z.string().min(1) }).parse(request.body);
    const dispute = await prisma.dispute.update({
      where: { id: params.disputeId },
      data: { status: "resolved", resolution: body.resolution }
    });
    const caseHash = sha256Hex({ type: "dispute", disputeId: dispute.id, resolution: dispute.resolution, amountIdr: dispute.amountIdr });
    const job = await enqueueOnchainJob("anchor_case_event", { caseType: "dispute", caseId: dispute.id, caseHash, status: "resolved" });
    await prisma.auditEvent.create({
      data: {
        action: "dispute.resolve",
        target: dispute.id,
        details: { resolution: body.resolution, onchainJobId: job.id }
      }
    });
    return { disputeId: params.disputeId, status: dispute.status, resolution: body.resolution, job: job.name, onchainJobId: job.id, caseHash };
  });
};
