import { config } from "dotenv";

config({ path: "backend/.env" });

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const dasRpcUrl = process.env.SOLANA_DAS_RPC_URL || rpcUrl;
const maxDepth = Number(process.env.BUBBLEGUM_TREE_MAX_DEPTH ?? 14);
const maxBufferSize = Number(process.env.BUBBLEGUM_TREE_MAX_BUFFER_SIZE ?? 64);
const canopyDepth = Number(process.env.BUBBLEGUM_TREE_CANOPY_DEPTH ?? 10);
const treeAddress = process.env.BUBBLEGUM_TREE_ADDRESS;
const collectionAddress = process.env.METAPLEX_CORE_COLLECTION_ADDRESS;

async function rpc(method: string, params: unknown[] = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "noc-bubblegum-preflight", method, params })
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(JSON.stringify(body.error ?? body));
  }
  return body.result;
}

async function main() {
  const [health, version] = await Promise.all([
    rpc("getHealth").catch((error) => ({ error: error instanceof Error ? error.message : String(error) })),
    rpc("getVersion").catch((error) => ({ error: error instanceof Error ? error.message : String(error) }))
  ]);

  const manifest = {
    action: treeAddress ? "bubblegum_tree_configured" : "bubblegum_tree_preflight",
    readyForMint: Boolean(treeAddress && collectionAddress),
    rpcUrl,
    dasRpcUrl,
    health,
    version,
    tree: {
      address: treeAddress ?? null,
      maxDepth,
      maxBufferSize,
      canopyDepth,
      capacity: 2 ** maxDepth
    },
    collection: {
      address: collectionAddress ?? null,
      standard: "Metaplex Core Collection"
    },
    requiredBeforeRealMint: [
      "fund devnet enterprise authority",
      "create Bubblegum V2 Merkle tree with the selected authority",
      "create or configure Metaplex Core collection",
      "set BUBBLEGUM_TREE_ADDRESS and METAPLEX_CORE_COLLECTION_ADDRESS in backend/.env",
      "use DAS-enabled RPC for asset fetch/update/transfer"
    ]
  };

  console.log(JSON.stringify(manifest, null, 2));
  if (!manifest.readyForMint) {
    process.exitCode = 1;
  }
}

void main();
