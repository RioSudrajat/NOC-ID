import { parseArgs, requireExecute, requireKeypair, rpcUrl } from "./lib/devnet.js";

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const name = String(args.name ?? "NOC ID Vehicle Passport Collection");
  const uri = String(args.uri ?? process.env.METAPLEX_CORE_COLLECTION_URI ?? "https://example.com/noc-id-collection.json");
  const summary = {
    action: "create_core_collection",
    cluster: "devnet",
    payer: payer.publicKey.toBase58(),
    name,
    uri,
    plugin: "BubblegumV2",
    note: "Creates an MPL-Core Collection with the BubblegumV2 plugin enabled."
  };
  requireExecute(args, summary);

  const [{ createUmi }, { createCollection, mplCore }, { generateSigner, keypairIdentity }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/mpl-core"),
    import("@metaplex-foundation/umi")
  ]);

  const umi = createUmi(rpcUrl()).use(mplCore());
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  umi.use(keypairIdentity(umiKeypair));
  const collection = generateSigner(umi);
  const result = await createCollection(umi, {
    collection,
    name,
    uri,
    plugins: [{ type: "BubblegumV2" }]
  }).sendAndConfirm(umi);

  console.log(JSON.stringify({
    ...summary,
    collectionAddress: collection.publicKey,
    signature: result.signature,
    env: { METAPLEX_CORE_COLLECTION_ADDRESS: collection.publicKey }
  }, null, 2));
}

void main();
