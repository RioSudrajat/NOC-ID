export const NOC_REGISTRY_PROGRAM_ID = "Fg6PaFpoGXkYsidMpWxTWqgkVtyhLH2btfBhfJdwyoSQ";

export const NOC_REGISTRY_INSTRUCTIONS = [
  "initialize_platform",
  "set_platform_config",
  "register_enterprise",
  "register_workshop",
  "approve_workshop",
  "grant_credential",
  "revoke_credential",
  "register_vehicle_record",
  "mark_vehicle_transferred",
  "claim_vehicle",
  "anchor_service_log",
  "anchor_trip_summary",
  "anchor_case_event",
  "record_payment_receipt"
] as const;

export type NocRegistryInstruction = (typeof NOC_REGISTRY_INSTRUCTIONS)[number];
export type CredentialKind = "verified_signer" | "oem_certified" | "manufacturer_audit_partner" | "recall_executor";
export type CaseKind = "warranty" | "dispute" | "recall";

export interface TransactionSummary {
  instruction: NocRegistryInstruction;
  cluster: "localnet" | "devnet";
  feePayer: string;
  signerRole: "admin" | "enterprise" | "workshop" | "owner" | "payer";
  affectedVehicle?: string;
  amountAtomic?: string;
  mint?: string;
}

export function makeTransactionSummary(summary: TransactionSummary) {
  return summary;
}
