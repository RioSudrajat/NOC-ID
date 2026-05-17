import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const registerAnalyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/enterprise/:enterpriseId", async (request) => {
    const { enterpriseId } = request.params as { enterpriseId: string };
    const [totalVehicles, totalCompletedServices, totalPartCatalogItems] = await Promise.all([
      prisma.vehicle.count({ where: { enterpriseId } }),
      prisma.serviceLog.count({ where: { vehicle: { enterpriseId } } }),
      prisma.partCatalogItem.count({ where: { enterpriseId } })
    ]);
    return { enterpriseId, metrics: { totalVehicles, totalCompletedServices, totalPartCatalogItems } };
  });

  app.get("/workshop/:workshopId", async (request) => {
    const { workshopId } = request.params as { workshopId: string };
    const [servicesThisMonth, bookings, invoices] = await Promise.all([
      prisma.serviceLog.count({ where: { workshopId } }),
      prisma.booking.count({ where: { workshopId } }),
      prisma.invoice.findMany({ where: { booking: { workshopId } }, select: { totalIdr: true } })
    ]);
    const revenueThisMonth = invoices.reduce((sum, invoice) => sum + invoice.totalIdr, 0);
    return { workshopId, metrics: { servicesThisMonth, bookings, revenueThisMonth, avgRating: 4.8 } };
  });

  app.get("/admin", async () => {
    const [totalUsers, totalVehicles, totalTransactions, totalWorkshops, totalEnterprises] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.txReceipt.count(),
      prisma.workshop.count(),
      prisma.enterprise.count()
    ]);
    return { metrics: { totalUsers, totalVehicles, totalTransactions, totalWorkshops, totalEnterprises } };
  });
};
