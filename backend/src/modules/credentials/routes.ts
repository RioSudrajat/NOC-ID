import type { FastifyPluginAsync } from "fastify";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { buildGrantCredentialTx, explorerUrl, pda, sha256Bytes } from "../../lib/clientSignedTx.js";
import { env } from "../../config/env.js";
import { enqueueOnchainJob } from "../../lib/onchainQueue.js";
import { getConnection } from "../../lib/onchainAuthority.js";
import { prisma } from "../../lib/prisma.js";

const credentialSchema = z.object({
  workshopId: z.string(),
  credential: z.enum(["verified_signer", "oem_certified", "manufacturer_audit_partner", "recall_executor"]),
  issuedBy: z.string(),
  enterpriseId: z.string().optional(),
  validUntil: z.string().optional()
});

export const registerCredentialsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/workshops/:workshopId", async (request) => {
    const params = z.object({ workshopId: z.string() }).parse(request.params);
    const items = await prisma.workshopCredential.findMany({
      where: { workshopId: params.workshopId },
      orderBy: { createdAt: "desc" }
    });
    return { workshopId: params.workshopId, items };
  });

  app.post("/grant/draft", async (request) => {
    const body = credentialSchema.extend({
      issuerWallet: z.string().min(32)
    }).parse(request.body);
    const workshop = await prisma.workshop.findUnique({ where: { id: body.workshopId } });
    if (!workshop) throw app.httpErrors.notFound("Workshop not found.");
    const workshopRecordPda = workshop.recordPda ?? pda(["workshop", sha256Bytes(body.workshopId)]).toBase58();
    const workshopRecordInfo = await getConnection().getAccountInfo(new PublicKey(workshopRecordPda), "confirmed");
    if (!workshopRecordInfo) {
      throw app.httpErrors.badRequest("WorkshopRecord PDA belum ada di devnet. Approve/register workshop on-chain dulu sebelum grant credential wallet-signed.");
    }
    const validUntilUnix = body.validUntil
      ? Math.floor(new Date(body.validUntil).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const tx = await buildGrantCredentialTx({
      issuerWallet: body.issuerWallet,
      workshopRecordPda,
      credential: body.credential,
      validUntilUnix,
    });
    return {
      status: "READY_FOR_WALLET_SIGNATURE",
      workshopId: body.workshopId,
      credential: body.credential,
      issuerWallet: body.issuerWallet,
      enterpriseId: body.enterpriseId ?? null,
      validUntilUnix,
      transactionBase64: tx.transactionBase64,
      credentialRecordPda: tx.credentialRecordPda,
      summary: {
        action: "grant_credential",
        cluster: env.SOLANA_CLUSTER,
        feePayer: body.issuerWallet,
        signerRequired: "admin/enterprise issuer wallet",
        workshopRecordPda,
      }
    };
  });

  app.post("/grant/confirm", async (request) => {
    const body = credentialSchema.extend({
      issuerWallet: z.string().min(32),
      signature: z.string().min(32),
      credentialRecordPda: z.string().min(32)
    }).parse(request.body);
    const credential = await prisma.workshopCredential.create({
      data: {
        workshopId: body.workshopId,
        credential: body.credential,
        issuedBy: body.issuedBy,
        enterpriseId: body.enterpriseId,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        txSignature: body.signature,
        recordPda: body.credentialRecordPda
      }
    });
    await prisma.txReceipt.upsert({
      where: { signature: body.signature },
      update: { programId: env.NOC_REGISTRY_PROGRAM_ID, confirmationStatus: "CONFIRMED", raw: { action: "client_signed_grant_credential", credentialId: credential.id } },
      create: {
        signature: body.signature,
        cluster: env.SOLANA_CLUSTER,
        programId: env.NOC_REGISTRY_PROGRAM_ID,
        confirmationStatus: "CONFIRMED",
        explorerUrl: explorerUrl(body.signature),
        raw: { action: "client_signed_grant_credential", credentialId: credential.id, credential: body.credential, issuerWallet: body.issuerWallet }
      }
    });
    const job = await enqueueOnchainJob("grant_credential", {
      credentialId: credential.id,
      workshopId: body.workshopId,
      credential: body.credential,
      signature: body.signature,
      recordPda: body.credentialRecordPda
    });
    return { credentialId: credential.id, status: "GRANTED_ONCHAIN", signature: body.signature, onchainJobId: job.id };
  });

  app.post("/", async (request) => {
    const body = credentialSchema.parse(request.body);
    const credential = await prisma.workshopCredential.create({
      data: {
        workshopId: body.workshopId,
        credential: body.credential,
        issuedBy: body.issuedBy,
        enterpriseId: body.enterpriseId,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined
      }
    });
    const job = await enqueueOnchainJob("grant_credential", { credentialId: credential.id, workshopId: body.workshopId, credential: body.credential });
    return { credentialId: credential.id, status: "grant_queued", onchainJobId: job.id, ...body };
  });

  app.post("/:credentialId/revoke", async (request) => {
    const params = z.object({ credentialId: z.string() }).parse(request.params);
    const body = z.object({ reason: z.string().min(1) }).parse(request.body);
    const credential = await prisma.workshopCredential.update({
      where: { id: params.credentialId },
      data: { revokedAt: new Date(), reason: body.reason }
    });
    const job = await enqueueOnchainJob("revoke_credential", { credentialId: credential.id, reason: body.reason });
    return { credentialId: params.credentialId, status: "revoke_queued", reason: body.reason, onchainJobId: job.id };
  });
};
