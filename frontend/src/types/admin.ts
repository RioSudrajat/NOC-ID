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
