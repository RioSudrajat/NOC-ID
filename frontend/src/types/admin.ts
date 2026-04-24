export type PlatformRole = "superadmin" | "admin" | "operator" | "workshop" | "driver";

export interface WalletEntry {
  wallet: string;
  role: PlatformRole;
  entityName: string;
  status: "active" | "suspended" | "pending";
  registeredAt: string;
  lastActive: string;
}

export interface PlatformConfig {
  platformFeePercent: number;       // protocol treasury fee (default 4%)
  fleetManagerFeePercent: number;   // fleet manager fee (default 3%)
  maintenanceFundPercent: number;   // maintenance fund (default 3%)
  flatFeeDailyIDR: number;          // default flat fee for rent (IDR)
  maxBatchMintSize: number;
  maintenanceThresholdsKm: number[];
  features: {
    aiInsights: boolean;
    copilot: boolean;
    walletPayments: boolean;
    depinCampaigns: boolean;
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
