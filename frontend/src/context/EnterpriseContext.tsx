"use client";

/**
 * Backward-compatible shim — enterprise metrics are now derived via useEnterpriseMetrics() hook
 * in store/useEnterpriseStore.ts. This file re-exports everything so existing imports keep working.
 */

import { ReactNode } from "react";
import { useEnterpriseMetrics } from "@/store/useEnterpriseStore";

// Re-export types
export type {
  WorkshopMetrics,
  FleetVehicle,
  EnterpriseMetrics,
} from "@/store/useEnterpriseStore";

/**
 * EnterpriseProvider — now a no-op wrapper. Kept so `<EnterpriseProvider>` in Providers.tsx doesn't break.
 */
export function EnterpriseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * useEnterprise() — returns the same `{ metrics }` shape as the old context.
 */
export function useEnterprise() {
  const metrics = useEnterpriseMetrics();
  return { metrics };
}
