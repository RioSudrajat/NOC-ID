import * as anchor from "@coral-xyz/anchor";
import { readFile } from "node:fs/promises";
import { SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import {
  argString,
  backendUrl,
  connection,
  fetchJson,
  hexToBytes32,
  parseArgs,
  pda,
  programId,
  requireExecute,
  requireKeypair,
  sha256Bytes
} from "./lib/devnet.js";

type VehicleResponse = {
  vehicle: {
    enterpriseId?: string | null;
    enterprise?: {
      authorityWallet?: string | null;
      metadataHash?: string | null;
    } | null;
  };
};

function validPublicKey(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new PublicKey(value).toBase58();
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const vehicleId = argString(args, "vehicle-id");
  const vehicle = vehicleId
    ? (await fetchJson<VehicleResponse>(`${backendUrl(args)}/vehicles/${vehicleId}`)).vehicle
    : null;
  const enterpriseId = argString(args, "enterprise-id", vehicle?.enterpriseId ?? undefined);
  if (!enterpriseId) throw new Error("Usage: --enterprise-id <db enterprise id> or --vehicle-id <db vehicle id> [--execute]");

  const enterpriseAuthority = argString(
    args,
    "enterprise-authority",
    validPublicKey(vehicle?.enterprise?.authorityWallet) ?? payer.publicKey.toBase58()
  )!;
  const metadataHash = argString(args, "metadata-hash", vehicle?.enterprise?.metadataHash ?? undefined);
  const enterpriseHash = Buffer.from(sha256Bytes(enterpriseId));
  const [platformConfig] = pda(["platform"], programId());
  const [enterpriseRecord] = pda(["enterprise", enterpriseHash], programId());
  const summary = {
    action: "register_enterprise",
    vehicleId: vehicleId ?? null,
    enterpriseId,
    payer: payer.publicKey.toBase58(),
    superadmin: payer.publicKey.toBase58(),
    enterpriseAuthority,
    platformConfig: platformConfig.toBase58(),
    enterpriseRecord: enterpriseRecord.toBase58(),
    metadataHash: metadataHash ?? null
  };
  requireExecute(args, summary);

  const existing = await connection().getAccountInfo(enterpriseRecord, "confirmed");
  if (existing) {
    console.log(JSON.stringify({ skipped: true, reason: "enterprise_record_already_exists", ...summary }, null, 2));
    process.exit(0);
  }

  const idl = JSON.parse(await readFile("idl/noc_registry.json", "utf8")) as anchor.Idl;
  const provider = new anchor.AnchorProvider(connection(), new anchor.Wallet(payer), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const ix = await program.methods
    .registerEnterprise(Array.from(enterpriseHash), hexToBytes32(metadataHash))
    .accounts({
      payer: payer.publicKey,
      superadmin: payer.publicKey,
      platformConfig,
      enterpriseAuthority: new PublicKey(enterpriseAuthority),
      enterpriseRecord,
      systemProgram: SystemProgram.programId
    })
    .instruction();
  const tx = new Transaction().add(ix);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection().getLatestBlockhash("confirmed")).blockhash;
  const simulation = await connection().simulateTransaction(tx);
  if (simulation.value.err) throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)} ${JSON.stringify(simulation.value.logs)}`);
  const signature = await sendAndConfirmTransaction(connection(), tx, [payer], { commitment: "confirmed" });
  console.log(JSON.stringify({ ...summary, signature, envOrDb: { enterpriseRecordPda: enterpriseRecord.toBase58() } }, null, 2));
}

void main();
