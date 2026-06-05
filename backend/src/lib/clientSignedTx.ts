import { createHash } from "node:crypto";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { env } from "../config/env.js";
import { getConnection } from "./onchainAuthority.js";

const PROGRAM_ID = new PublicKey(env.NOC_REGISTRY_PROGRAM_ID);
const COMPUTE_UNIT_LIMIT = 200_000;
const COMPUTE_UNIT_PRICE_MICROLAMPORTS = 375_000;
const EXPECTED_NETWORK_FEE_LAMPORTS = 80_000;

export function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${env.SOLANA_CLUSTER}`;
}

export function sha256Bytes(value: string) {
  return createHash("sha256").update(value).digest();
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function pda(seeds: Array<Buffer | Uint8Array | string>, programId = PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    seeds.map((seed) => typeof seed === "string" ? Buffer.from(seed) : Buffer.from(seed)),
    programId
  )[0];
}

function discriminator(name: string) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function withBudget(tx: Transaction) {
  tx.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: COMPUTE_UNIT_PRICE_MICROLAMPORTS }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT })
  );
  return tx;
}

function hexToBytes32(hex: string | null | undefined) {
  const normalized = hex && /^[0-9a-f]{64}$/i.test(hex) ? hex : "0".repeat(64);
  return Buffer.from(normalized, "hex");
}

function u32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value, 0);
  return buffer;
}

function u16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function i64(value: number) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64LE(BigInt(value), 0);
  return buffer;
}

async function serializeUnsigned(tx: Transaction, feePayer: PublicKey) {
  const connection = getConnection();
  tx.feePayer = feePayer;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
}

export async function estimateLegacyTransactionBase64(transactionBase64: string) {
  const connection = getConnection();
  const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
  const fee = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");
  const networkFeeLamports = fee.value ?? 0;
  const normalizedFeeLamports = Math.max(networkFeeLamports, EXPECTED_NETWORK_FEE_LAMPORTS);
  return {
    networkFeeLamports: normalizedFeeLamports,
    networkFeeSol: normalizedFeeLamports / 1_000_000_000,
    rpcNetworkFeeLamports: networkFeeLamports,
  };
}

export async function estimateRentExemption(dataSize: number) {
  const rentLamports = await getConnection().getMinimumBalanceForRentExemption(dataSize, "confirmed");
  return {
    dataSize,
    rentLamports,
    rentSol: rentLamports / 1_000_000_000,
  };
}

export async function buildMarkVehicleTransferredTx(input: {
  enterpriseAuthorityWallet: string;
  enterpriseId: string;
  vehicleRecordPda: string;
  newOwnerWallet: string;
}) {
  const enterpriseAuthority = new PublicKey(input.enterpriseAuthorityWallet);
  const enterpriseRecord = pda(["enterprise", sha256Bytes(input.enterpriseId)]);
  const data = Buffer.concat([
    discriminator("mark_vehicle_transferred"),
    new PublicKey(input.newOwnerWallet).toBuffer(),
  ]);
  const tx = withBudget(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: enterpriseAuthority, isSigner: true, isWritable: false },
      { pubkey: pda(["platform"]), isSigner: false, isWritable: false },
      { pubkey: enterpriseRecord, isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.vehicleRecordPda), isSigner: false, isWritable: true },
    ],
    data,
  })));
  return {
    transactionBase64: await serializeUnsigned(tx, enterpriseAuthority),
    accounts: {
      programId: PROGRAM_ID.toBase58(),
      enterpriseAuthority: enterpriseAuthority.toBase58(),
      enterpriseRecord: enterpriseRecord.toBase58(),
      vehicleRecord: input.vehicleRecordPda,
    },
  };
}

export async function buildAnchorServiceLogTx(input: {
  payerWallet: string;
  workshopAuthorityWallet: string;
  vehicleRecordPda: string;
  workshopRecordPda: string;
  credentialRecordPda: string;
  serviceLogRecordPda: string;
  serviceLogId: string;
  odometerKm: number;
  invoiceHash: string;
  partsHash: string;
  evidenceHash?: string | null;
}) {
  const payer = new PublicKey(input.payerWallet);
  const serviceHash = sha256Bytes(input.serviceLogId);
  const data = Buffer.concat([
    discriminator("anchor_service_log"),
    serviceHash,
    u32(input.odometerKm),
    hexToBytes32(input.invoiceHash),
    hexToBytes32(input.partsHash),
    hexToBytes32(input.evidenceHash),
  ]);
  const tx = withBudget(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(input.workshopAuthorityWallet), isSigner: true, isWritable: false },
      { pubkey: pda(["platform"]), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.vehicleRecordPda), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(input.workshopRecordPda), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.credentialRecordPda), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.serviceLogRecordPda), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  })));
  return {
    transactionBase64: await serializeUnsigned(tx, payer),
    serviceIdHash: serviceHash.toString("hex"),
  };
}

export async function buildVerifyComponentOriginTx(input: {
  payerWallet: string;
  workshopAuthorityWallet: string;
  vehicleRecordPda: string;
  workshopRecordPda: string;
  credentialRecordPda: string;
  componentOriginRecordPda: string;
  serviceLogId: string;
  invoiceHash: string;
  partsHash: string;
  catalogHash: string;
  verifiedPartCount: number;
}) {
  const payer = new PublicKey(input.payerWallet);
  const serviceHash = sha256Bytes(input.serviceLogId);
  const data = Buffer.concat([
    discriminator("verify_component_origin"),
    serviceHash,
    hexToBytes32(input.invoiceHash),
    hexToBytes32(input.partsHash),
    hexToBytes32(input.catalogHash),
    u16(input.verifiedPartCount),
  ]);
  const tx = withBudget(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(input.workshopAuthorityWallet), isSigner: true, isWritable: false },
      { pubkey: pda(["platform"]), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.vehicleRecordPda), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.workshopRecordPda), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.credentialRecordPda), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(input.componentOriginRecordPda), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  })));
  return {
    transactionBase64: await serializeUnsigned(tx, payer),
    serviceIdHash: serviceHash.toString("hex"),
  };
}

export const credentialIndex: Record<string, number> = {
  verified_signer: 0,
  oem_certified: 1,
  manufacturer_audit_partner: 2,
  recall_executor: 3,
};

export async function buildGrantCredentialTx(input: {
  issuerWallet: string;
  workshopRecordPda: string;
  credential: keyof typeof credentialIndex;
  validUntilUnix: number;
}) {
  const issuer = new PublicKey(input.issuerWallet);
  const workshopRecord = new PublicKey(input.workshopRecordPda);
  const index = credentialIndex[input.credential];
  if (index === undefined) throw new Error(`Unsupported credential: ${input.credential}`);
  const credentialRecord = pda(["credential", workshopRecord.toBuffer(), Buffer.from([index])]);
  const data = Buffer.concat([
    discriminator("grant_credential"),
    Buffer.from([index]),
    i64(input.validUntilUnix),
  ]);
  const tx = withBudget(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: issuer, isSigner: true, isWritable: true },
      { pubkey: issuer, isSigner: true, isWritable: false },
      { pubkey: pda(["platform"]), isSigner: false, isWritable: false },
      { pubkey: workshopRecord, isSigner: false, isWritable: true },
      { pubkey: credentialRecord, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  })));
  return {
    transactionBase64: await serializeUnsigned(tx, issuer),
    credentialRecordPda: credentialRecord.toBase58(),
  };
}
