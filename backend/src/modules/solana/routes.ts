import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

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
