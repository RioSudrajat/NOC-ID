import type { FastifyPluginAsync, FastifyRequest } from "fastify";
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

export const registerBookingsRoutes: FastifyPluginAsync = async (app) => {
  async function currentUser(request: FastifyRequest) {
    try {
      return await request.jwtVerify<{ sub: string; role?: string; workshopId?: string; walletAddress?: string }>();
    } catch {
      return null;
    }
  }

  async function resolveWorkshopIdForAuth(auth: { sub: string; role?: string; workshopId?: string; walletAddress?: string }, requestedWorkshopId: string) {
    if (auth.role && auth.role !== "workshop_owner") {
      throw app.httpErrors.forbidden("Only workshop owners can create QR walk-in bookings.");
    }
    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { role: true, workshopId: true, embeddedWalletAddress: true, selfCustodyAddress: true }
    });
    if (!user || user.role !== "workshop_owner") {
      throw app.httpErrors.forbidden("Only workshop owners can create QR walk-in bookings.");
    }

    const linkedWorkshopId = user.workshopId ?? auth.workshopId;
    if (linkedWorkshopId) {
      if (auth.workshopId && auth.workshopId !== linkedWorkshopId) {
        throw app.httpErrors.forbidden("Workshop session does not match the linked workshop record.");
      }
      if (requestedWorkshopId !== linkedWorkshopId) {
        throw app.httpErrors.forbidden("Workshop request does not match the linked workshop record.");
      }
      return { workshopId: linkedWorkshopId, source: user.workshopId ? "user_link" : "jwt_claim" };
    }

    const requested = await prisma.workshop.findUnique({
      where: { id: requestedWorkshopId },
      select: { id: true, status: true }
    });
    if (requested?.status === "approved") {
      return { workshopId: requested.id, source: "request_approved_workshop" };
    }

    const walletAddresses = [auth.walletAddress, user.selfCustodyAddress, user.embeddedWalletAddress].filter((value): value is string => Boolean(value));
    if (walletAddresses.length) {
      const walletWorkshop = await prisma.workshop.findFirst({
        where: {
          id: requestedWorkshopId,
          status: "approved",
          OR: [
            { authorityWallet: { in: walletAddresses } },
            { treasuryWallet: { in: walletAddresses } }
          ]
        },
        select: { id: true }
      });
      if (walletWorkshop) {
        return { workshopId: walletWorkshop.id, source: "wallet_match" };
      }
    }

    if (!requested) {
      throw app.httpErrors.badRequest("Workshop backend record not found. Seed or approve a workshop first.");
    }
    throw app.httpErrors.forbidden("Workshop account is not linked to an approved workshop record.");
  }

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
    const anchoredServiceLogIds = items
      .filter((booking) => booking.status === "ANCHORING" && booking.serviceLog?.txSignature)
      .map((booking) => booking.serviceLog?.id)
      .filter((id): id is string => Boolean(id));
    if (anchoredServiceLogIds.length) {
      const recentReceipts = await prisma.txReceipt.findMany({
        orderBy: { createdAt: "desc" },
        take: 1000
      }).catch(() => []);
      const completedPassportServiceLogs = new Set(
        recentReceipts
          .map((receipt) => receipt.raw as Record<string, unknown> | null)
          .filter((raw) => (
            raw?.action === "client_signed_update_cnft_metadata" ||
            raw?.jobName === "update_cnft_metadata"
          ) && typeof raw.serviceLogId === "string")
          .map((raw) => raw!.serviceLogId as string)
      );
      const bookingsToFinalize = items.filter((booking) => {
        const serviceLogId = booking.serviceLog?.id;
        return booking.status === "ANCHORING" && Boolean(serviceLogId && completedPassportServiceLogs.has(serviceLogId));
      });
      if (bookingsToFinalize.length) {
        await prisma.booking.updateMany({
          where: { id: { in: bookingsToFinalize.map((booking) => booking.id) } },
          data: { status: "ANCHORED" }
        });
        for (const booking of bookingsToFinalize) {
          booking.status = "ANCHORED";
        }
      }
    }
    return { items };
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
    const bodyResult = z.object({
      vehicleId: z.string().min(1),
      workshopId: z.string().min(1),
      scanSessionId: z.string().min(1),
      complaint: z.string().min(1).default("Walk-in service")
    }).safeParse(request.body);
    if (!bodyResult.success) {
      throw app.httpErrors.badRequest("Verified scanSessionId is required for QR walk-in bookings.");
    }
    const body = bodyResult.data;
    const auth = await currentUser(request);
    if (!auth?.sub) {
      throw app.httpErrors.unauthorized("Workshop login required to create walk-in booking from QR scan.");
    }
    const workshopResolution = await resolveWorkshopIdForAuth(auth, body.workshopId);
    const workshopId = workshopResolution.workshopId;
    if (!workshopId) {
      throw app.httpErrors.badRequest("Workshop backend record not found. Seed or approve a workshop first.");
    }
    const qrToken = await prisma.vehicleQrToken.findUnique({ where: { id: body.scanSessionId } });
    if (!qrToken || qrToken.vehicleId !== body.vehicleId) {
      request.log.warn({
        event: "vehicle_qr_walkin_failed",
        reason: "scan_session_vehicle_mismatch",
        scanSessionId: body.scanSessionId,
        vehicleId: body.vehicleId,
        workshopId
      }, "QR walk-in booking failed.");
      throw app.httpErrors.badRequest("QR scan session does not match this vehicle.");
    }
    if (!qrToken.consumedAt || qrToken.consumedByWorkshopId !== workshopId) {
      request.log.warn({
        event: "vehicle_qr_walkin_failed",
        reason: "scan_session_not_verified_by_workshop",
        scanSessionId: body.scanSessionId,
        vehicleId: body.vehicleId,
        workshopId
      }, "QR walk-in booking failed.");
      throw app.httpErrors.badRequest("QR scan session has not been verified by this workshop.");
    }
    if (qrToken.bookingId) {
      request.log.warn({
        event: "vehicle_qr_walkin_failed",
        reason: "scan_session_already_booked",
        scanSessionId: body.scanSessionId,
        vehicleId: body.vehicleId,
        workshopId,
        bookingId: qrToken.bookingId
      }, "QR walk-in booking failed.");
      throw app.httpErrors.badRequest("QR scan session has already created a walk-in booking.");
    }
    const now = new Date();
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
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
      await tx.vehicleQrToken.update({
        where: { id: qrToken.id },
        data: { bookingId: created.id }
      });
      return created;
    });
    request.log.info({
      event: "vehicle_qr_walkin_success",
      scanSessionId: qrToken.id,
      bookingId: booking.id,
      vehicleId: body.vehicleId,
      workshopId,
      workshopResolutionSource: workshopResolution.source
    }, "QR walk-in booking created.");
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
    return { bookingId: params.bookingId, status: booking.status, booking };
  });
};
