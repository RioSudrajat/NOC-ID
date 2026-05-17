import { createSolanaRpc } from "@solana/kit";

const address = process.argv[2];
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

if (!address) {
  throw new Error("Usage: tsx scripts/devnet/airdrop.ts <wallet-address>");
}

const rpc = createSolanaRpc(rpcUrl);
const signature = await rpc.requestAirdrop(address as never, 2_000_000_000n as never).send();

console.log(JSON.stringify({ address, lamports: "2000000000", signature }, null, 2));
