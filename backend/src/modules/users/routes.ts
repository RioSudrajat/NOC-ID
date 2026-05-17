import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerUsersRoutes: FastifyPluginAsync = async (app) => {
  const safeUserSelect = {
    id: true,
    username: true,
    displayName: true,
    email: true,
    phone: true,
    role: true,
    walletState: true,
    embeddedWalletAddress: true,
    selfCustodyAddress: true,
    workshopId: true,
    enterpriseId: true,
    createdAt: true,
    updatedAt: true
  } as const;

  app.get("/me", async (request) => {
    const query = z.object({ userId: z.string().optional(), wallet: z.string().optional() }).parse(request.query);
    const user = await prisma.user.findFirst({
      where: {
        id: query.userId,
        OR: query.wallet ? [{ embeddedWalletAddress: query.wallet }, { selfCustodyAddress: query.wallet }] : undefined
      },
      select: {
        ...safeUserSelect,
        wallets: true,
        ownedVehicles: true
      }
    });
    return { user };
  });

  app.get("/registered", async (request) => {
    const query = z.object({ q: z.string().optional() }).parse(request.query);
    const items = await prisma.user.findMany({
      where: query.q ? {
        OR: [
          { displayName: { contains: query.q, mode: "insensitive" } },
          { email: { contains: query.q, mode: "insensitive" } },
          { phone: { contains: query.q, mode: "insensitive" } },
          { selfCustodyAddress: { contains: query.q, mode: "insensitive" } },
          { embeddedWalletAddress: { contains: query.q, mode: "insensitive" } }
        ]
      } : undefined,
      take: 20,
      orderBy: { createdAt: "desc" },
      select: safeUserSelect
    });
    return { items, query: query.q ?? "" };
  });

  app.post("/:userId/vehicles/:vehicleId/claim", async (request) => {
    const params = z.object({ userId: z.string(), vehicleId: z.string() }).parse(request.params);
    const vehicle = await prisma.vehicle.update({
      where: { id: params.vehicleId },
      data: { currentOwnerId: params.userId, mintStatus: "transferred" }
    });
    const job = await enqueueOnchainJob("claim_vehicle", { userId: params.userId, vehicleId: params.vehicleId });
    return { ...params, status: "claim_queued", vehicle, onchainJobId: job.id };
  });
};
