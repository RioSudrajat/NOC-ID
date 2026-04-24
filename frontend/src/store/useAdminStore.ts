import { create } from "zustand";
import type {
  PlatformRole,
  WalletEntry,
  PlatformConfig,
  AuditLogEntry,
  DisputeEntry,
} from "@/types/admin";

/* ── Storage helpers ── */

const WALLETS_KEY = "noc-admin-wallets";
const CONFIG_KEY = "noc-admin-config";
const AUDIT_KEY = "noc-admin-audit";
const DISPUTES_KEY = "noc-admin-disputes";

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
  platformFeePercent: 4,
  fleetManagerFeePercent: 3,
  maintenanceFundPercent: 3,
  flatFeeDailyIDR: 50000,
  maxBatchMintSize: 10000,
  maintenanceThresholdsKm: [2500, 5000, 7500, 10000],
  features: {
    aiInsights: true,
    copilot: true,
    walletPayments: false,
    depinCampaigns: true,
  },
};

const seedWallets: WalletEntry[] = [
  { wallet: "NMS1...adm1", role: "superadmin", entityName: "Nemesis Core", status: "active", registeredAt: "2025-01-15", lastActive: "2026-04-23" },
  { wallet: "ELC1...op01", role: "operator", entityName: "PT Electrum Mobilitas Indonesia", status: "active", registeredAt: "2025-06-01", lastActive: "2026-04-23" },
  { wallet: "NMS1...op02", role: "operator", entityName: "Nemesis Native Fleet", status: "active", registeredAt: "2025-11-15", lastActive: "2026-04-24" },
  { wallet: "HND1...ws01", role: "workshop", entityName: "Bengkel Hendra Motor", status: "active", registeredAt: "2025-08-10", lastActive: "2026-04-24" },
  { wallet: "MJY1...ws02", role: "workshop", entityName: "Maju Jaya Motor", status: "active", registeredAt: "2025-09-15", lastActive: "2026-04-22" },
  { wallet: "AHS1...ws04", role: "workshop", entityName: "Ahass Sejahtera Motor", status: "active", registeredAt: "2025-10-20", lastActive: "2026-04-21" },
  { wallet: "JAB1...ws06", role: "workshop", entityName: "Bengkel Jaya Abadi", status: "pending", registeredAt: "2026-03-01", lastActive: "2026-04-15" },
  { wallet: "DRV1...dr01", role: "driver", entityName: "Budi Santoso", status: "active", registeredAt: "2026-02-01", lastActive: "2026-04-24" },
  { wallet: "DRV2...dr02", role: "driver", entityName: "Agus Prabowo", status: "active", registeredAt: "2026-02-12", lastActive: "2026-04-24" },
];

const seedAuditLogs: AuditLogEntry[] = [
  { id: "AL-001", timestamp: "2026-04-23T09:00:00Z", adminWallet: "NMS1...adm1", action: "kyc_approval", targetEntity: "Ahass Sejahtera Motor", details: "Workshop KYC approved. On-chain credential issued." },
  { id: "AL-002", timestamp: "2026-04-20T14:30:00Z", adminWallet: "NMS1...adm1", action: "config_change", targetEntity: "Platform", details: "Platform fee updated from 3.5% to 4%." },
  { id: "AL-003", timestamp: "2026-04-15T10:15:00Z", adminWallet: "NMS1...adm1", action: "wallet_whitelist", targetEntity: "Bengkel Jaya Abadi", details: "New workshop wallet registered. KYC status: pending." },
  { id: "AL-004", timestamp: "2026-04-10T16:00:00Z", adminWallet: "NMS1...adm1", action: "operator_onboard", targetEntity: "PT Electrum Mobilitas Indonesia", details: "Fleet operator onboarded. Type: verified partner." },
];

const seedDisputes: DisputeEntry[] = [
  { id: "DSP-001", type: "service_quality", userWallet: "DRV1...dr01", workshopId: "ws-6", workshopName: "Bengkel Jaya Abadi", bookingId: "BK-001", amountIDR: 450000, status: "open", createdAt: "2026-04-22", resolvedAt: null, resolution: null, assignedAdmin: null },
  { id: "DSP-002", type: "part_authenticity", userWallet: "DRV2...dr02", workshopId: "ws-2", workshopName: "Maju Jaya Motor", bookingId: "BK-002", amountIDR: 1200000, status: "investigating", createdAt: "2026-04-18", resolvedAt: null, resolution: null, assignedAdmin: "NMS1...adm1" },
  { id: "DSP-003", type: "payment", userWallet: "DRV1...dr01", workshopId: "ws-1", workshopName: "Bengkel Hendra Motor", bookingId: "BK-003", amountIDR: 300000, status: "resolved", createdAt: "2026-04-10", resolvedAt: "2026-04-12", resolution: "Partial refund Rp 150,000 issued.", assignedAdmin: "NMS1...adm1" },
];

/* ── Store ── */

interface AdminState {
  whitelistedWallets: WalletEntry[];
  platformConfig: PlatformConfig;
  auditLogs: AuditLogEntry[];
  disputes: DisputeEntry[];
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
}

export type AdminStore = AdminState & AdminActions;

function addAuditEntry(prev: AuditLogEntry[], action: string, targetEntity: string, details: string): AuditLogEntry[] {
  const entry: AuditLogEntry = {
    id: `AL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminWallet: "NMS1...adm1",
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
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({
      whitelistedWallets: loadJSON(WALLETS_KEY, seedWallets),
      platformConfig: loadJSON(CONFIG_KEY, defaultConfig),
      auditLogs: loadJSON(AUDIT_KEY, seedAuditLogs),
      disputes: loadJSON(DISPUTES_KEY, seedDisputes),
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
        return { ...d, status: "resolved" as const, resolvedAt: new Date().toISOString().split("T")[0], resolution, assignedAdmin: "NMS1...adm1" };
      });
      saveJSON(DISPUTES_KEY, disputes);
      return { disputes, auditLogs };
    });
  },
}));
