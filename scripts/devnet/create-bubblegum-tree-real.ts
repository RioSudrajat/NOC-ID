import { parseArgs, requireExecute, requireKeypair, rpcUrl } from "./lib/devnet.js";

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const maxDepth = Number(args["max-depth"] ?? process.env.BUBBLEGUM_TREE_MAX_DEPTH ?? 14);
  const maxBufferSize = Number(args["max-buffer-size"] ?? process.env.BUBBLEGUM_TREE_MAX_BUFFER_SIZE ?? 64);
  const summary = {
    action: "create_bubblegum_v2_tree",
    cluster: "devnet",
    payer: payer.publicKey.toBase58(),
    maxDepth,
    maxBufferSize,
    capacity: 2 ** maxDepth,
    note: "Creates a Bubblegum V2 Merkle tree. Requires funded payer and may require DAS RPC for later reads."
  };
  requireExecute(args, summary);

  const [{ createUmi }, { createTreeV2, mplBubblegum }, { generateSigner, keypairIdentity }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/mpl-bubblegum"),
    import("@metaplex-foundation/umi")
  ]);

  const umi = createUmi(rpcUrl()).use(mplBubblegum());
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  umi.use(keypairIdentity(umiKeypair));
  const merkleTree = generateSigner(umi);
  const builder = await createTreeV2(umi, { merkleTree, maxDepth, maxBufferSize, public: true });
  const result = await builder.sendAndConfirm(umi);

  console.log(JSON.stringify({
    ...summary,
    treeAddress: merkleTree.publicKey,
    signature: result.signature,
    env: { BUBBLEGUM_TREE_ADDRESS: merkleTree.publicKey }
  }, null, 2));
}

void main();
