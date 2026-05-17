import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const registerWorkshopsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = z.object({ status: z.string().optional(), city: z.string().optional() }).parse(request.query);
    const items = await prisma.workshop.findMany({
      where: {
        status: query.status as never,
        city: query.city
      },
      include: { credentials: true },
      orderBy: { updatedAt: "desc" }
    });
    return { items, source: "postgres" };
  });

  app.get("/me", async (request) => {
    const query = z.object({ wallet: z.string().optional(), workshopId: z.string().optional() }).parse(request.query);
    const workshop = await prisma.workshop.findFirst({
      where: {
        id: query.workshopId,
        authorityWallet: query.wallet
      },
      include: { credentials: true, registrations: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    return { workshop, credentials: workshop?.credentials ?? [] };
  });

  app.post("/registrations", async (request) => {
    const body = z.object({
      businessName: z.string().min(1),
      businessType: z.string().default("general_repair"),
      address: z.string().default("TBD"),
      city: z.string().min(1),
      province: z.string().default("DKI Jakarta"),
      phone: z.string().min(5),
      picName: z.string().default("Workshop PIC"),
      picPhone: z.string().optional(),
      signerMode: z.string().default("self_custody"),
      signerWalletAddress: z.string().optional(),
      npwp: z.string().optional(),
      nib: z.string().optional()
    }).passthrough().parse(request.body);
    const workshop = await prisma.workshop.create({
      data: {
        name: body.businessName,
        city: body.city,
        address: body.address,
        phone: body.phone,
        authorityWallet: body.signerWalletAddress,
        treasuryWallet: body.signerWalletAddress,
        status: "pending_kyc",
        registrations: {
          create: {
            businessName: body.businessName,
            businessType: body.businessType,
            npwp: body.npwp,
            nib: body.nib,
            address: body.address,
            city: body.city,
            province: body.province,
            phone: body.phone,
            picName: body.picName,
            picPhone: body.picPhone ?? body.phone,
            signerMode: body.signerMode,
            signerWallet: body.signerWalletAddress,
            status: "pending_kyc",
            privateEvidence: {}
          }
        }
      },
      include: { registrations: true }
    });
    return { registrationId: workshop.registrations[0]?.id, workshopId: workshop.id, status: "pending_kyc", ...body };
  });

  app.get("/queue", async (request) => {
    const query = z.object({ workshopId: z.string().optional() }).parse(request.query);
    const items = await prisma.booking.findMany({
      where: { workshopId: query.workshopId },
      include: { vehicle: true, workshop: true, invoice: { include: { payments: true } } },
      orderBy: { createdAt: "desc" }
    });
    return { items };
  });
};
