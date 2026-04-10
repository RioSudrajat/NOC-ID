"use client";

/**
 * Backward-compatible shim — all state now lives in useAdminStore (Zustand).
 * Existing imports from "@/context/AdminContext" continue to work via re-exports.
 */

import { ReactNode, useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";

// Re-export types
export type {
  PlatformRole,
  WalletEntry,
  PlatformConfig,
  AuditLogEntry,
  DisputeEntry,
} from "@/types/admin";

/**
 * AdminProvider — hydrates the Zustand store on mount.
 * Kept as a wrapper so existing `<AdminProvider>` usage doesn't break.
 */
export function AdminProvider({ children }: { children: ReactNode }) {
  const hydrate = useAdminStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

/**
 * useAdmin() — returns same shape as old context.
 */
export function useAdmin() {
  const store = useAdminStore();
  return {
    currentAdmin: { wallet: "NOC1...adm1" as string, role: "superadmin" as const },
    whitelistedWallets: store.whitelistedWallets,
    addWallet: store.addWallet,
    removeWallet: store.removeWallet,
    updateRole: store.updateRole,
    suspendWallet: store.suspendWallet,
    activateWallet: store.activateWallet,
    platformConfig: store.platformConfig,
    updateConfig: store.updateConfig,
    auditLogs: store.auditLogs,
    disputes: store.disputes,
    fileDispute: store.fileDispute,
    resolveDispute: store.resolveDispute,
  };
}
