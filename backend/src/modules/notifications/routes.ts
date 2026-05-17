import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const registerNotificationsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = z.object({ userId: z.string().optional(), targetRole: z.string().optional(), unreadOnly: z.coerce.boolean().optional() }).parse(request.query);
    const items = await prisma.notification.findMany({
      where: {
        userId: query.userId,
        targetRole: query.targetRole,
        read: query.unreadOnly ? false : undefined
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return { items };
  });

  app.post("/", async (request) => {
    const body = z.object({
      targetRole: z.string(),
      userId: z.string().optional(),
      type: z.string(),
      title: z.string(),
      message: z.string()
    }).parse(request.body);
    const notification = await prisma.notification.create({ data: body });
    return { notification };
  });

  app.patch("/:notificationId/read", async (request) => {
    const params = z.object({ notificationId: z.string() }).parse(request.params);
    const notification = await prisma.notification.update({ where: { id: params.notificationId }, data: { read: true } });
    return { ok: true, notificationId: notification.id };
  });
};
