import type { FastifyPluginAsync } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { sha256Hex } from "../../lib/hash.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";

export const registerTripsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/vehicles/:vehicleId", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const items = await prisma.trip.findMany({
      where: { vehicleId: params.vehicleId },
      include: { points: true },
      orderBy: { startedAt: "desc" }
    });
    return { vehicleId: params.vehicleId, items };
  });

  app.post("/", async (request) => {
    const body = z.object({
      vehicleId: z.string(),
      startedAt: z.string(),
      completedAt: z.string().optional(),
      metrics: z.record(z.unknown()),
      points: z.array(z.record(z.unknown())).default([])
    }).parse(request.body);
    const trip = await prisma.trip.create({
      data: {
        vehicleId: body.vehicleId,
        startedAt: new Date(body.startedAt),
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        metrics: body.metrics as Prisma.InputJsonValue,
        summaryHash: sha256Hex({ vehicleId: body.vehicleId, metrics: body.metrics, completedAt: body.completedAt }),
        points: {
          create: body.points.map((point) => ({
            lat: typeof point.lat === "number" ? point.lat : Number(point.lat ?? 0),
            lng: typeof point.lng === "number" ? point.lng : Number(point.lng ?? 0),
            speedKmh: point.speedKmh === undefined ? undefined : Number(point.speedKmh),
            timestamp: new Date(typeof point.timestamp === "string" ? point.timestamp : body.startedAt)
          }))
        }
      },
      include: { points: true }
    });
    return { tripId: trip.id, status: "saved", trip };
  });

  app.post("/:tripId/anchor", async (request) => {
    const params = z.object({ tripId: z.string() }).parse(request.params);
    const trip = await prisma.trip.findUnique({ where: { id: params.tripId } });
    if (!trip) {
      throw app.httpErrors.notFound("Trip not found.");
    }
    const job = await enqueueOnchainJob("anchor_trip_summary", { tripId: trip.id, vehicleId: trip.vehicleId, summaryHash: trip.summaryHash });
    return { tripId: params.tripId, status: "anchor_queued", job: "anchor_trip_summary", onchainJobId: job.id };
  });
};
