import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

async function resolveWorkshopId(workshopId: string) {
  const requested = await prisma.workshop.findUnique({ where: { id: workshopId }, select: { id: true } });
  if (requested) return requested.id;
  const approved = await prisma.workshop.findFirst({
    where: { status: "approved" },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });
  return approved?.id;
}

function normalizeAnchoredBooking<T extends { status: string; serviceLog?: { txSignature?: string | null } | null }>(booking: T): T {
  if (booking.status === "ANCHORING" && booking.serviceLog?.txSignature) {
    return { ...booking, status: "ANCHORED" };
  }
  return booking;
}

export const registerBookingsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = z.object({ vehicleId: z.string().optional(), workshopId: z.string().optional(), status: z.string().optional() }).parse(request.query);
    const items = await prisma.booking.findMany({
      where: {
        vehicleId: query.vehicleId,
        workshopId: query.workshopId,
        status: query.status as never
      },
      include: { vehicle: true, workshop: true, invoice: { include: { payments: true } }, serviceLog: true },
      orderBy: { createdAt: "desc" }
    });
    return { items: items.map(normalizeAnchoredBooking) };
  });

  app.post("/", async (request) => {
    const body = z.object({
      vehicleId: z.string().min(1),
      workshopId: z.string().min(1),
      date: z.string().min(1),
      time: z.string().min(1),
      complaint: z.string().min(1)
    }).parse(request.body);
    const workshopId = await resolveWorkshopId(body.workshopId);
    if (!workshopId) {
      throw app.httpErrors.badRequest("Workshop backend record not found. Seed or approve a workshop first.");
    }
    const booking = await prisma.booking.create({
      data: {
        vehicleId: body.vehicleId,
        workshopId,
        date: body.date,
        time: body.time,
        complaint: body.complaint,
        status: "PENDING"
      },
      include: { vehicle: true, workshop: true }
    });
    return { bookingId: booking.id, status: booking.status, booking };
  });

  app.post("/walk-in", async (request) => {
    const body = z.object({
      vehicleId: z.string().min(1),
      workshopId: z.string().min(1),
      complaint: z.string().min(1).default("Walk-in service")
    }).parse(request.body);
    const workshopId = await resolveWorkshopId(body.workshopId);
    if (!workshopId) {
      throw app.httpErrors.badRequest("Workshop backend record not found. Seed or approve a workshop first.");
    }
    const now = new Date();
    const booking = await prisma.booking.create({
      data: {
        type: "walkin",
        vehicleId: body.vehicleId,
        workshopId,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        complaint: body.complaint,
        status: "ACCEPTED"
      },
      include: { vehicle: true, workshop: true, invoice: { include: { payments: true } }, serviceLog: true }
    });
    return { bookingId: booking.id, status: booking.status, booking };
  });

  app.patch("/:bookingId/status", async (request) => {
    const params = z.object({ bookingId: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "IN_SERVICE", "INVOICE_SENT", "PAID", "ANCHORING", "ANCHORED", "COMPLETED"]) }).parse(request.body);
    const existing = await prisma.booking.findUnique({ where: { id: params.bookingId } });
    if (!existing) {
      throw app.httpErrors.notFound("Booking not found. Refresh booking list and retry.");
    }

    const booking = await prisma.booking.update({
      where: { id: params.bookingId },
      data: { status: body.status },
      include: { vehicle: true, workshop: true, invoice: { include: { payments: true } }, serviceLog: true }
    });
    const normalized = normalizeAnchoredBooking(booking);
    return { bookingId: params.bookingId, status: normalized.status, booking: normalized };
  });
};
