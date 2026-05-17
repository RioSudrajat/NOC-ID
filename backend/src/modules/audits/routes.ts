import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerAuditsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/vehicle-requests", async (request) => {
    const query = z.object({ userId: z.string().optional(), workshopId: z.string().optional(), status: z.string().optional() }).parse(request.query);
    const items = await prisma.vehicleMintRequest.findMany({
      where: {
        userId: query.userId,
        workshopId: query.workshopId,
        status: query.status
      },
      orderBy: { createdAt: "desc" }
    });
    return { items };
  });

  app.post("/vehicle-requests", async (request) => {
    const body = z.object({ userId: z.string(), workshopId: z.string(), vin: z.string(), make: z.string(), model: z.string() }).passthrough().parse(request.body);
    const requestRecord = await prisma.vehicleMintRequest.create({
      data: {
        userId: body.userId,
        workshopId: body.workshopId,
        vin: body.vin,
        make: body.make,
        model: body.model,
        year: typeof body.year === "number" ? body.year : new Date().getFullYear(),
        licensePlate: typeof body.licensePlate === "string" ? body.licensePlate : undefined,
        status: "requested"
      }
    });
    return { requestId: requestRecord.id, status: requestRecord.status, ...body };
  });

  app.get("/reports", async (request) => {
    const query = z.object({ workshopId: z.string().optional(), status: z.string().optional(), requestId: z.string().optional() }).parse(request.query);
    const items = await prisma.vehicleAudit.findMany({
      where: {
        workshopId: query.workshopId,
        status: query.status,
        requestId: query.requestId
      },
      orderBy: { createdAt: "desc" }
    });
    return { items };
  });

  app.post("/reports", async (request) => {
    const body = z.object({ requestId: z.string().optional(), workshopId: z.string(), vin: z.string(), overallConditionScore: z.number().min(0).max(100) }).passthrough().parse(request.body);
    const audit = await prisma.vehicleAudit.create({
      data: {
        requestId: body.requestId,
        workshopId: body.workshopId,
        submittedForUserId: typeof body.submittedForUserId === "string" ? body.submittedForUserId : "unknown",
        vin: body.vin,
        make: typeof body.make === "string" ? body.make : "Unknown",
        model: typeof body.model === "string" ? body.model : "Unknown",
        year: typeof body.year === "number" ? body.year : new Date().getFullYear(),
        licensePlate: typeof body.licensePlate === "string" ? body.licensePlate : "TBD",
        odometerKm: typeof body.odometerKm === "number" ? body.odometerKm : 0,
        componentHealth: typeof body.componentHealth === "object" && body.componentHealth ? body.componentHealth : {},
        overallConditionScore: body.overallConditionScore,
        evidenceHash: typeof body.evidenceHash === "string" ? body.evidenceHash : sha256Hex(body),
        status: "submitted"
      }
    });
    if (body.requestId) {
      await prisma.vehicleMintRequest.update({ where: { id: body.requestId }, data: { auditId: audit.id, status: "audit_submitted" } });
    }
    return { auditId: audit.id, status: audit.status, ...body };
  });

  app.post("/:auditId/approve", async (request) => {
    const params = z.object({ auditId: z.string() }).parse(request.params);
    const audit = await prisma.vehicleAudit.update({ where: { id: params.auditId }, data: { status: "approved" } });
    const job = await enqueueOnchainJob("mint_vehicle_cnft", { auditId: audit.id, vin: audit.vin, source: "second_vehicle_audit" });
    return { auditId: params.auditId, status: "mint_queued", job: "mint_second_vehicle_to_escrow", onchainJobId: job.id };
  });
};
