import { useMemo } from "react";
import { create } from "zustand";
import { useBookingStore } from "./useBookingStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";
import { api, type ApiVehicleAudit } from "@/lib/api/client";
import { workshopsData } from "@/data/workshops";
import type { CompletedBooking } from "@/types/booking";
import type { Workshop } from "@/types/booking";
import type { VehicleAuditReport } from "@/types/audit";

/* ── Types (re-exported from EnterpriseContext shim) ── */

export interface WorkshopMetrics {
  workshopId: string;
  workshopName: string;
  servicesThisMonth: number;
  revenueThisMonth: number;
  totalServices: number;
  totalRevenue: number;
  avgRating: number;
  ratingCount: number;
  oemPartsUsed: number;
  aftermarketPartsUsed: number;
}

export interface FleetVehicle {
  key: string;
  name: string;
  vin: string;
  health: number;
  owner: string;
  mileage: string;
  licensePlate: string;
  region: string;
}

export interface EnterpriseMetrics {
  totalVehicles: number;
  avgFleetHealth: number;
  vehicles: FleetVehicle[];
  activeServiceSessions: number;
  totalCompletedServices: number;
  completedThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  avgCostPerService: number;
  totalOemParts: number;
  totalAftermarketParts: number;
  oemRate: number;
  avgRating: number;
  totalReviews: number;
  workshopMetrics: WorkshopMetrics[];
  serviceTypeDistribution: Record<string, number>;
  partFrequency: { name: string; count: number }[];
  completedBookings: CompletedBooking[];
  workshops: Workshop[];
}

// Map vehicle keys to approximate regions
const vehicleRegionMap: Record<string, string> = {  bmw_m4: "Tangerang",  harley: "Jakarta",  pcx_150: "Bandung",
};

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function computeMetrics(completed: CompletedBooking[], activeBookingsCount: number): EnterpriseMetrics {
  const currentMonth = getCurrentMonth();

  // Fleet vehicles
  const registryVehicles = useVehicleRegistryStore.getState().vehicles;
  const vehicles: FleetVehicle[] = registryVehicles.map(vehicle => ({
    key: vehicle.vehicleId,
    name: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
    vin: vehicle.vin,
    health: vehicle.healthScore,
    owner: vehicle.currentOwnerId,
    mileage: vehicle.currentMileageKm.toLocaleString("id-ID"),
    licensePlate: vehicle.licensePlate,
    region: vehicleRegionMap[vehicle.legacyKey ?? vehicle.vehicleId] || "Other",
  }));

  const avgFleetHealth = vehicles.length > 0
    ? Math.round(vehicles.reduce((s, v) => s + v.health, 0) / vehicles.length)
    : 0;

  const completedThisMonth = completed.filter(c => c.date.startsWith(currentMonth)).length;
  const totalRevenue = completed.reduce((s, c) => s + c.totalIDR, 0);
  const revenueThisMonth = completed
    .filter(c => c.date.startsWith(currentMonth))
    .reduce((s, c) => s + c.totalIDR, 0);
  const avgCostPerService = completed.length > 0
    ? Math.round(totalRevenue / completed.length)
    : 0;

  let totalOemParts = 0;
  let totalAftermarketParts = 0;
  const partFreqMap: Record<string, number> = {};
  const serviceTypeMap: Record<string, number> = {};

  for (const cb of completed) {
    serviceTypeMap[cb.serviceType] = (serviceTypeMap[cb.serviceType] || 0) + 1;
    for (const p of cb.parts) {
      if (p.isOEM) totalOemParts++;
      else totalAftermarketParts++;
      partFreqMap[p.name] = (partFreqMap[p.name] || 0) + 1;
    }
  }

  const totalParts = totalOemParts + totalAftermarketParts;
  const oemRate = totalParts > 0 ? Math.round((totalOemParts / totalParts) * 100) : 100;

  const partFrequency = Object.entries(partFreqMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const reviewed = completed.filter(c => c.review && c.review.rating > 0);
  const avgRating = reviewed.length > 0
    ? Math.round(reviewed.reduce((s, c) => s + (c.review?.rating || 0), 0) / reviewed.length * 10) / 10
    : 0;

  // Workshop metrics
  const wsMetricsMap = new Map<string, WorkshopMetrics>();
  for (const cb of completed) {
    const existing = wsMetricsMap.get(cb.workshopId) || {
      workshopId: cb.workshopId,
      workshopName: cb.workshopName,
      servicesThisMonth: 0,
      revenueThisMonth: 0,
      totalServices: 0,
      totalRevenue: 0,
      avgRating: 0,
      ratingCount: 0,
      oemPartsUsed: 0,
      aftermarketPartsUsed: 0,
    };

    existing.totalServices++;
    existing.totalRevenue += cb.totalIDR;

    if (cb.date.startsWith(currentMonth)) {
      existing.servicesThisMonth++;
      existing.revenueThisMonth += cb.totalIDR;
    }

    if (cb.review && cb.review.rating > 0) {
      existing.avgRating = ((existing.avgRating * existing.ratingCount) + cb.review.rating) / (existing.ratingCount + 1);
      existing.ratingCount++;
    }

    for (const p of cb.parts) {
      if (p.isOEM) existing.oemPartsUsed++;
      else existing.aftermarketPartsUsed++;
    }

    wsMetricsMap.set(cb.workshopId, existing);
  }

  return {
    totalVehicles: vehicles.length,
    avgFleetHealth,
    vehicles,
    activeServiceSessions: activeBookingsCount,
    totalCompletedServices: completed.length,
    completedThisMonth,
    totalRevenue,
    revenueThisMonth,
    avgCostPerService,
    totalOemParts,
    totalAftermarketParts,
    oemRate,
    avgRating,
    totalReviews: reviewed.length,
    workshopMetrics: Array.from(wsMetricsMap.values()),
    serviceTypeDistribution: serviceTypeMap,
    partFrequency,
    completedBookings: completed,
    workshops: workshopsData,
  };
}

/**
 * Hook that derives enterprise metrics from the booking store.
 * Replaces the old EnterpriseContext.
 */
export function useEnterpriseMetrics(): EnterpriseMetrics {
  const completedBookings = useBookingStore(s => s.completedBookings);
  const bookings = useBookingStore(s => s.bookings);
  const vehicles = useVehicleRegistryStore(s => s.vehicles);

  return useMemo(() => {
    const activeStatuses = ["ACCEPTED", "IN_SERVICE", "INVOICE_SENT"];
    const activeCount = (Object.values(bookings).filter(Boolean) as NonNullable<typeof bookings[keyof typeof bookings]>[])
      .filter(b => activeStatuses.includes(b.status)).length;
    return computeMetrics(completedBookings, activeCount);
  }, [completedBookings, bookings, vehicles]);
}

const AUDITS_KEY = "noc-enterprise-audits-v1";

interface EnterpriseAuditState {
  pendingAudits: VehicleAuditReport[];
  hydrated: boolean;
  hydrate: () => void;
  syncFromBackend: (query?: { workshopId?: string; status?: string; requestId?: string }) => Promise<void>;
  submitAuditReport: (report: VehicleAuditReport) => void;
  approveAudit: (auditId: string) => void;
  rejectAudit: (auditId: string, notes: string) => void;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function mapApiAudit(item: ApiVehicleAudit): VehicleAuditReport {
  return {
    auditId: item.id,
    requestId: item.requestId ?? undefined,
    workshopId: item.workshopId,
    mechanicId: "backend",
    submittedForUserId: item.submittedForUserId,
    vin: item.vin,
    frameNumber: "",
    engineNumber: "",
    licensePlate: item.licensePlate,
    make: item.make,
    model: item.model,
    year: item.year,
    color: "Unknown",
    category: "car",
    ownerNameOnDocs: "",
    odometerKm: item.odometerKm,
    componentHealth: Array.isArray(item.componentHealth) ? item.componentHealth as VehicleAuditReport["componentHealth"] : [],
    overallConditionScore: item.overallConditionScore,
    photoRefs: [],
    mechanicNotes: "",
    auditedAt: item.createdAt,
    status: item.status as VehicleAuditReport["status"],
    reviewedByEnterpriseId: item.reviewedByEnterpriseId ?? undefined,
    mintedVehicleId: item.mintedVehicleId ?? undefined,
  };
}

export const useEnterpriseAuditStore = create<EnterpriseAuditState>((set, get) => ({
  pendingAudits: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ pendingAudits: loadJSON<VehicleAuditReport[]>(AUDITS_KEY, []), hydrated: true });
  },

  syncFromBackend: async (query) => {
    try {
      const response = await api.auditReports(query);
      set((state) => {
        const fromBackend = response.items.map(mapApiAudit);
        const byId = new Map([...state.pendingAudits, ...fromBackend].map((item) => [item.auditId, item]));
        const pendingAudits = Array.from(byId.values()).sort((a, b) => new Date(b.auditedAt).getTime() - new Date(a.auditedAt).getTime());
        saveJSON(AUDITS_KEY, pendingAudits);
        return { pendingAudits, hydrated: true };
      });
    } catch (error) {
      console.warn("Failed to sync vehicle audits from backend", error);
    }
  },

  submitAuditReport: (report) => {
    set((state) => {
      const entry = { ...report, status: "submitted" as const };
      const pendingAudits = [entry, ...state.pendingAudits.filter((item) => item.auditId !== report.auditId)];
      saveJSON(AUDITS_KEY, pendingAudits);
      return { pendingAudits };
    });
    void api.createAuditReport({
      requestId: report.requestId,
      workshopId: report.workshopId,
      submittedForUserId: report.submittedForUserId,
      vin: report.vin,
      make: report.make,
      model: report.model,
      year: report.year,
      licensePlate: report.licensePlate,
      odometerKm: report.odometerKm,
      componentHealth: report.componentHealth,
      overallConditionScore: report.overallConditionScore,
      evidenceHash: report.diagnosticReportRef,
    }).catch((error) => {
      console.warn("Failed to persist audit report to backend", error);
    });
  },

  approveAudit: (auditId) => {
    set((state) => {
      let nextVehicleId: string | undefined;
      const pendingAudits = state.pendingAudits.map((audit) => {
        if (audit.auditId !== auditId) return audit;
        const reviewedAt = new Date().toISOString();
        const approvedAudit = {
          ...audit,
          status: "minting" as const,
          reviewDecision: "approved" as const,
          reviewedByEnterpriseId: "ent-astra",
          reviewedAt,
        };
        const vehicle = useVehicleRegistryStore.getState().mintFromAudit(approvedAudit);
        nextVehicleId = vehicle.vehicleId;
        if (audit.requestId) {
          useVehicleMintingStore.getState().markMinted(audit.requestId, vehicle.vehicleId);
        }
        return {
          ...audit,
          status: "minted" as const,
          reviewDecision: "approved" as const,
          reviewedByEnterpriseId: "ent-astra",
          reviewedAt,
          mintedVehicleId: nextVehicleId,
        };
      });
      saveJSON(AUDITS_KEY, pendingAudits);
      return { pendingAudits };
    });
    void api.approveAudit(auditId).catch((error) => {
      console.warn("Failed to queue backend audit approval", error);
    });
  },

  rejectAudit: (auditId, notes) => {
    set((state) => {
      const pendingAudits = state.pendingAudits.map((audit) =>
        audit.auditId === auditId
          ? (() => {
              if (audit.requestId) {
                useVehicleMintingStore.getState().rejectRequest(audit.requestId, notes);
              }
              return {
              ...audit,
              status: "rejected" as const,
              reviewDecision: "rejected" as const,
              reviewNotes: notes,
              reviewedByEnterpriseId: "ent-astra",
              reviewedAt: new Date().toISOString(),
            };
            })()
          : audit,
      );
      saveJSON(AUDITS_KEY, pendingAudits);
      return { pendingAudits };
    });
  },
}));
