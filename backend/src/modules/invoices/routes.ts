import type { FastifyPluginAsync } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const registerInvoicesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:invoiceId", async (request) => {
    const params = z.object({ invoiceId: z.string() }).parse(request.params);
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: { booking: { include: { vehicle: true, workshop: true } }, payments: true }
    });
    if (!invoice) {
      throw app.httpErrors.notFound("Invoice not found.");
    }
    return invoice;
  });

  app.post("/", async (request) => {
    const body = z.object({
      bookingId: z.string(),
      serviceType: z.string(),
      serviceCost: z.number().int().nonnegative(),
      gasFee: z.number().int().nonnegative().default(0),
      totalIdr: z.number().int().nonnegative(),
      parts: z.array(z.record(z.unknown()))
    }).passthrough().parse(request.body);
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: body.bookingId,
        serviceType: body.serviceType,
        serviceCost: body.serviceCost,
        gasFee: body.gasFee,
        totalIdr: body.totalIdr,
        mechanicNotes: typeof body.mechanicNotes === "string" ? body.mechanicNotes : undefined,
        parts: body.parts as Prisma.InputJsonValue
      },
      include: { booking: true, payments: true }
    });
    await prisma.booking.update({ where: { id: body.bookingId }, data: { status: "INVOICE_SENT" } });
    return { invoiceId: invoice.id, status: "sent", invoice };
  });
};
