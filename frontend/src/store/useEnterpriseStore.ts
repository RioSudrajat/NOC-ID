import { useMemo } from "react";
import { useBookingStore } from "./useBookingStore";
import { vehicleData, type VehicleKey } from "@/context/ActiveVehicleContext";
import { workshopsData } from "@/data/workshops";
import type { CompletedBooking } from "@/types/booking";
import type { Workshop } from "@/types/booking";

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
  key: VehicleKey;
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
const vehicleRegionMap: Record<string, string> = {
  avanza: "Jakarta",
  bmw_m4: "Tangerang",
  beat: "Bandung",
  harley: "Jakarta",
};

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function computeMetrics(completed: CompletedBooking[], activeBookingsCount: number): EnterpriseMetrics {
  const currentMonth = getCurrentMonth();

  // Fleet vehicles
  const vehicleKeys = Object.keys(vehicleData) as VehicleKey[];
  const vehicles: FleetVehicle[] = vehicleKeys.map(key => ({
    key,
    name: vehicleData[key].name,
    vin: vehicleData[key].vin,
    health: vehicleData[key].health,
    owner: vehicleData[key].owner,
    mileage: vehicleData[key].mileage,
    licensePlate: vehicleData[key].licensePlate,
    region: vehicleRegionMap[key] || "Other",
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

  return useMemo(() => {
    const activeStatuses = ["ACCEPTED", "IN_SERVICE", "INVOICE_SENT"];
    const activeCount = (Object.values(bookings).filter(Boolean) as NonNullable<typeof bookings[keyof typeof bookings]>[])
      .filter(b => activeStatuses.includes(b.status)).length;
    return computeMetrics(completedBookings, activeCount);
  }, [completedBookings, bookings]);
}
