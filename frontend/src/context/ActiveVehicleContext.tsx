"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import { useUserStore } from "@/store/useUserStore";
import {
  DEMO_VEHICLES,
  LEGACY_VEHICLE_ID_MAP,
  VEHICLE_ID_LEGACY_KEY_MAP,
  formatMileageKm,
  getVehicleDisplayName,
  isServiceLogReadyVehicle,
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
  hasActiveVehicle: boolean;
}

const ActiveVehicleContext = createContext<ActiveVehicleContextType | undefined>(undefined);

function getLegacyKey(vehicleId: string | null): VehicleKey {
  return VEHICLE_ID_LEGACY_KEY_MAP[vehicleId ?? ""] ?? "bmw_m4";
}

function normalizeToVehicleId(keyOrId: VehicleKey | string) {
  return LEGACY_VEHICLE_ID_MAP[keyOrId as VehicleKey] ?? keyOrId;
}

const EMPTY_USER_VEHICLE: VehicleIdentity = {
  vehicleId: "__no_vehicle__",
  vin: "",
  make: "",
  model: "No vehicle yet",
  year: new Date().getFullYear(),
  color: "",
  category: "car",
  transmissionType: "automatic",
  fuelType: "gasoline",
  mintStatus: "pending",
  currentOwnerId: "",
  currentMileageKm: 0,
  healthScore: 0,
  baseConsumptionPerKm: 0,
  fuelPricePerLiter: 0,
  licensePlate: "",
  createdAt: new Date(0).toISOString(),
  isDemo: false,
};

export function ActiveVehicleProvider({ children }: { children: ReactNode }) {
  const hydrate = useVehicleRegistryStore((state) => state.hydrate);
  const vehicles = useVehicleRegistryStore((state) => state.vehicles);
  const activeVehicleId = useVehicleRegistryStore((state) => state.activeVehicleId);
  const setActiveVehicleId = useVehicleRegistryStore((state) => state.setActiveVehicle);
  const currentUser = useUserStore((state) => state.currentUser);
  const session = useUserStore((state) => state.session);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isRealUserSession = Boolean(currentUser?.userId && session?.loginMethod !== "demo");
  const eligibleVehicles = useMemo(() => {
    if (!isRealUserSession) return vehicles.length ? vehicles : DEMO_VEHICLES;
    return vehicles.filter((vehicle) => (
      vehicle.currentOwnerId === currentUser?.userId ||
      currentUser?.ownedVehicleIds.includes(vehicle.vehicleId)
    ) && isServiceLogReadyVehicle(vehicle));
  }, [currentUser?.ownedVehicleIds, currentUser?.userId, isRealUserSession, vehicles]);

  const selected = useMemo(
    () =>
      eligibleVehicles.find((vehicle) => vehicle.vehicleId === activeVehicleId) ??
      eligibleVehicles[0] ??
      EMPTY_USER_VEHICLE,
    [activeVehicleId, eligibleVehicles],
  );
  const hasActiveVehicle = selected.vehicleId !== EMPTY_USER_VEHICLE.vehicleId;
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
      hasActiveVehicle,
    }),
    [activeVehicle, currentVehicleData, hasActiveVehicle, selected, setActiveVehicle],
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
