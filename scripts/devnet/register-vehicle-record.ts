import * as anchor from "@coral-xyz/anchor";
import { readFile } from "node:fs/promises";
import { SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import { argString, backendUrl, connection, fetchJson, hexToBytes32, parseArgs, pda, programId, requireExecute, requireKeypair, sha256Bytes } from "./lib/devnet.js";

type VehicleResponse = {
  vehicle: {
    id: string;
    vin: string;
    metadataHash?: string | null;
    cnftAssetId?: string | null;
    treeAddress?: string | null;
    leafIndex?: number | null;
    enterpriseId?: string | null;
    currentOwner?: { selfCustodyAddress?: string | null; embeddedWalletAddress?: string | null } | null;
    enterprise?: { authorityWallet?: string | null; metadataHash?: string | null } | null;
  };
};

async function main() {
  const args = parseArgs();
  const payer = await requireKeypair(args);
  const vehicleId = argString(args, "vehicle-id");
  if (!vehicleId) throw new Error("Usage: --vehicle-id <db vehicle id> [--execute]");
  const response = await fetchJson<VehicleResponse>(`${backendUrl(args)}/vehicles/${vehicleId}`);
  const vehicle = response.vehicle;
  const cnftAsset = argString(args, "asset-id", vehicle.cnftAssetId ?? undefined);
  const merkleTree = argString(args, "tree", vehicle.treeAddress ?? process.env.BUBBLEGUM_TREE_ADDRESS);
  const leafIndex = Number(args["leaf-index"] ?? vehicle.leafIndex ?? 0);
  const initialOwner = argString(args, "owner", vehicle.currentOwner?.selfCustodyAddress ?? vehicle.currentOwner?.embeddedWalletAddress ?? payer.publicKey.toBase58());
  const enterpriseAuthority = argString(args, "enterprise-authority", vehicle.enterprise?.authorityWallet ?? payer.publicKey.toBase58());
  if (!cnftAsset || !merkleTree) throw new Error("Missing cNFT asset/tree. Pass --asset-id and --tree or update DB first.");

  const idl = JSON.parse(await readFile("idl/noc_registry.json", "utf8")) as anchor.Idl;
  const provider = new anchor.AnchorProvider(connection(), new anchor.Wallet(payer), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const enterpriseHash = Buffer.from(sha256Bytes(vehicle.enterpriseId ?? "unknown-enterprise"));
  const vinHash = Buffer.from(sha256Bytes(vehicle.vin));
  const [platformConfig] = pda(["platform"], programId());
  const [enterpriseRecord] = pda(["enterprise", enterpriseHash], programId());
  const [vehicleRecord] = pda(["vehicle", vinHash], programId());
  const summary = {
    action: "register_vehicle_record",
    vehicleId,
    vin: vehicle.vin,
    payer: payer.publicKey.toBase58(),
    enterpriseAuthority,
    platformConfig: platformConfig.toBase58(),
    enterpriseRecord: enterpriseRecord.toBase58(),
    vehicleRecord: vehicleRecord.toBase58(),
    initialOwner,
    cnftAsset,
    merkleTree,
    leafIndex
  };
  requireExecute(args, summary);

  const existing = await connection().getAccountInfo(vehicleRecord, "confirmed");
  if (existing) {
    console.log(JSON.stringify({
      skipped: true,
      reason: "vehicle_record_already_exists",
      ...summary,
      account: {
        owner: existing.owner.toBase58(),
        lamports: existing.lamports,
        dataLength: existing.data.length
      },
      envOrDb: {
        cnftAssetId: cnftAsset,
        treeAddress: merkleTree,
        leafIndex,
        vehicleRecordPda: vehicleRecord.toBase58()
      }
    }, null, 2));
    return;
  }

  const ix = await program.methods
    .registerVehicleRecord(Array.from(vinHash), hexToBytes32(vehicle.metadataHash), new PublicKey(cnftAsset), new PublicKey(merkleTree), leafIndex)
    .accounts({
      payer: payer.publicKey,
      enterpriseAuthority: new PublicKey(enterpriseAuthority),
      platformConfig,
      enterpriseRecord,
      initialOwner: new PublicKey(initialOwner),
      vehicleRecord,
      systemProgram: SystemProgram.programId
    })
    .instruction();
  const tx = new Transaction().add(ix);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection().getLatestBlockhash("confirmed")).blockhash;
  const simulation = await connection().simulateTransaction(tx);
  if (simulation.value.err) throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)} ${JSON.stringify(simulation.value.logs)}`);
  const signature = await sendAndConfirmTransaction(connection(), tx, [payer], { commitment: "confirmed" });
  console.log(JSON.stringify({
    ...summary,
    signature,
    envOrDb: {
      cnftAssetId: cnftAsset,
      treeAddress: merkleTree,
      leafIndex,
      vehicleRecordPda: vehicleRecord.toBase58()
    }
  }, null, 2));
}

void main();
