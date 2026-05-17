import { PublicKey } from "@solana/web3.js";
import { argString, connection, parseArgs, requireKeypair, rpcUrl } from "./lib/devnet.js";

function leafIndex(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const address = new PublicKey(argString(args, "address", payer.publicKey.toBase58())!);
  const limit = Number(args.limit ?? 20);
  const signatures = await connection().getSignaturesForAddress(address, { limit }, "confirmed");

  const [{ createUmi }, { mplBubblegum, parseLeafFromMintV2Transaction }, { base58 }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/mpl-bubblegum"),
    import("@metaplex-foundation/umi/serializers")
  ]);
  const umi = createUmi(rpcUrl()).use(mplBubblegum());
  const recovered = [];

  for (const item of signatures) {
    try {
      const leaf = await parseLeafFromMintV2Transaction(umi, base58.serialize(item.signature));
      recovered.push({
        signature: item.signature,
        slot: item.slot,
        blockTime: item.blockTime,
        assetId: leaf.id,
        leafIndex: leafIndex(leaf.nonce)
      });
    } catch {
      // Ignore non-Bubblegum mint transactions.
    }
  }

  console.log(JSON.stringify({
    scannedAddress: address.toBase58(),
    scannedSignatures: signatures.length,
    recovered
  }, null, 2));

  if (recovered.length === 0) process.exitCode = 1;
}

void main();
