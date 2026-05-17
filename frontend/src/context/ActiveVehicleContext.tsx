"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import {
  DEMO_VEHICLES,
  LEGACY_VEHICLE_ID_MAP,
  VEHICLE_ID_LEGACY_KEY_MAP,
  formatMileageKm,
  getVehicleDisplayName,
  type VehicleIdentity,
  type VehicleKey,
} from "@/types/vehicle";

export type { VehicleKey } from "@/types/vehicle";

export interface LegacyVehicleData {
  vehicleId: string;
  name: string;
  vin: string;
  health: number;
  nextService: string;
  owner: string;
  licensePlate: string;
  mileage: string;
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid";
  category: VehicleIdentity["category"];
  baseConsumptionPerKm: number;
  fuelPricePerLiter: number;
  make: string;
  model: string;
  year: number;
  color: string;
}

function toLegacyVehicleData(vehicle: VehicleIdentity): LegacyVehicleData {
  return {
    vehicleId: vehicle.vehicleId,
    name: getVehicleDisplayName(vehicle),
    vin: vehicle.vin,
    health: vehicle.healthScore,
    nextService: vehicle.nextServiceDue ?? "Due soon",
    owner: vehicle.currentOwnerId === "demo" ? "Demo Owner" : vehicle.currentOwnerId,
    licensePlate: vehicle.licensePlate,
    mileage: formatMileageKm(vehicle.currentMileageKm),
    fuelType: vehicle.fuelType,
    category: vehicle.category,
    baseConsumptionPerKm: vehicle.baseConsumptionPerKm,
    fuelPricePerLiter: vehicle.fuelPricePerLiter,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
  };
}

export const vehicleData = Object.fromEntries(
  DEMO_VEHICLES.map((vehicle) => [vehicle.legacyKey, toLegacyVehicleData(vehicle)]),
) as Record<string, LegacyVehicleData>;

interface ActiveVehicleContextType {
  activeVehicle: VehicleKey;
  activeVehicleId: string;
  activeVehicleIdentity: VehicleIdentity;
  setActiveVehicle: (keyOrId: VehicleKey | string) => void;
  currentVehicleData: LegacyVehicleData;
}

const ActiveVehicleContext = createContext<ActiveVehicleContextType | undefined>(undefined);

function getLegacyKey(vehicleId: string | null): VehicleKey {
  return VEHICLE_ID_LEGACY_KEY_MAP[vehicleId ?? ""] ?? "bmw_m4";
}

function normalizeToVehicleId(keyOrId: VehicleKey | string) {
  return LEGACY_VEHICLE_ID_MAP[keyOrId as VehicleKey] ?? keyOrId;
}

export function ActiveVehicleProvider({ children }: { children: ReactNode }) {
  const hydrate = useVehicleRegistryStore((state) => state.hydrate);
  const vehicles = useVehicleRegistryStore((state) => state.vehicles);
  const activeVehicleId = useVehicleRegistryStore((state) => state.activeVehicleId);
  const setActiveVehicleId = useVehicleRegistryStore((state) => state.setActiveVehicle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const selected = useMemo(
    () =>
      vehicles.find((vehicle) => vehicle.vehicleId === activeVehicleId) ??
      vehicles[0] ??
      DEMO_VEHICLES[0],
    [activeVehicleId, vehicles],
  );
  const activeVehicle = useMemo(() => getLegacyKey(selected.vehicleId), [selected.vehicleId]);

  const setActiveVehicle = useCallback((keyOrId: VehicleKey | string) => {
    setActiveVehicleId(normalizeToVehicleId(keyOrId));
  }, [setActiveVehicleId]);

  const currentVehicleData = useMemo(() => toLegacyVehicleData(selected), [selected]);
  const contextValue = useMemo(
    () => ({
      activeVehicle,
      activeVehicleId: selected.vehicleId,
      activeVehicleIdentity: selected,
      setActiveVehicle,
      currentVehicleData,
    }),
    [activeVehicle, currentVehicleData, selected, setActiveVehicle],
  );

  return (
    <ActiveVehicleContext.Provider value={contextValue}>
      {children}
    </ActiveVehicleContext.Provider>
  );
}

// TODO: Remove shim after all pages migrate directly to useVehicleRegistryStore().
export function useActiveVehicle() {
  return useContext(ActiveVehicleContext);
}

export function getLegacyVehicleDataById(vehicleId: string) {
  const legacyKey = getLegacyKey(vehicleId);
  return vehicleData[legacyKey];
}
