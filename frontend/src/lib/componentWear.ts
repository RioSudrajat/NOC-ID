import type { VehicleCategory, ComponentWearSnapshot, GasolineMetrics } from "@/types/trip";

interface WearConfig {
  id: string;
  name: string;
  intervalKm: number;
  hardBrakePenaltyKm?: number;
  hardAccelPenaltyKm?: number;
}

export const componentWearConfig: Record<VehicleCategory, WearConfig[]> = {
  car: [
    { id: "engine_oil", name: "Oli Mesin", intervalKm: 5000 },
    { id: "oil_filter", name: "Filter Oli", intervalKm: 5000 },
    { id: "tires", name: "Ban", intervalKm: 25000, hardBrakePenaltyKm: 0.1 },
    { id: "brake_pads", name: "Kampas Rem", intervalKm: 30000, hardBrakePenaltyKm: 0.5 },
    { id: "air_filter", name: "Filter Udara", intervalKm: 10000 },
    { id: "spark_plugs", name: "Busi", intervalKm: 10000 },
    { id: "battery", name: "Aki", intervalKm: 50000 },
  ],
  motorcycle_matic: [
    { id: "engine_oil", name: "Oli Mesin", intervalKm: 2000 },
    { id: "cvt_belt", name: "Belt CVT", intervalKm: 25000, hardAccelPenaltyKm: 0.3 },
    { id: "brake_pads", name: "Kampas Rem", intervalKm: 15000, hardBrakePenaltyKm: 0.3 },
    { id: "air_filter", name: "Filter Udara", intervalKm: 8000 },
    { id: "spark_plugs", name: "Busi", intervalKm: 8000 },
    { id: "tires", name: "Ban", intervalKm: 20000 },
  ],
  motorcycle_big: [
    { id: "engine_oil", name: "Oli Mesin", intervalKm: 5000 },
    { id: "oil_filter", name: "Filter Oli", intervalKm: 5000 },
    { id: "drive_chain", name: "Rantai Drive", intervalKm: 10000, hardAccelPenaltyKm: 0.5 },
    { id: "brake_pads", name: "Kampas Rem", intervalKm: 20000, hardBrakePenaltyKm: 0.5 },
    { id: "tires", name: "Ban", intervalKm: 20000 },
    { id: "spark_plugs", name: "Busi", intervalKm: 16000 },
  ],
};

const seedRatioByIndex = [0.75, 0.68, 0.58, 0.42, 0.52, 0.35, 0.24];

export function createInitialWear(category: VehicleCategory): ComponentWearSnapshot[] {
  return componentWearConfig[category].map((item, index) => {
    const kmSinceService = Math.round(item.intervalKm * (seedRatioByIndex[index] ?? 0.35));
    return {
      id: item.id,
      name: item.name,
      kmSinceService,
      intervalKm: item.intervalKm,
      percentWorn: Math.min(100, (kmSinceService / item.intervalKm) * 100),
      deltaKmFromTrip: 0,
    };
  });
}

export function applyTripWear(
  current: ComponentWearSnapshot[],
  category: VehicleCategory,
  metrics: GasolineMetrics,
): ComponentWearSnapshot[] {
  const configsById = new Map(componentWearConfig[category].map((item) => [item.id, item]));
  return current.map((snapshot) => {
    const config = configsById.get(snapshot.id);
    const eventPenalty =
      (config?.hardBrakePenaltyKm ?? 0) * metrics.hardBrakingCount +
      (config?.hardAccelPenaltyKm ?? 0) * metrics.hardAccelerationCount;
    const deltaKmFromTrip = metrics.distanceKm + eventPenalty;
    const kmSinceService = Math.min(snapshot.intervalKm, snapshot.kmSinceService + deltaKmFromTrip);
    return {
      ...snapshot,
      kmSinceService,
      percentWorn: Math.min(100, (kmSinceService / snapshot.intervalKm) * 100),
      deltaKmFromTrip,
    };
  });
}

export function getWearState(percentWorn: number) {
  if (percentWorn > 85) return { label: "Segera servis", color: "#FCA5A5", pulse: true };
  if (percentWorn > 60) return { label: "Perhatian", color: "#FCD34D", pulse: false };
  return { label: "Aman", color: "#5EEAD4", pulse: false };
}
