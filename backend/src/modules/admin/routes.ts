import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerAdminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/config", async () => ({ platformFeePercent: 2.5, gasSubsidyPercent: 0, maxBatchMintSize: 10000 }));
  app.patch("/config", async (request) => {
    const body = z.object({
      platformFeePercent: z.number().min(0).max(100).optional(),
      gasSubsidyPercent: z.number().min(0).max(100).optional(),
      maxBatchMintSize: z.number().int().positive().optional(),
      paused: z.boolean().optional()
    }).parse(request.body);
    const job = await enqueueOnchainJob("set_platform_config", {
      platformFeeBps: body.platformFeePercent == null ? undefined : Math.round(body.platformFeePercent * 100),
      gasSubsidyBps: body.gasSubsidyPercent == null ? undefined : Math.round(body.gasSubsidyPercent * 100),
      maxBatchMintSize: body.maxBatchMintSize,
      paused: body.paused
    });
    await prisma.auditEvent.create({
      data: {
        action: "admin.config.update",
        target: "platform_config",
        details: { ...body, onchainJobId: job.id }
      }
    });
    return { updated: body, job: job.name, onchainJobId: job.id };
  });

  app.post("/wallets", async (request) => {
    const body = z.object({ wallet: z.string().min(32), role: z.enum(["user", "workshop_owner", "enterprise_admin", "admin"]), entityName: z.string().optional() }).parse(request.body);
    const wallet = await prisma.wallet.upsert({
      where: { address: body.wallet },
      update: { role: body.role, entityName: body.entityName, status: "active" },
      create: { address: body.wallet, role: body.role, entityName: body.entityName, status: "active" }
    });
    await prisma.auditEvent.create({
      data: {
        action: "admin.wallet.upsert",
        target: wallet.address,
        details: { role: wallet.role, entityName: wallet.entityName }
      }
    });
    return { status: wallet.status, wallet: wallet.address, role: wallet.role, entityName: wallet.entityName };
  });

  app.post("/workshops/:workshopId/approve", async (request) => {
    const params = z.object({ workshopId: z.string() }).parse(request.params);
    const workshop = await prisma.workshop.update({ where: { id: params.workshopId }, data: { status: "approved" } });
    await prisma.workshopRegistration.updateMany({ where: { workshopId: workshop.id }, data: { status: "approved" } });
    const job = await enqueueOnchainJob("register_workshop_pda", { workshopId: workshop.id, authorityWallet: workshop.authorityWallet });
    return { workshopId: params.workshopId, status: workshop.status, job: job.name, onchainJobId: job.id };
  });
};
