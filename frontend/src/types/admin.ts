export type PlatformRole = "superadmin" | "admin" | "enterprise" | "workshop" | "user";

export interface WalletEntry {
  wallet: string;
  role: PlatformRole;
  entityName: string;
  status: "active" | "suspended" | "pending";
  registeredAt: string;
  lastActive: string;
}

export interface PlatformConfig {
  platformFeePercent: number;
  gasSubsidyPercent: number;
  minServiceFee: number;
  maxServiceFee: number;
  nocTokenRate: number;
  usdcRate: number;
  maxBatchMintSize: number;
  qrExpirySeconds: number;
  features: {
    aiInsights: boolean;
    digitalTwin: boolean;
    copilot: boolean;
    walletPayments: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminWallet: string;
  action: string;
  targetEntity: string;
  details: string;
}

export interface DisputeEntry {
  id: string;
  type: "payment" | "service_quality" | "part_authenticity" | "warranty";
  userWallet: string;
  workshopId: string;
  workshopName: string;
  bookingId: string;
  amountIDR: number;
  status: "open" | "investigating" | "resolved" | "escalated";
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  assignedAdmin: string | null;
}

export type WorkshopStatus =
  | "unregistered"
  | "draft"
  | "pending_kyc"
  | "approved"
  | "rejected"
  | "suspended";

export interface WorkshopRegistrationData {
  workshopId: string;
  submittedByUserId?: string;
  submittedByUserName?: string;
  submittedByContact?: string;
  businessName: string;
  businessType: "cv" | "pt" | "perorangan";
  npwp?: string;
  nib?: string;
  address: string;
  city: string;
  province: string;
  coordinates: { lat: number; lng: number };
  operatingHours: { weekday: string; weekend: string };
  phone: string;
  picName: string;
  picRole: string;
  picPhone: string;
  picKtpNumber: string;
  picKtpFileRef?: string;
  siupFileRef?: string;
  npwpFileRef?: string;
  nibFileRef?: string;
  oemAuthLetterFileRef?: string;
  oemBrandClaims: string[];
  signerMode: "embedded" | "self";
  signerWalletAddress?: string;
  embeddedSignerAddress?: string;
  status: WorkshopStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  draftStep: 1 | 2 | 3 | 4 | 5;
  savedAt: number;
}

export type WorkshopCredential =
  | "verified_signer"
  | "oem_certified"
  | "manufacturer_audit_partner"
  | "recall_executor";

export interface WorkshopCredentialRecord {
  credentialId: string;
  workshopId: string;
  credential: WorkshopCredential;
  issuedBy: string;
  issuedAt: string;
  validUntil?: string;
  revokedAt?: string;
  revocationReason?: string;
  grantedByEnterpriseId?: string;
}

export const CREDENTIAL_PERMISSIONS: Record<WorkshopCredential, string[]> = {
  verified_signer: ["sign_service_log", "create_booking"],
  oem_certified: ["sign_service_log", "access_oem_catalog", "submit_warranty"],
  manufacturer_audit_partner: ["audit_vehicle", "submit_mint_request", "sign_service_log"],
  recall_executor: ["execute_recall", "handle_warranty", "sign_service_log"],
};
