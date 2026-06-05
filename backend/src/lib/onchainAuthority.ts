import * as anchor from "@coral-xyz/anchor";
import anchorDefault from "@coral-xyz/anchor";
import type { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

type OnchainTxResult = {
  signature: string;
  explorerUrl: string;
  slot?: number;
};

type MintCnftResult = OnchainTxResult & {
  assetId: string;
  treeAddress: string;
  leafIndex: number;
};

const PROGRAM_ID = new PublicKey(env.NOC_REGISTRY_PROGRAM_ID);
const CONFIRMATION = "confirmed" as const;
const METAPLEX_NAME_MAX_LENGTH = 32;

function workspaceFile(pathFromRoot: string) {
  const candidates = [
    resolve(process.cwd(), pathFromRoot),
    resolve(process.cwd(), "..", pathFromRoot),
    resolve(process.cwd(), "..", "..", pathFromRoot),
  ];
  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error(`File not found from workspace: ${pathFromRoot}`);
  }
  return match;
}

function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${env.SOLANA_CLUSTER}`;
}

function sha256Bytes(value: string) {
  return createHash("sha256").update(value).digest();
}

function hexToBytes32(hex: string | null | undefined) {
  const normalized = hex && /^[0-9a-f]{64}$/i.test(hex) ? hex : "0".repeat(64);
  return Array.from(Buffer.from(normalized, "hex"));
}

function pda(seeds: Array<Buffer | Uint8Array | string>, programId = PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    seeds.map((seed) => typeof seed === "string" ? Buffer.from(seed) : Buffer.from(seed)),
    programId
  )[0];
}

function validPublicKey(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

function truncateMetaplexName(name: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  if (normalized.length <= METAPLEX_NAME_MAX_LENGTH) return normalized;
  return normalized.slice(0, METAPLEX_NAME_MAX_LENGTH).trimEnd();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryTransactionRead<T>(reader: () => Promise<T>, label: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      return await reader();
    } catch (error) {
      lastError = error;
      await sleep(Math.min(500 * attempt, 3000));
    }
  }
  throw new Error(`${label} masih belum tersedia di RPC setelah retry. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function requireOperatorAuthority(label: string, storedAuthority: string | null | undefined, operator: PublicKey) {
  const parsed = validPublicKey(storedAuthority);
  if (!parsed) return operator;
  if (!parsed.equals(operator)) {
    throw new Error(`${label} authority ${parsed.toBase58()} belum bisa ditandatangani backend. Untuk devnet on-chain mode, set authority wallet ke DEVNET_KEYPAIR_PATH (${operator.toBase58()}) atau kirim real client-signed transaction.`);
  }
  return parsed;
}

export function getConnection() {
  return new Connection(env.SOLANA_RPC_URL, CONFIRMATION);
}

export async function readOperatorKeypair() {
  if (!env.DEVNET_KEYPAIR_PATH) {
    throw new Error("DEVNET_KEYPAIR_PATH wajib diisi untuk real on-chain authorization.");
  }
  const parsed = JSON.parse(await readFile(env.DEVNET_KEYPAIR_PATH, "utf8")) as number[];
  return Keypair.fromSecretKey(new Uint8Array(parsed));
}

async function getAnchorProgram(operator: Keypair) {
  const idl = JSON.parse(await readFile(workspaceFile(join("idl", "noc_registry.json")), "utf8")) as anchor.Idl;
  const provider = new anchor.AnchorProvider(getConnection(), new anchor.Wallet(operator), { commitment: CONFIRMATION });
  return new anchor.Program(idl, provider);
}

async function assertProgramDeployed() {
  const account = await getConnection().getAccountInfo(PROGRAM_ID, CONFIRMATION);
  if (!account?.executable) {
    throw new Error(`NOC Registry program belum deployed di ${env.SOLANA_CLUSTER}: ${PROGRAM_ID.toBase58()}`);
  }
}

async function recordReceipt(signature: string, programId: string, raw: Prisma.InputJsonValue): Promise<OnchainTxResult> {
  const connection = getConnection();
  const tx = await connection.getTransaction(signature, {
    commitment: CONFIRMATION,
    maxSupportedTransactionVersion: 0,
  }).catch(() => null);
  await prisma.txReceipt.upsert({
    where: { signature },
    update: {
      programId,
      slot: tx?.slot ? BigInt(tx.slot) : undefined,
      confirmationStatus: "CONFIRMED",
      raw,
    },
    create: {
      signature,
      cluster: env.SOLANA_CLUSTER,
      programId,
      slot: tx?.slot ? BigInt(tx.slot) : undefined,
      confirmationStatus: "CONFIRMED",
      explorerUrl: explorerUrl(signature),
      raw,
    },
  });
  return { signature, explorerUrl: explorerUrl(signature), slot: tx?.slot };
}

async function sendAnchorTransaction(tx: Transaction, operator: Keypair, raw: Prisma.InputJsonValue) {
  await assertProgramDeployed();
  const connection = getConnection();
  tx.feePayer = operator.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash(CONFIRMATION)).blockhash;
  const simulation = await connection.simulateTransaction(tx);
  if (simulation.value.err) {
    throw new Error(`Anchor simulation failed: ${JSON.stringify(simulation.value.err)} ${JSON.stringify(simulation.value.logs)}`);
  }
  const signature = await sendAndConfirmTransaction(connection, tx, [operator], { commitment: CONFIRMATION });
  return recordReceipt(signature, PROGRAM_ID.toBase58(), raw);
}

export async function ensureEnterpriseRecord(input: {
  enterpriseId: string;
  authorityWallet?: string | null;
  metadataHash?: string | null;
}) {
  const operator = await readOperatorKeypair();
  const authority = requireOperatorAuthority("Enterprise", input.authorityWallet, operator.publicKey);
  const enterpriseHash = sha256Bytes(input.enterpriseId);
  const platformConfig = pda(["platform"]);
  const enterpriseRecord = pda(["enterprise", enterpriseHash]);
  const existing = await getConnection().getAccountInfo(enterpriseRecord, CONFIRMATION);
  if (existing) {
    return { recordPda: enterpriseRecord.toBase58(), authorityWallet: authority.toBase58(), signature: null };
  }
  const program = await getAnchorProgram(operator);
  const ix = await program.methods
    .registerEnterprise(Array.from(enterpriseHash), hexToBytes32(input.metadataHash))
    .accounts({
      payer: operator.publicKey,
      superadmin: operator.publicKey,
      platformConfig,
      enterpriseAuthority: authority,
      enterpriseRecord,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const result = await sendAnchorTransaction(new Transaction().add(ix), operator, {
    action: "register_enterprise",
    enterpriseId: input.enterpriseId,
    enterpriseRecord: enterpriseRecord.toBase58(),
    authorityWallet: authority.toBase58(),
  });
  return { recordPda: enterpriseRecord.toBase58(), authorityWallet: authority.toBase58(), signature: result.signature };
}

export async function ensureWorkshopSignerCredential(input: {
  workshopId: string;
  authorityWallet?: string | null;
  metadataHash?: string | null;
}) {
  const operator = await readOperatorKeypair();
  const authority = validPublicKey(input.authorityWallet) ?? operator.publicKey;
  const workshopHash = sha256Bytes(input.workshopId);
  const platformConfig = pda(["platform"]);
  const workshopRecord = pda(["workshop", workshopHash]);
  const credentialRecord = pda(["credential", workshopRecord.toBuffer(), Buffer.from([0])]);
  const program = await getAnchorProgram(operator);
  const tx = new Transaction();
  const existingWorkshop = await getConnection().getAccountInfo(workshopRecord, CONFIRMATION);
  if (!existingWorkshop) {
    tx.add(await program.methods
      .registerWorkshop(Array.from(workshopHash), hexToBytes32(input.metadataHash))
      .accounts({
        payer: operator.publicKey,
        superadmin: operator.publicKey,
        platformConfig,
        workshopAuthority: authority,
        workshopRecord,
        systemProgram: SystemProgram.programId,
      })
      .instruction());
  }
  const existingCredential = await getConnection().getAccountInfo(credentialRecord, CONFIRMATION);
  if (!existingCredential) {
    tx.add(await program.methods
      .approveWorkshop()
      .accounts({
        superadmin: operator.publicKey,
        platformConfig,
        workshopRecord,
      })
      .instruction());
    tx.add(await program.methods
      .grantCredential({ verifiedSigner: {} }, new anchorDefault.BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60))
      .accounts({
        payer: operator.publicKey,
        issuer: operator.publicKey,
        platformConfig,
        workshopRecord,
        credentialRecord,
        systemProgram: SystemProgram.programId,
      })
      .instruction());
  }
  let signature: string | null = null;
  if (tx.instructions.length) {
    const result = await sendAnchorTransaction(tx, operator, {
      action: "ensure_workshop_verified_signer",
      workshopId: input.workshopId,
      workshopRecord: workshopRecord.toBase58(),
      credentialRecord: credentialRecord.toBase58(),
    });
    signature = result.signature;
  }
  return {
    workshopRecordPda: workshopRecord.toBase58(),
    credentialRecordPda: credentialRecord.toBase58(),
    authorityWallet: authority.toBase58(),
    signature,
  };
}

export async function ensureWorkshopOemCredential(input: {
  workshopId: string;
  authorityWallet?: string | null;
  metadataHash?: string | null;
}) {
  const workshop = await ensureWorkshopSignerCredential(input);
  const operator = await readOperatorKeypair();
  const platformConfig = pda(["platform"]);
  const workshopRecord = new PublicKey(workshop.workshopRecordPda);
  const credentialRecord = pda(["credential", workshopRecord.toBuffer(), Buffer.from([1])]);
  const existingCredential = await getConnection().getAccountInfo(credentialRecord, CONFIRMATION);
  if (existingCredential) {
    return {
      workshopRecordPda: workshop.workshopRecordPda,
      credentialRecordPda: credentialRecord.toBase58(),
      authorityWallet: workshop.authorityWallet,
      signature: null,
    };
  }

  const program = await getAnchorProgram(operator);
  const ix = await program.methods
    .grantCredential({ oemCertified: {} }, new anchorDefault.BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60))
    .accounts({
      payer: operator.publicKey,
      issuer: operator.publicKey,
      platformConfig,
      workshopRecord,
      credentialRecord,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const result = await sendAnchorTransaction(new Transaction().add(ix), operator, {
    action: "ensure_workshop_oem_certified",
    workshopId: input.workshopId,
    workshopRecord: workshop.workshopRecordPda,
    credentialRecord: credentialRecord.toBase58(),
  });
  return {
    workshopRecordPda: workshop.workshopRecordPda,
    credentialRecordPda: credentialRecord.toBase58(),
    authorityWallet: workshop.authorityWallet,
    signature: result.signature,
  };
}

export async function mintVehicleCnft(input: {
  leafOwner?: string | null;
  name: string;
  uri: string;
}) {
  if (!env.BUBBLEGUM_TREE_ADDRESS) {
    throw new Error("BUBBLEGUM_TREE_ADDRESS wajib diisi untuk real cNFT mint.");
  }
  const operator = await readOperatorKeypair();
  const owner = requireOperatorAuthority("Vehicle mint leaf owner", input.leafOwner, operator.publicKey);
  const [{ createUmi }, { mintV2, mplBubblegum, parseLeafFromMintV2Transaction }, { keypairIdentity, publicKey, some }, { base58 }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/mpl-bubblegum"),
    import("@metaplex-foundation/umi"),
    import("@metaplex-foundation/umi/serializers"),
  ]);
  const umi = createUmi(env.SOLANA_RPC_URL).use(mplBubblegum());
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(operator.secretKey)));
  const collection = env.METAPLEX_CORE_COLLECTION_ADDRESS ? publicKey(env.METAPLEX_CORE_COLLECTION_ADDRESS) : undefined;
  const result = await mintV2(umi, {
    collectionAuthority: collection ? umi.identity : undefined,
    leafOwner: publicKey(owner.toBase58()),
    merkleTree: publicKey(env.BUBBLEGUM_TREE_ADDRESS),
    coreCollection: collection,
    metadata: {
      name: truncateMetaplexName(input.name),
      uri: input.uri,
      sellerFeeBasisPoints: 0,
      collection: collection ? some(collection) : null,
      creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }],
    },
  }).sendAndConfirm(umi);
  const signature = base58.deserialize(result.signature)[0] as string;
  const leaf = await retryTransactionRead(
    () => parseLeafFromMintV2Transaction(umi, result.signature),
    `Mint transaction ${signature}`
  );
  await recordReceipt(signature, "mpl-bubblegum", {
    action: "mint_vehicle_cnft",
    assetId: leaf.id,
    merkleTree: env.BUBBLEGUM_TREE_ADDRESS,
  } as Prisma.InputJsonValue);
  return {
    signature,
    explorerUrl: explorerUrl(signature),
    assetId: String(leaf.id),
    treeAddress: env.BUBBLEGUM_TREE_ADDRESS,
    leafIndex: Number(leaf.nonce),
  } satisfies MintCnftResult;
}

export async function registerVehicleRecordOnchain(input: {
  enterpriseId: string;
  enterpriseAuthorityWallet?: string | null;
  enterpriseMetadataHash?: string | null;
  vehicleId: string;
  vin: string;
  metadataHash?: string | null;
  cnftAssetId: string;
  treeAddress: string;
  leafIndex: number;
}) {
  const operator = await readOperatorKeypair();
  const authority = requireOperatorAuthority("Enterprise", input.enterpriseAuthorityWallet, operator.publicKey);
  const enterprise = await ensureEnterpriseRecord({
    enterpriseId: input.enterpriseId,
    authorityWallet: authority.toBase58(),
    metadataHash: input.enterpriseMetadataHash,
  });
  const vinHash = sha256Bytes(input.vin);
  const platformConfig = pda(["platform"]);
  const enterpriseRecord = new PublicKey(enterprise.recordPda);
  const vehicleRecord = pda(["vehicle", vinHash]);
  const existing = await getConnection().getAccountInfo(vehicleRecord, CONFIRMATION);
  if (existing) {
    return { recordPda: vehicleRecord.toBase58(), signature: null, skipped: true };
  }
  const program = await getAnchorProgram(operator);
  const ix = await program.methods
    .registerVehicleRecord(
      Array.from(vinHash),
      hexToBytes32(input.metadataHash),
      new PublicKey(input.cnftAssetId),
      new PublicKey(input.treeAddress),
      input.leafIndex,
    )
    .accounts({
      payer: operator.publicKey,
      enterpriseAuthority: authority,
      platformConfig,
      enterpriseRecord,
      initialOwner: authority,
      vehicleRecord,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const result = await sendAnchorTransaction(new Transaction().add(ix), operator, {
    action: "register_vehicle_record",
    vehicleId: input.vehicleId,
    vin: input.vin,
    vehicleRecord: vehicleRecord.toBase58(),
    cnftAssetId: input.cnftAssetId,
  });
  return { recordPda: vehicleRecord.toBase58(), signature: result.signature, skipped: false };
}

export async function transferVehicleOnchain(input: {
  vehicleId: string;
  enterpriseId: string;
  enterpriseAuthorityWallet?: string | null;
  cnftAssetId: string;
  treeAddress: string;
  vehicleRecordPda: string;
  newOwnerWallet: string;
}) {
  if (!env.SOLANA_DAS_RPC_URL) {
    throw new Error("SOLANA_DAS_RPC_URL wajib diisi untuk real cNFT transfer. RPC biasa tidak punya getAssetProof.");
  }
  const operator = await readOperatorKeypair();
  const authority = requireOperatorAuthority("Enterprise", input.enterpriseAuthorityWallet, operator.publicKey);
  const [{ createUmi }, { dasApi }, { getAssetWithProof, mplBubblegum, transferV2 }, { keypairIdentity, publicKey }, { base58 }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/digital-asset-standard-api"),
    import("@metaplex-foundation/mpl-bubblegum"),
    import("@metaplex-foundation/umi"),
    import("@metaplex-foundation/umi/serializers"),
  ]);
  const umi = createUmi(env.SOLANA_DAS_RPC_URL).use(mplBubblegum()).use(dasApi());
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(operator.secretKey)));
  const asset = await getAssetWithProof(umi as any, publicKey(input.cnftAssetId), { truncateCanopy: true });
  if (String(asset.leafOwner) !== authority.toBase58() && String(asset.leafDelegate) !== authority.toBase58()) {
    throw new Error(`cNFT owner/delegate ${asset.leafOwner} bukan enterprise authority ${authority.toBase58()}; transfer on-chain ditolak.`);
  }
  const transferResult = await transferV2(umi, {
    authority: umi.identity,
    leafOwner: asset.leafOwner,
    leafDelegate: asset.leafDelegate,
    newLeafOwner: publicKey(input.newOwnerWallet),
    merkleTree: asset.merkleTree,
    coreCollection: env.METAPLEX_CORE_COLLECTION_ADDRESS ? publicKey(env.METAPLEX_CORE_COLLECTION_ADDRESS) : undefined,
    root: asset.root,
    dataHash: asset.dataHash,
    creatorHash: asset.creatorHash,
    assetDataHash: asset.asset_data_hash,
    flags: asset.flags,
    nonce: asset.nonce,
    index: asset.index,
    proof: asset.proof,
  }).sendAndConfirm(umi);
  const cnftTransferSignature = base58.deserialize(transferResult.signature)[0] as string;
  await recordReceipt(cnftTransferSignature, "mpl-bubblegum", {
    action: "transfer_vehicle_cnft",
    vehicleId: input.vehicleId,
    assetId: input.cnftAssetId,
    newOwnerWallet: input.newOwnerWallet,
  } as Prisma.InputJsonValue);

  const platformConfig = pda(["platform"]);
  const enterpriseRecord = pda(["enterprise", sha256Bytes(input.enterpriseId)]);
  const vehicleRecord = new PublicKey(input.vehicleRecordPda);
  const program = await getAnchorProgram(operator);
  const ix = await program.methods
    .markVehicleTransferred(new PublicKey(input.newOwnerWallet))
    .accounts({
      enterpriseAuthority: authority,
      platformConfig,
      enterpriseRecord,
      vehicleRecord,
    })
    .instruction();
  const registry = await sendAnchorTransaction(new Transaction().add(ix), operator, {
    action: "mark_vehicle_transferred",
    vehicleId: input.vehicleId,
    vehicleRecord: input.vehicleRecordPda,
    newOwnerWallet: input.newOwnerWallet,
    cnftTransferSignature,
  });
  return {
    cnftTransferSignature,
    registrySignature: registry.signature,
    signature: registry.signature,
    explorerUrl: registry.explorerUrl,
  };
}

export async function anchorServiceLogOnchain(input: {
  serviceLogId: string;
  vehicleId: string;
  workshopId: string;
  workshopAuthorityWallet?: string | null;
  workshopMetadataHash?: string | null;
  vehicleRecordPda: string;
  odometerKm: number;
  invoiceHash: string;
  partsHash: string;
  evidenceHash?: string | null;
}) {
  const operator = await readOperatorKeypair();
  const authority = requireOperatorAuthority("Workshop", input.workshopAuthorityWallet, operator.publicKey);
  const workshop = await ensureWorkshopSignerCredential({
    workshopId: input.workshopId,
    authorityWallet: authority.toBase58(),
    metadataHash: input.workshopMetadataHash,
  });
  const serviceHash = sha256Bytes(input.serviceLogId);
  const platformConfig = pda(["platform"]);
  const vehicleRecord = new PublicKey(input.vehicleRecordPda);
  const workshopRecord = new PublicKey(workshop.workshopRecordPda);
  const credentialRecord = new PublicKey(workshop.credentialRecordPda);
  const serviceLogRecord = pda(["service-log", vehicleRecord.toBuffer(), serviceHash]);
  const existing = await getConnection().getAccountInfo(serviceLogRecord, CONFIRMATION);
  if (existing) {
    return {
      recordPda: serviceLogRecord.toBase58(),
      workshopRecordPda: workshop.workshopRecordPda,
      credentialRecordPda: workshop.credentialRecordPda,
      signature: null,
      explorerUrl: null,
      skipped: true
    };
  }
  const program = await getAnchorProgram(operator);
  const ix = await program.methods
    .anchorServiceLog(
      Array.from(serviceHash),
      input.odometerKm,
      hexToBytes32(input.invoiceHash),
      hexToBytes32(input.partsHash),
      hexToBytes32(input.evidenceHash),
    )
    .accounts({
      payer: operator.publicKey,
      workshopAuthority: authority,
      platformConfig,
      vehicleRecord,
      workshopRecord,
      credentialRecord,
      serviceLogRecord,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const result = await sendAnchorTransaction(new Transaction().add(ix), operator, {
    action: "anchor_service_log",
    serviceLogId: input.serviceLogId,
    vehicleId: input.vehicleId,
    workshopId: input.workshopId,
    serviceLogRecord: serviceLogRecord.toBase58(),
  });
  return {
    recordPda: serviceLogRecord.toBase58(),
    workshopRecordPda: workshop.workshopRecordPda,
    credentialRecordPda: workshop.credentialRecordPda,
    signature: result.signature,
    explorerUrl: result.explorerUrl,
    skipped: false
  };
}
