import { create } from "zustand";
import { CREDENTIAL_PERMISSIONS } from "@/types/admin";
import { useUserStore } from "@/store/useUserStore";
import type {
  PlatformRole,
  WalletEntry,
  PlatformConfig,
  AuditLogEntry,
  DisputeEntry,
  WorkshopRegistrationData,
  WorkshopCredential,
  WorkshopCredentialRecord,
} from "@/types/admin";

/* ── Storage helpers ── */

const WALLETS_KEY = "noc-admin-wallets";
const CONFIG_KEY = "noc-admin-config";
const AUDIT_KEY = "noc-admin-audit";
const DISPUTES_KEY = "noc-admin-disputes";
const REGISTRATIONS_KEY = "noc-workshop-registrations-v1";
const CREDENTIALS_KEY = "noc-workshop-credentials-v1";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

/* ── Default data ── */

const defaultConfig: PlatformConfig = {
  platformFeePercent: 2.5,
  gasSubsidyPercent: 0,
  minServiceFee: 50000,
  maxServiceFee: 50000000,
  nocTokenRate: 52,
  usdcRate: 16000,
  maxBatchMintSize: 10000,
  qrExpirySeconds: 300,
  features: {
    aiInsights: true,
    digitalTwin: true,
    copilot: true,
    walletPayments: false,
  },
};

const seedWallets: WalletEntry[] = [
  { wallet: "NOC1...adm1", role: "superadmin", entityName: "NOC ID Core", status: "active", registeredAt: "2025-01-15", lastActive: "2026-03-27" },
  { wallet: "AST1...ent1", role: "enterprise", entityName: "PT Astra Manufacturing", status: "active", registeredAt: "2025-06-01", lastActive: "2026-03-26" },
  { wallet: "HND1...ws01", role: "workshop", entityName: "Bengkel Hendra Motor", status: "active", registeredAt: "2025-08-10", lastActive: "2026-03-27" },
  { wallet: "MJY1...ws02", role: "workshop", entityName: "Maju Jaya Motor", status: "active", registeredAt: "2025-09-15", lastActive: "2026-03-25" },
  { wallet: "EUR1...ws03", role: "workshop", entityName: "EuroHaus M Performance", status: "active", registeredAt: "2025-10-01", lastActive: "2026-03-27" },
  { wallet: "AHS1...ws04", role: "workshop", entityName: "Ahass Sejahtera Motor", status: "active", registeredAt: "2025-10-20", lastActive: "2026-03-24" },
  { wallet: "MAB1...ws05", role: "workshop", entityName: "Mabua Harley Custom", status: "active", registeredAt: "2025-11-05", lastActive: "2026-03-26" },
  { wallet: "JAB1...ws06", role: "workshop", entityName: "Bengkel Jaya Abadi", status: "pending", registeredAt: "2026-03-01", lastActive: "2026-03-20" },
  { wallet: "BUD1...usr1", role: "user", entityName: "Pak Budi", status: "active", registeredAt: "2025-12-01", lastActive: "2026-03-27" },
  { wallet: "AND1...usr2", role: "user", entityName: "Andi Wijaya", status: "active", registeredAt: "2026-01-10", lastActive: "2026-03-26" },
];

const seedAuditLogs: AuditLogEntry[] = [
  { id: "AL-001", timestamp: "2026-03-27T09:00:00Z", adminWallet: "NOC1...adm1", action: "kyc_approval", targetEntity: "Mabua Harley Custom", details: "Workshop KYC approved. On-chain credential issued." },
  { id: "AL-002", timestamp: "2026-03-25T14:30:00Z", adminWallet: "NOC1...adm1", action: "config_change", targetEntity: "Platform", details: "Platform fee updated from 2.0% to 2.5%." },
  { id: "AL-003", timestamp: "2026-03-20T10:15:00Z", adminWallet: "NOC1...adm1", action: "wallet_whitelist", targetEntity: "Bengkel Jaya Abadi", details: "New workshop wallet registered. KYC status: pending." },
  { id: "AL-004", timestamp: "2026-03-15T16:00:00Z", adminWallet: "NOC1...adm1", action: "enterprise_onboard", targetEntity: "PT Astra Manufacturing", details: "Enterprise account created. Plan: Enterprise Tier." },
];

const seedDisputes: DisputeEntry[] = [
  { id: "DSP-001", type: "service_quality", userWallet: "BUD1...usr1", workshopId: "ws-6", workshopName: "Bengkel Jaya Abadi", bookingId: "BK-001", amountIDR: 450000, status: "open", createdAt: "2026-03-25", resolvedAt: null, resolution: null, assignedAdmin: null },
  { id: "DSP-002", type: "part_authenticity", userWallet: "AND1...usr2", workshopId: "ws-2", workshopName: "Maju Jaya Motor", bookingId: "BK-002", amountIDR: 1200000, status: "investigating", createdAt: "2026-03-20", resolvedAt: null, resolution: null, assignedAdmin: "NOC1...adm1" },
  { id: "DSP-003", type: "payment", userWallet: "BUD1...usr1", workshopId: "ws-1", workshopName: "Bengkel Hendra Motor", bookingId: "BK-003", amountIDR: 300000, status: "resolved", createdAt: "2026-03-10", resolvedAt: "2026-03-12", resolution: "Partial refund Rp 150,000 issued to user.", assignedAdmin: "NOC1...adm1" },
];

const seedCredentials: WorkshopCredentialRecord[] = [
  {
    credentialId: "cred-ws-1-verified",
    workshopId: "ws-1",
    credential: "verified_signer",
    issuedBy: "platform",
    issuedAt: "2026-01-10T00:00:00.000Z",
  },
  {
    credentialId: "cred-ws-1-oem",
    workshopId: "ws-1",
    credential: "oem_certified",
    issuedBy: "ent-astra",
    grantedByEnterpriseId: "ent-astra",
    issuedAt: "2026-01-11T00:00:00.000Z",
  },
  {
    credentialId: "cred-ws-3-audit",
    workshopId: "ws-3",
    credential: "manufacturer_audit_partner",
    issuedBy: "ent-astra",
    grantedByEnterpriseId: "ent-astra",
    issuedAt: "2026-02-01T00:00:00.000Z",
  },
];

/* ── Store ── */

interface AdminState {
  whitelistedWallets: WalletEntry[];
  platformConfig: PlatformConfig;
  auditLogs: AuditLogEntry[];
  disputes: DisputeEntry[];
  pendingRegistrations: WorkshopRegistrationData[];
  credentials: WorkshopCredentialRecord[];
  hydrated: boolean;
}

interface AdminActions {
  hydrate: () => void;
  addWallet: (wallet: string, role: PlatformRole, entityName?: string) => void;
  removeWallet: (wallet: string) => void;
  updateRole: (wallet: string, newRole: PlatformRole) => void;
  suspendWallet: (wallet: string) => void;
  activateWallet: (wallet: string) => void;
  updateConfig: (updates: Partial<PlatformConfig>) => void;
  fileDispute: (dispute: Omit<DisputeEntry, "id" | "createdAt" | "resolvedAt" | "resolution" | "assignedAdmin">) => void;
  resolveDispute: (id: string, resolution: string) => void;
  submitRegistration: (data: WorkshopRegistrationData) => void;
  approveWorkshop: (workshopId: string, adminId: string) => void;
  rejectWorkshop: (workshopId: string, reason: string) => void;
  grantCredential: (workshopId: string, credential: WorkshopCredential, issuedBy: string, enterpriseId?: string) => void;
  revokeCredential: (credentialId: string, reason: string) => void;
  getWorkshopCredentials: (workshopId: string) => WorkshopCredentialRecord[];
  hasPermission: (workshopId: string, permission: string) => boolean;
}

export type AdminStore = AdminState & AdminActions;

function addAuditEntry(prev: AuditLogEntry[], action: string, targetEntity: string, details: string): AuditLogEntry[] {
  const entry: AuditLogEntry = {
    id: `AL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminWallet: "NOC1...adm1",
    action,
    targetEntity,
    details,
  };
  const next = [entry, ...prev];
  saveJSON(AUDIT_KEY, next);
  return next;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  whitelistedWallets: [],
  platformConfig: defaultConfig,
  auditLogs: [],
  disputes: [],
  pendingRegistrations: [],
  credentials: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({
      whitelistedWallets: loadJSON(WALLETS_KEY, seedWallets),
      platformConfig: loadJSON(CONFIG_KEY, defaultConfig),
      auditLogs: loadJSON(AUDIT_KEY, seedAuditLogs),
      disputes: loadJSON(DISPUTES_KEY, seedDisputes),
      pendingRegistrations: loadJSON(REGISTRATIONS_KEY, []),
      credentials: loadJSON(CREDENTIALS_KEY, seedCredentials),
      hydrated: true,
    });
  },

  addWallet: (wallet, role, entityName = "") => {
    set(state => {
      if (state.whitelistedWallets.some(w => w.wallet === wallet)) return state;
      const entry: WalletEntry = {
        wallet, role, entityName,
        status: role === "workshop" ? "pending" : "active",
        registeredAt: new Date().toISOString().split("T")[0],
        lastActive: new Date().toISOString().split("T")[0],
      };
      const whitelistedWallets = [entry, ...state.whitelistedWallets];
      const auditLogs = addAuditEntry(state.auditLogs, "wallet_whitelist", entityName || wallet, `Wallet ${wallet} registered as ${role}.`);
      saveJSON(WALLETS_KEY, whitelistedWallets);
      return { whitelistedWallets, auditLogs };
    });
  },

  removeWallet: (wallet) => {
    set(state => {
      const found = state.whitelistedWallets.find(w => w.wallet === wallet);
      const whitelistedWallets = state.whitelistedWallets.filter(w => w.wallet !== wallet);
      const auditLogs = found
        ? addAuditEntry(state.auditLogs, "wallet_remove", found.entityName || wallet, `Wallet ${wallet} removed.`)
        : state.auditLogs;
      saveJSON(WALLETS_KEY, whitelistedWallets);
      return { whitelistedWallets, auditLogs };
    });
  },

  updateRole: (wallet, newRole) => {
    set(state => {
      let auditLogs = state.auditLogs;
      const whitelistedWallets = state.whitelistedWallets.map(w => {
        if (w.wallet !== wallet) return w;
        auditLogs = addAuditEntry(auditLogs, "role_change", w.entityName || wallet, `Role changed from ${w.role} to ${newRole}.`);
        return { ...w, role: newRole };
      });
      saveJSON(WALLETS_KEY, whitelistedWallets);
      return { whitelistedWallets, auditLogs };
    });
  },

  suspendWallet: (wallet) => {
    set(state => {
      let auditLogs = state.auditLogs;
      const whitelistedWallets = state.whitelistedWallets.map(w => {
        if (w.wallet !== wallet) return w;
        auditLogs = addAuditEntry(auditLogs, "wallet_suspend", w.entityName || wallet, `Wallet ${wallet} suspended.`);
        return { ...w, status: "suspended" as const };
      });
      saveJSON(WALLETS_KEY, whitelistedWallets);
      return { whitelistedWallets, auditLogs };
    });
  },

  activateWallet: (wallet) => {
    set(state => {
      let auditLogs = state.auditLogs;
      const whitelistedWallets = state.whitelistedWallets.map(w => {
        if (w.wallet !== wallet) return w;
        auditLogs = addAuditEntry(auditLogs, "kyc_approval", w.entityName || wallet, `Wallet ${wallet} activated.`);
        return { ...w, status: "active" as const };
      });
      saveJSON(WALLETS_KEY, whitelistedWallets);
      return { whitelistedWallets, auditLogs };
    });
  },

  updateConfig: (updates) => {
    set(state => {
      const platformConfig = { ...state.platformConfig, ...updates };
      const auditLogs = addAuditEntry(state.auditLogs, "config_change", "Platform", `Config updated: ${Object.keys(updates).join(", ")}`);
      saveJSON(CONFIG_KEY, platformConfig);
      return { platformConfig, auditLogs };
    });
  },

  fileDispute: (dispute) => {
    set(state => {
      const entry: DisputeEntry = {
        ...dispute,
        id: `DSP-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        resolvedAt: null,
        resolution: null,
        assignedAdmin: null,
      };
      const disputes = [entry, ...state.disputes];
      const auditLogs = addAuditEntry(state.auditLogs, "dispute_filed", dispute.workshopName, `Dispute filed: ${dispute.type} — Rp ${dispute.amountIDR.toLocaleString("id-ID")}`);
      saveJSON(DISPUTES_KEY, disputes);
      return { disputes, auditLogs };
    });
  },

  resolveDispute: (id, resolution) => {
    set(state => {
      let auditLogs = state.auditLogs;
      const disputes = state.disputes.map(d => {
        if (d.id !== id) return d;
        auditLogs = addAuditEntry(auditLogs, "dispute_resolution", d.workshopName, `Dispute ${d.id} resolved: ${resolution}`);
        return { ...d, status: "resolved" as const, resolvedAt: new Date().toISOString().split("T")[0], resolution, assignedAdmin: "NOC1...adm1" };
      });
      saveJSON(DISPUTES_KEY, disputes);
      return { disputes, auditLogs };
    });
  },

  submitRegistration: (data) => {
    set(state => {
      const entry: WorkshopRegistrationData = {
        ...data,
        status: "pending_kyc",
        submittedAt: new Date().toISOString(),
        savedAt: Date.now(),
      };
      const pendingRegistrations = [
        entry,
        ...state.pendingRegistrations.filter(item => item.workshopId !== data.workshopId),
      ];
      const auditLogs = addAuditEntry(state.auditLogs, "workshop_registration", entry.businessName, "Workshop registration submitted for KYC.");
      saveJSON(REGISTRATIONS_KEY, pendingRegistrations);
      return { pendingRegistrations, auditLogs };
    });
  },

  approveWorkshop: (workshopId, adminId) => {
    set(state => {
      const pendingRegistrations = state.pendingRegistrations.map(item =>
        item.workshopId === workshopId
          ? { ...item, status: "approved" as const, reviewedAt: new Date().toISOString(), reviewedBy: adminId }
          : item,
      );
      const auditLogs = addAuditEntry(state.auditLogs, "kyc_approval", workshopId, "Workshop registration approved.");
      saveJSON(REGISTRATIONS_KEY, pendingRegistrations);
      const approved = pendingRegistrations.find(item => item.workshopId === workshopId);
      const user = useUserStore.getState().currentUser;
      if (approved?.submittedByUserId && user?.userId === approved.submittedByUserId) {
        useUserStore.getState().setWorkshopStatus("approved", workshopId);
      }
      return { pendingRegistrations, auditLogs };
    });
  },

  rejectWorkshop: (workshopId, reason) => {
    set(state => {
      const pendingRegistrations = state.pendingRegistrations.map(item =>
        item.workshopId === workshopId
          ? {
              ...item,
              status: "rejected" as const,
              reviewedAt: new Date().toISOString(),
              rejectionReason: reason,
            }
          : item,
      );
      const auditLogs = addAuditEntry(state.auditLogs, "kyc_rejection", workshopId, reason);
      saveJSON(REGISTRATIONS_KEY, pendingRegistrations);
      const rejected = pendingRegistrations.find(item => item.workshopId === workshopId);
      const user = useUserStore.getState().currentUser;
      if (rejected?.submittedByUserId && user?.userId === rejected.submittedByUserId) {
        useUserStore.getState().setWorkshopStatus("rejected", workshopId);
      }
      return { pendingRegistrations, auditLogs };
    });
  },

  grantCredential: (workshopId, credential, issuedBy, enterpriseId) => {
    set(state => {
      const record: WorkshopCredentialRecord = {
        credentialId: `cred-${workshopId}-${credential}-${Date.now()}`,
        workshopId,
        credential,
        issuedBy,
        grantedByEnterpriseId: enterpriseId,
        issuedAt: new Date().toISOString(),
      };
      const credentials = [record, ...state.credentials];
      const auditLogs = addAuditEntry(state.auditLogs, "credential_grant", workshopId, `Granted ${credential}.`);
      saveJSON(CREDENTIALS_KEY, credentials);
      return { credentials, auditLogs };
    });
  },

  revokeCredential: (credentialId, reason) => {
    set(state => {
      const credentials = state.credentials.map(item =>
        item.credentialId === credentialId
          ? { ...item, revokedAt: new Date().toISOString(), revocationReason: reason }
          : item,
      );
      const auditLogs = addAuditEntry(state.auditLogs, "credential_revoke", credentialId, reason);
      saveJSON(CREDENTIALS_KEY, credentials);
      return { credentials, auditLogs };
    });
  },

  getWorkshopCredentials: (workshopId) =>
    get().credentials.filter(item => item.workshopId === workshopId && !item.revokedAt),

  hasPermission: (workshopId, permission) =>
    get()
      .getWorkshopCredentials(workshopId)
      .some(item => CREDENTIAL_PERMISSIONS[item.credential].includes(permission)),
}));
