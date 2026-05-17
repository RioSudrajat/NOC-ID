import { dasRpcUrl, parseArgs, requireExecute, requireKeypair, rpcUrl } from "./lib/devnet.js";

function bigintToNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const merkleTree = String(args.tree ?? process.env.BUBBLEGUM_TREE_ADDRESS ?? "");
  const coreCollection = String(args.collection ?? process.env.METAPLEX_CORE_COLLECTION_ADDRESS ?? "");
  const leafOwner = String(args.owner ?? payer.publicKey.toBase58());
  const name = String(args.name ?? "NOC ID Vehicle Passport");
  const uri = String(args.uri ?? "");
  const sellerFeeBasisPoints = Number(args["seller-fee-bps"] ?? 0);

  const summary = {
    action: "mint_vehicle_cnft",
    cluster: "devnet",
    payer: payer.publicKey.toBase58(),
    leafOwner,
    merkleTree,
    coreCollection,
    name,
    uri,
    sellerFeeBasisPoints,
    dasRpcUrl: dasRpcUrl()
  };
  if (!merkleTree || !uri) {
    throw new Error("Missing --tree/BUBBLEGUM_TREE_ADDRESS or --uri metadata URI.");
  }
  requireExecute(args, summary);

  const [{ createUmi }, { mintV2, mplBubblegum, parseLeafFromMintV2Transaction }, { keypairIdentity, publicKey, some }, { base58 }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/mpl-bubblegum"),
    import("@metaplex-foundation/umi"),
    import("@metaplex-foundation/umi/serializers")
  ]);

  const umi = createUmi(rpcUrl()).use(mplBubblegum());
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  umi.use(keypairIdentity(umiKeypair));
  const collection = coreCollection ? publicKey(coreCollection) : undefined;
  const result = await mintV2(umi, {
    collectionAuthority: collection ? umi.identity : undefined,
    leafOwner: publicKey(leafOwner),
    merkleTree: publicKey(merkleTree),
    coreCollection: collection,
    metadata: {
      name,
      uri,
      sellerFeeBasisPoints,
      collection: collection ? some(collection) : undefined,
      creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }]
    }
  }).sendAndConfirm(umi);
  const leaf = await parseLeafFromMintV2Transaction(umi, result.signature);
  const signature = base58.deserialize(result.signature)[0];
  const leafIndex = bigintToNumber(leaf.nonce);

  console.log(JSON.stringify({
    ...summary,
    signature,
    assetId: leaf.id,
    leafIndex,
    envOrDb: {
      cnftAssetId: leaf.id,
      leafIndex,
      treeAddress: merkleTree
    }
  }, null, 2));
}

void main();
