import { access, stat } from "node:fs/promises";
import { parseArgs, printProgramDeployment, printWalletReadiness, rpcUrl, dasRpcUrl } from "./lib/devnet.js";

async function exists(path: string) {
  try {
    await access(path);
    const info = await stat(path);
    return { exists: true, bytes: info.size };
  } catch {
    return { exists: false, bytes: 0 };
  }
}

async function dependency(name: string) {
  try {
    await import(name);
    return { name, installed: true };
  } catch (error) {
    return { name, installed: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const args = parseArgs();
  const [wallet, programDeployment, idl, programSo, dependencies] = await Promise.all([
    printWalletReadiness(args),
    printProgramDeployment(),
    exists("idl/noc_registry.json"),
    exists("programs/noc_registry/target/deploy/noc_registry.so"),
    Promise.all([
      dependency("@coral-xyz/anchor"),
      dependency("@solana/web3.js"),
      dependency("@metaplex-foundation/umi"),
      dependency("@metaplex-foundation/umi-bundle-defaults"),
      dependency("@metaplex-foundation/mpl-core"),
      dependency("@metaplex-foundation/mpl-bubblegum")
    ])
  ]);

  const env = {
    SOLANA_RPC_URL: rpcUrl(),
    SOLANA_DAS_RPC_URL: dasRpcUrl(),
    NOC_REGISTRY_PROGRAM_ID: process.env.NOC_REGISTRY_PROGRAM_ID ?? null,
    BUBBLEGUM_TREE_ADDRESS: process.env.BUBBLEGUM_TREE_ADDRESS ?? null,
    METAPLEX_CORE_COLLECTION_ADDRESS: process.env.METAPLEX_CORE_COLLECTION_ADDRESS ?? null,
    DEVNET_KEYPAIR_PATH: process.env.DEVNET_KEYPAIR_PATH ?? null
  };

  const ready = idl.exists &&
    programSo.exists &&
    dependencies.every((item) => item.installed) &&
    wallet.ready === true &&
    programDeployment.deployed === true;

  console.log(JSON.stringify({
    ready,
    idl,
    programSo,
    dependencies,
    wallet,
    programDeployment,
    env,
    nextIfNotReady: [
      "Run npm run anchor:build if programSo is missing.",
      "Set DEVNET_KEYPAIR_PATH or pass --keypair.",
      "Airdrop devnet SOL until wallet.balanceSol >= 2.",
      "Run npm run devnet:deploy-program after wallet is funded, then rerun preflight."
    ]
  }, null, 2));

  if (!ready) process.exitCode = 1;
}

void main();
