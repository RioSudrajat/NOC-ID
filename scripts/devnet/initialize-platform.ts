import * as anchor from "@coral-xyz/anchor";
import { readFile } from "node:fs/promises";
import { SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { assertProgramDeployed, connection, isExecute, parseArgs, pda, programId, requireExecute, requireKeypair } from "./lib/devnet.js";

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const idl = JSON.parse(await readFile("idl/noc_registry.json", "utf8")) as anchor.Idl;
  const provider = new anchor.AnchorProvider(connection(), new anchor.Wallet(payer), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const [platformConfig] = pda(["platform"], programId());
  const platformFeeBps = Number(args["platform-fee-bps"] ?? 250);
  const gasSubsidyBps = Number(args["gas-subsidy-bps"] ?? 0);
  const maxBatchMintSize = Number(args["max-batch-mint-size"] ?? 10000);

  const summary = {
    action: "initialize_platform",
    cluster: "devnet",
    programId: programId().toBase58(),
    payer: payer.publicKey.toBase58(),
    platformConfig: platformConfig.toBase58(),
    platformFeeBps,
    gasSubsidyBps,
    maxBatchMintSize
  };
  requireExecute(args, summary);
  await assertProgramDeployed();

  const existing = await connection().getAccountInfo(platformConfig, "confirmed");
  if (existing) {
    console.log(JSON.stringify({ skipped: true, reason: "platform_config_already_exists", ...summary }, null, 2));
    process.exit(0);
  }

  const ix = await program.methods
    .initializePlatform(platformFeeBps, gasSubsidyBps, maxBatchMintSize)
    .accounts({ superadmin: payer.publicKey, platformConfig, systemProgram: SystemProgram.programId })
    .instruction();
  const tx = new Transaction().add(ix);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection().getLatestBlockhash("confirmed")).blockhash;
  const simulation = await connection().simulateTransaction(tx);
  if (simulation.value.err) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)} ${JSON.stringify(simulation.value.logs)}`);
  }
  const signature = isExecute(args) ? await sendAndConfirmTransaction(connection(), tx, [payer], { commitment: "confirmed" }) : null;
  console.log(JSON.stringify({ ...summary, signature, explorerUrl: signature ? `https://explorer.solana.com/tx/${signature}?cluster=devnet` : null }, null, 2));
}

void main();
