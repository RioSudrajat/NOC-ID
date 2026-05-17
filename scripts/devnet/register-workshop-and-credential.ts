import * as anchor from "@coral-xyz/anchor";
import { readFile } from "node:fs/promises";
import { SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import {
  argString,
  connection,
  hexToBytes32,
  parseArgs,
  pda,
  programId,
  requireExecute,
  requireKeypair,
  sha256Bytes
} from "./lib/devnet.js";

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const workshopId = argString(args, "workshop-id", "ws-1")!;
  const metadataHashStr = argString(args, "metadata-hash", "0000000000000000000000000000000000000000000000000000000000000000");
  const credentialType = argString(args, "credential-type", "VerifiedSigner")!; // Maps to CredentialKind enum

  const workshopHash = Buffer.from(sha256Bytes(workshopId));
  const [platformConfig] = pda(["platform"], programId());
  const [workshopRecord] = pda(["workshop", workshopHash], programId());
  
  // In rust enum: VerifiedSigner = 0, OemCertified = 1, ManufacturerAuditPartner = 2, RecallExecutor = 3
  const credentialKindMap: Record<string, number> = {
    "VerifiedSigner": 0,
    "OemCertified": 1,
    "ManufacturerAuditPartner": 2,
    "RecallExecutor": 3
  };
  const credentialKindVal = credentialKindMap[credentialType] ?? 0;
  
  const [credentialRecord] = pda(["credential", workshopRecord.toBuffer(), Buffer.from([credentialKindVal])], programId());

  const summary = {
    action: "register_workshop_and_credential",
    workshopId,
    credentialType,
    payer: payer.publicKey.toBase58(),
    platformConfig: platformConfig.toBase58(),
    workshopRecord: workshopRecord.toBase58(),
    credentialRecord: credentialRecord.toBase58(),
  };
  requireExecute(args, summary);

  const idl = JSON.parse(await readFile("idl/noc_registry.json", "utf8")) as anchor.Idl;
  const provider = new anchor.AnchorProvider(connection(), new anchor.Wallet(payer), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const tx = new Transaction();

  // 1. Check if workshop_record exists
  const existingWorkshop = await connection().getAccountInfo(workshopRecord, "confirmed");
  if (!existingWorkshop) {
    console.log(`Registering workshop ${workshopId}...`);
    const ix1 = await program.methods
      .registerWorkshop(Array.from(workshopHash), hexToBytes32(metadataHashStr))
      .accounts({
        payer: payer.publicKey,
        workshopAuthority: payer.publicKey,
        platformConfig,
        workshopRecord,
        systemProgram: SystemProgram.programId
      })
      .instruction();
    tx.add(ix1);
  } else {
    console.log(`Workshop ${workshopId} already registered. Skipping registerWorkshop...`);
  }

  // 2. Check if credential_record exists
  const existingCredential = await connection().getAccountInfo(credentialRecord, "confirmed");
  if (!existingCredential) {
    console.log(`Approving workshop and granting credential ${credentialType}...`);
    
    // We must approve the workshop first so it goes from PendingKyc to Approved
    const approveIx = await program.methods
      .approveWorkshop()
      .accounts({
        superadmin: payer.publicKey,
        platformConfig,
        workshopRecord
      })
      .instruction();
    tx.add(approveIx);

    const validUntilUnix = new anchor.BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60); // 1 year validity
    const credentialEnum = credentialType === "VerifiedSigner" ? { verifiedSigner: {} } 
        : credentialType === "OemCertified" ? { oemCertified: {} } 
        : credentialType === "ManufacturerAuditPartner" ? { manufacturerAuditPartner: {} } 
        : { recallExecutor: {} };

    const ix2 = await program.methods
      .grantCredential(credentialEnum, validUntilUnix)
      .accounts({
        payer: payer.publicKey,
        issuer: payer.publicKey,
        platformConfig,
        workshopRecord,
        credentialRecord,
        systemProgram: SystemProgram.programId
      })
      .instruction();
    tx.add(ix2);
  } else {
    console.log(`Credential ${credentialType} already granted. Skipping grantCredential...`);
  }

  if (tx.instructions.length === 0) {
    console.log(JSON.stringify({ skipped: true, reason: "accounts_already_exist", ...summary }, null, 2));
    process.exit(0);
  }

  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection().getLatestBlockhash("confirmed")).blockhash;
  
  const simulation = await connection().simulateTransaction(tx);
  if (simulation.value.err) throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)} ${JSON.stringify(simulation.value.logs)}`);
  
  const signature = await sendAndConfirmTransaction(connection(), tx, [payer], { commitment: "confirmed" });
  console.log(JSON.stringify({ ...summary, signature }, null, 2));
}

void main();
