import { createHash } from "node:crypto";

type AccountMeta = {
  name: string;
  pubkey: string | null;
  isSigner: boolean;
  isWritable: boolean;
  source: "db" | "env" | "derived_later" | "system";
};

export type AnchorTransactionPlan = {
  programId: string;
  instruction: string;
  discriminatorHex: string;
  instructionDataBase64: string;
  accounts: AccountMeta[];
  missingAccounts: string[];
  signerSummary: string[];
  pdaSeeds: Record<string, string[]>;
  serializedTransactionBase64: null;
  buildStatus: "ready_for_client_assembly" | "missing_deployed_accounts";
};

function discriminator(name: string) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function hex32(value: string | null | undefined) {
  const normalized = value ?? "0".repeat(64);
  if (!/^[0-9a-f]{64}$/i.test(normalized)) {
    throw new Error("Expected a 32-byte hex hash.");
  }
  return Buffer.from(normalized, "hex");
}

function u32(value: number) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value, 0);
  return bytes;
}

function u64(value: bigint) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(value, 0);
  return bytes;
}

function account(name: string, pubkey: string | null | undefined, isSigner: boolean, isWritable: boolean, source: AccountMeta["source"]): AccountMeta {
  return { name, pubkey: pubkey ?? null, isSigner, isWritable, source };
}

function missing(accounts: AccountMeta[]) {
  return accounts.filter((item) => !item.pubkey).map((item) => item.name);
}

export function buildAnchorServiceLogPlan(input: {
  programId: string;
  payer: string | null | undefined;
  workshopAuthority: string | null | undefined;
  vehicleRecordPda: string | null | undefined;
  workshopRecordPda: string | null | undefined;
  credentialRecordPda: string | null | undefined;
  serviceLogRecordPda: string | null | undefined;
  serviceIdHash: string;
  odometerKm: number;
  invoiceHash: string;
  partsHash: string;
  evidenceHash?: string | null;
}) {
  const instruction = "anchor_service_log";
  const args = Buffer.concat([
    hex32(input.serviceIdHash),
    u32(input.odometerKm),
    hex32(input.invoiceHash),
    hex32(input.partsHash),
    hex32(input.evidenceHash)
  ]);
  const instructionData = Buffer.concat([discriminator(instruction), args]);
  const accounts = [
    account("payer", input.payer, true, true, "db"),
    account("workshop_authority", input.workshopAuthority, true, false, "db"),
    account("platform_config", null, false, false, "derived_later"),
    account("vehicle_record", input.vehicleRecordPda, false, true, "db"),
    account("workshop_record", input.workshopRecordPda, false, false, "db"),
    account("credential_record", input.credentialRecordPda, false, false, "db"),
    account("service_log_record", input.serviceLogRecordPda, false, true, "derived_later"),
    account("system_program", "11111111111111111111111111111111", false, false, "system")
  ];
  const missingAccounts = missing(accounts);
  return {
    programId: input.programId,
    instruction,
    discriminatorHex: discriminator(instruction).toString("hex"),
    instructionDataBase64: instructionData.toString("base64"),
    accounts,
    missingAccounts,
    signerSummary: ["payer pays rent/fees", "workshop_authority signs verified service log"],
    pdaSeeds: {
      platform_config: ["platform"],
      service_log_record: ["service-log", "vehicle_record", input.serviceIdHash]
    },
    serializedTransactionBase64: null,
    buildStatus: missingAccounts.length ? "missing_deployed_accounts" : "ready_for_client_assembly"
  } satisfies AnchorTransactionPlan;
}

export function buildPaymentReceiptPlan(input: {
  programId: string;
  payer: string | null | undefined;
  paymentPayer: string | null | undefined;
  recipient: string | null | undefined;
  vehicleRecordPda: string | null | undefined;
  paymentReceiptRecordPda: string | null | undefined;
  paymentIdHash: string;
  invoiceHash: string;
  mint: string | null | undefined;
  amountAtomic: bigint;
}) {
  const instruction = "record_payment_receipt";
  const args = Buffer.concat([
    hex32(input.paymentIdHash),
    hex32(input.invoiceHash),
    Buffer.alloc(32),
    u64(input.amountAtomic)
  ]);
  const instructionData = Buffer.concat([discriminator(instruction), args]);
  const accounts = [
    account("payer", input.payer, true, true, "db"),
    account("payment_payer", input.paymentPayer, false, false, "db"),
    account("recipient", input.recipient, false, false, "db"),
    account("platform_config", null, false, false, "derived_later"),
    account("vehicle_record", input.vehicleRecordPda, false, false, "db"),
    account("payment_receipt_record", input.paymentReceiptRecordPda, false, true, "derived_later"),
    account("system_program", "11111111111111111111111111111111", false, false, "system")
  ];
  const missingAccounts = missing(accounts);
  return {
    programId: input.programId,
    instruction,
    discriminatorHex: discriminator(instruction).toString("hex"),
    instructionDataBase64: instructionData.toString("base64"),
    accounts,
    missingAccounts,
    signerSummary: ["payer creates receipt PDA", "payment transfer signature is verified before this anchor"],
    pdaSeeds: {
      platform_config: ["platform"],
      payment_receipt_record: ["payment", "vehicle_record", input.paymentIdHash]
    },
    serializedTransactionBase64: null,
    buildStatus: missingAccounts.length ? "missing_deployed_accounts" : "ready_for_client_assembly"
  } satisfies AnchorTransactionPlan;
}
