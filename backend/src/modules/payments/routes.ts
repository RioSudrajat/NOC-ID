import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createDevnetUiSignature } from "../../lib/devnetSignature.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { prisma } from "../../lib/prisma.js";
import { paymentCurrencyConfig } from "./constants.js";

const createPaymentIntentSchema = z.object({
  invoiceId: z.string().min(1),
  bookingId: z.string().min(1),
  amountIdr: z.number().int().positive(),
  currency: z.enum(["IDR", "IDRX", "USDC", "NOC"]),
  payerWallet: z.string().optional(),
  recipientWallet: z.string().min(32)
});

export const registerPaymentsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/currencies", async () => paymentCurrencyConfig);

  app.post("/intents", async (request) => {
    const body = createPaymentIntentSchema.parse(request.body);
    const config = paymentCurrencyConfig[body.currency];
    if (body.currency === "NOC") {
      throw app.httpErrors.badRequest("$NOC payment is reserved for a future token phase.");
    }
    if (config.mint?.startsWith("idrxTdN")) {
      throw app.httpErrors.badRequest("Deprecated IDRX mint is not accepted.");
    }
    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { booking: { include: { workshop: true } } }
    });
    if (!invoice) {
      throw app.httpErrors.notFound("Invoice not found.");
    }
    if (invoice.bookingId !== body.bookingId) {
      throw app.httpErrors.badRequest("Invoice does not belong to booking.");
    }
    const amountAtomic = body.currency === "USDC" ? BigInt(Math.ceil((body.amountIdr / 16000) * 10 ** 6)) : BigInt(body.amountIdr * 10 ** config.decimals);
    const displayAmount = body.currency === "USDC" ? Math.ceil((body.amountIdr / 16000) * 100) / 100 : body.amountIdr;
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        currency: body.currency,
        amountAtomic,
        amountDisplay: displayAmount,
        mint: config.mint,
        payerWallet: body.payerWallet,
        recipientWallet: body.recipientWallet,
        status: "REQUIRES_SIGNATURE"
      }
    });
    return {
      paymentIntentId: payment.id,
      status: payment.status,
      invoiceId: body.invoiceId,
      bookingId: body.bookingId,
      currency: body.currency,
      mint: config.mint,
      amount: amountAtomic.toString(),
      displayAmount,
      recipientWallet: body.recipientWallet,
      cluster: "devnet",
      safety: {
        simulateBeforeSign: true,
        deprecatedIdrxMintPrefixRejected: "idrxTdN"
      }
    };
  });

  app.post("/:paymentIntentId/submit-signed", async (request) => {
    const params = z.object({ paymentIntentId: z.string().min(1) }).parse(request.params);
    const body = z.object({ signature: z.string().min(32), mint: z.string().optional() }).parse(request.body);
    if (body.mint?.startsWith("idrxTdN")) {
      throw app.httpErrors.badRequest("Deprecated IDRX mint is not accepted.");
    }
    const payment = await prisma.payment.update({
      where: { id: params.paymentIntentId },
      data: { signature: body.signature, status: "CONFIRMING" },
      include: { invoice: true }
    });
    const job = await enqueueOnchainJob("record_payment_receipt", {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      signature: body.signature,
      mint: payment.mint,
      amountAtomic: payment.amountAtomic.toString(),
      recipientWallet: payment.recipientWallet
    });
    return {
      paymentIntentId: params.paymentIntentId,
      status: payment.status,
      signature: body.signature,
      nextAction: "worker_confirm_and_record_payment_receipt",
      onchainJobId: job.id
    };
  });

  app.post("/:paymentIntentId/devnet-confirm", async (request) => {
    const params = z.object({ paymentIntentId: z.string().min(1) }).parse(request.params);
    const body = z.object({ payerWallet: z.string().min(32).optional() }).parse(request.body ?? {});
    const existing = await prisma.payment.findUnique({
      where: { id: params.paymentIntentId },
      include: { invoice: { include: { booking: true } } }
    });
    if (!existing) throw app.httpErrors.notFound("Payment intent not found.");
    if (existing.currency !== "IDRX") {
      throw app.httpErrors.badRequest("Devnet confirm saat ini hanya untuk IDRX receipt mode.");
    }
    if (existing.mint?.startsWith("idrxTdN")) {
      throw app.httpErrors.badRequest("Deprecated IDRX mint is not accepted.");
    }
    const signature = createDevnetUiSignature("record_payment_receipt", {
      paymentId: existing.id,
      invoiceId: existing.invoiceId,
      amountAtomic: existing.amountAtomic.toString()
    });
    const payment = await prisma.payment.update({
      where: { id: params.paymentIntentId },
      data: { signature, payerWallet: body.payerWallet ?? existing.payerWallet, status: "CONFIRMING" },
      include: { invoice: true }
    });
    const job = await enqueueOnchainJob("record_payment_receipt", {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      signature,
      mint: payment.mint,
      amountAtomic: payment.amountAtomic.toString(),
      recipientWallet: payment.recipientWallet
    });
    return {
      paymentIntentId: params.paymentIntentId,
      status: payment.status,
      signature,
      nextAction: "worker_confirm_and_record_payment_receipt",
      onchainJobId: job.id
    };
  });
};
