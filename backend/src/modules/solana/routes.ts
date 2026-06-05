import type { FastifyPluginAsync } from "fastify";
import { AddressLookupTableProgram, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { createHash } from "crypto";
import { z } from "zod";
import { env } from "../../config/env.js";
import { getConnection, readOperatorKeypair } from "../../lib/onchainAuthority.js";
import { prisma } from "../../lib/prisma.js";

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function hashAddresses(addresses: string[]) {
  return createHash("sha256").update([...addresses].sort().join("|")).digest("hex");
}

async function waitForFinalizedLookupTable(connection: ReturnType<typeof getConnection>, lookupTableAddress: PublicKey) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const lookupTable = await connection.getAddressLookupTable(lookupTableAddress, { commitment: "finalized" });
    if (lookupTable.value?.state.addresses.length) return lookupTable.value;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`Address Lookup Table ${lookupTableAddress.toBase58()} belum finalized di RPC.`);
}

function isRecentSlotError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /not a recent slot|InvalidInstructionData|CreateLookupTable/i.test(message);
}

async function createLookupTableWithFreshSlot(connection: ReturnType<typeof getConnection>, operator: Awaited<ReturnType<typeof readOperatorKeypair>>) {
  let lastError: unknown;
  const readCandidateSlots = async () => {
    const [processed, confirmed, finalized] = await Promise.all([
      connection.getSlot("processed").catch(() => null),
      connection.getSlot("confirmed").catch(() => null),
      connection.getSlot("finalized").catch(() => null),
    ]);
    return Array.from(new Set([
      confirmed == null ? null : confirmed - 1,
      confirmed == null ? null : confirmed - 8,
      finalized,
      finalized == null ? null : finalized - 1,
      processed == null ? null : processed - 32,
      processed == null ? null : processed - 64,
    ].filter((slot): slot is number => typeof slot === "number" && slot > 0)));
  };

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const candidateSlots = await readCandidateSlots();
    for (const recentSlot of candidateSlots) {
      const [createIx, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
        authority: operator.publicKey,
        payer: operator.publicKey,
        recentSlot
      });
      try {
        const createSignature = await sendAndConfirmTransaction(
          connection,
          new Transaction().add(createIx),
          [operator],
          { commitment: "confirmed", preflightCommitment: "confirmed" }
        );
        return { recentSlot, lookupTableAddress, createSignature };
      } catch (error) {
        lastError = error;
        if (!isRecentSlotError(error)) throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 650 * attempt));
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function sendLookupTableExtension(connection: ReturnType<typeof getConnection>, tx: Transaction, operator: Awaited<ReturnType<typeof readOperatorKeypair>>) {
  tx.feePayer = operator.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  return sendAndConfirmTransaction(
    connection,
    tx,
    [operator],
    { commitment: "confirmed", preflightCommitment: "confirmed" }
  );
}

export const registerSolanaRoutes: FastifyPluginAsync = async (app) => {
  app.get("/config", async () => ({
    cluster: env.SOLANA_CLUSTER,
    rpcUrl: env.SOLANA_RPC_URL,
    wsUrl: env.SOLANA_WS_URL ?? env.SOLANA_RPC_URL.replace("https://", "wss://").replace("http://", "ws://"),
    dasRpcUrl: env.SOLANA_DAS_RPC_URL,
    programId: env.NOC_REGISTRY_PROGRAM_ID,
    idrxMint: env.IDRX_MINT,
    usdcMint: env.USDC_MINT
  }));

  app.post("/simulate", async (request) => {
    const body = z.object({
      transactionBase64: z.string().optional(),
      summary: z.record(z.unknown()).optional()
    }).parse(request.body ?? {});

    if (!body.transactionBase64) {
      return {
        ok: true,
        simulated: false,
        cluster: env.SOLANA_CLUSTER,
        summary: body.summary,
        nextAction: "build_transaction_then_resubmit_for_rpc_simulation",
        safety: {
          requiresWalletApprovalAfterSimulation: true,
          signatureSubmissionEndpoint: "/payments/:paymentIntentId/submit-signed or /service-logs/:serviceLogId/submit-signed"
        }
      };
    }

    const rpcResponse = await fetch(env.SOLANA_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "noc-simulate",
        method: "simulateTransaction",
        params: [body.transactionBase64, { encoding: "base64", sigVerify: false, replaceRecentBlockhash: true }]
      })
    });
    const payload = await rpcResponse.json();
    if (!rpcResponse.ok || payload.error) {
      throw app.httpErrors.badGateway(JSON.stringify(payload.error ?? payload));
    }
    return {
      ok: payload.result?.value?.err == null,
      simulated: true,
      cluster: env.SOLANA_CLUSTER,
      logs: payload.result?.value?.logs ?? [],
      unitsConsumed: payload.result?.value?.unitsConsumed,
      error: payload.result?.value?.err ?? null
    };
  });

  app.get("/jobs", async (request) => {
    const query = z.object({ status: z.string().optional(), name: z.string().optional() }).parse(request.query);
    const items = await prisma.onchainJob.findMany({
      where: { status: query.status as never, name: query.name },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return { items };
  });

  app.get("/transactions", async (request) => {
    const query = z.object({
      action: z.string().optional(),
      programId: z.string().optional(),
      take: z.coerce.number().int().positive().max(200).default(100)
    }).parse(request.query);
    const receipts = await prisma.txReceipt.findMany({
      where: {
        programId: query.programId,
      },
      orderBy: { createdAt: "desc" },
      take: query.take
    });
    const items = query.action
      ? receipts.filter((receipt) => {
        const raw = receipt.raw as Record<string, unknown> | null;
        return raw?.action === query.action;
      })
      : receipts;
    return { items, cluster: env.SOLANA_CLUSTER };
  });

  app.post("/address-lookup-table", async (request) => {
    const body = z.object({
      addresses: z.array(z.string().min(32)).min(1).max(256)
    }).parse(request.body ?? {});
    const connection = getConnection();
    const operator = await readOperatorKeypair();
    const uniqueAddresses = Array.from(new Set(body.addresses))
      .map((address) => new PublicKey(address))
      .filter((address) => !address.equals(operator.publicKey));
    const uniqueAddressStrings = uniqueAddresses.map((address) => address.toBase58());
    if (!uniqueAddresses.length) {
      throw app.httpErrors.badRequest("Address lookup table membutuhkan minimal satu non-signer address.");
    }

    const addressHash = hashAddresses(uniqueAddressStrings);
    const cached = await prisma.auditEvent.findFirst({
      where: { action: "address_lookup_table", target: `lut:v2:${addressHash}` },
      orderBy: { createdAt: "desc" }
    });
    const cachedDetails = cached?.details as Record<string, unknown> | undefined;
    const cachedAddress = typeof cachedDetails?.lookupTableAddress === "string" ? cachedDetails.lookupTableAddress : null;
    const cachedAddresses = Array.isArray(cachedDetails?.addresses) ? cachedDetails.addresses.map(String) : [];
    const cachedAddressSet = new Set(cachedAddresses);
    if (cachedAddress && cachedAddresses.length && uniqueAddressStrings.every((address) => cachedAddressSet.has(address))) {
      const lookupTableAddress = new PublicKey(cachedAddress);
      const lookupTable = await connection.getAddressLookupTable(lookupTableAddress, { commitment: "finalized" });
      if (lookupTable.value?.state.addresses.length) {
        return {
          lookupTableAddress: lookupTableAddress.toBase58(),
          authority: operator.publicKey.toBase58(),
          addresses: cachedAddresses,
          cached: true,
          signatures: cachedDetails?.signatures ?? null
        };
      }
    }

    const { lookupTableAddress, createSignature } = await createLookupTableWithFreshSlot(connection, operator);

    const extendSignatures: string[] = [];
    for (const addressChunk of chunk(uniqueAddresses, 20)) {
      const extendIx = AddressLookupTableProgram.extendLookupTable({
        authority: operator.publicKey,
        payer: operator.publicKey,
        lookupTable: lookupTableAddress,
        addresses: addressChunk
      });
      const signature = await sendLookupTableExtension(connection, new Transaction().add(extendIx), operator);
      extendSignatures.push(signature);
    }

    await waitForFinalizedLookupTable(connection, lookupTableAddress);

    const signatures = {
      create: createSignature,
      extend: extendSignatures
    };
    await prisma.auditEvent.create({
      data: {
        action: "address_lookup_table",
        target: `lut:v2:${addressHash}`,
        details: {
          lookupTableAddress: lookupTableAddress.toBase58(),
          authority: operator.publicKey.toBase58(),
          addresses: uniqueAddressStrings,
          signatures
        }
      }
    });

    return {
      lookupTableAddress: lookupTableAddress.toBase58(),
      authority: operator.publicKey.toBase58(),
      addresses: uniqueAddressStrings,
      cached: false,
      signatures
    };
  });

  app.get("/das/vehicles/:vehicleId", async (request) => {
    const params = z.object({ vehicleId: z.string() }).parse(request.params);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: params.vehicleId } });
    if (!vehicle) {
      throw app.httpErrors.notFound("Vehicle not found.");
    }
    if (!vehicle.cnftAssetId) {
      return { vehicleId: vehicle.id, verified: false, reason: "vehicle_has_no_cnft_asset_id", expected: { assetId: null } };
    }

    const dasUrl = env.SOLANA_DAS_RPC_URL ?? env.SOLANA_RPC_URL;
    const response = await fetch(dasUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "noc-das-get-asset", method: "getAsset", params: { id: vehicle.cnftAssetId } })
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      const message = JSON.stringify(payload.error ?? payload);
      if (message.toLowerCase().includes("pubkey")) {
        return {
          vehicleId: vehicle.id,
          assetId: vehicle.cnftAssetId,
          verified: false,
          reason: "invalid_or_unavailable_cnft_asset_id",
          error: payload.error ?? payload,
          expected: { treeAddress: vehicle.treeAddress, leafIndex: vehicle.leafIndex, metadataHash: vehicle.metadataHash }
        };
      }
      throw app.httpErrors.badGateway(JSON.stringify(payload.error ?? payload));
    }
    const asset = payload.result;
    const compression = asset?.compression ?? {};
    const actualTree = typeof compression.tree === "string" ? compression.tree : null;
    const actualLeafIndex = typeof compression.leaf_id === "number" ? compression.leaf_id : null;
    const verified = (!vehicle.treeAddress || vehicle.treeAddress === actualTree) && (vehicle.leafIndex == null || vehicle.leafIndex === actualLeafIndex);
    return {
      vehicleId: vehicle.id,
      assetId: vehicle.cnftAssetId,
      verified,
      expected: { treeAddress: vehicle.treeAddress, leafIndex: vehicle.leafIndex, metadataHash: vehicle.metadataHash },
      actual: {
        treeAddress: actualTree,
        leafIndex: actualLeafIndex,
        ownership: asset?.ownership,
        interface: asset?.interface,
        content: asset?.content
      }
    };
  });
};
