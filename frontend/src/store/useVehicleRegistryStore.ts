import { create } from "zustand";
import { STORAGE_KEYS } from "@/constants/storage";
import { api, type ApiVehicle } from "@/lib/api/client";
import {
  DEMO_VEHICLES,
  LEGACY_VEHICLE_ID_MAP,
  type LegacyVehicleKey,
  type VehicleIdentity,
} from "@/types/vehicle";
import type { VehicleAuditReport } from "@/types/audit";

interface StoredVehicleRegistryState {
  vehicles: VehicleIdentity[];
  activeVehicleId: string | null;
}

interface VehicleRegistryState extends StoredVehicleRegistryState {
  hydrated: boolean;
}

interface VehicleRegistryActions {
  hydrate: () => void;
  syncFromBackend: (ownerId?: string | null) => Promise<void>;
  setActiveVehicle: (id: string) => void;
  addVehicle: (vehicle: VehicleIdentity) => void;
  updateVehicle: (id: string, patch: Partial<VehicleIdentity>) => void;
  getVehicleById: (id: string) => VehicleIdentity | undefined;
  getVisibleVehicles: (ownerId?: string | null) => VehicleIdentity[];
  mintFromAudit: (auditReport: VehicleAuditReport) => VehicleIdentity;
  clearUserVehicles: (ownerId?: string) => void;
}

export type VehicleRegistryStore = VehicleRegistryState & VehicleRegistryActions;

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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep in-memory state usable if browser storage is unavailable.
  }
}

function normalizeActiveVehicleId(value: string | null | undefined) {
  if (!value) return DEMO_VEHICLES[0].vehicleId;
  return LEGACY_VEHICLE_ID_MAP[value as LegacyVehicleKey] ?? value;
}

function mergeDemoVehicles(vehicles: VehicleIdentity[]) {
  const byId = new Map<string, VehicleIdentity>();
  const seenVin = new Set<string>();
  for (const vehicle of DEMO_VEHICLES) byId.set(vehicle.vehicleId, vehicle);
  for (const vehicle of vehicles) {
    if (!vehicle.vehicleId || !vehicle.vin || !vehicle.make || !vehicle.model || !vehicle.year) continue;
    const vinKey = vehicle.vin.trim().toUpperCase();
    const isDemoVin = DEMO_VEHICLES.some((demo) => demo.vin.toUpperCase() === vinKey);
    const duplicateMintedVin = seenVin.has(vinKey) && !vehicle.isDemo;
    if (duplicateMintedVin) continue;
    if (!isDemoVin && !vehicle.isDemo) seenVin.add(vinKey);
    byId.set(vehicle.vehicleId, { ...vehicle, vin: vinKey });
  }
  return Array.from(byId.values());
}

function persist(state: StoredVehicleRegistryState) {
  saveJSON(STORAGE_KEYS.vehicleRegistry, state);
}

function mapApiVehicle(vehicle: ApiVehicle): VehicleIdentity {
  return {
    vehicleId: vehicle.id,
    vin: vehicle.vin,
    frameNumber: vehicle.frameNumber ?? undefined,
    engineNumber: vehicle.engineNumber ?? undefined,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    category: vehicle.category,
    transmissionType: vehicle.transmissionType.toLowerCase() as VehicleIdentity["transmissionType"],
    fuelType: vehicle.fuelType.toLowerCase() as VehicleIdentity["fuelType"],
    mintStatus: vehicle.mintStatus,
    onChainMintAddress: vehicle.cnftAssetId ?? undefined,
    treeAddress: vehicle.treeAddress ?? undefined,
    leafIndex: vehicle.leafIndex ?? undefined,
    vehicleRecordPda: vehicle.vehicleRecordPda ?? undefined,
    currentOwnerId: vehicle.currentOwnerId ?? "demo",
    enterpriseId: vehicle.enterpriseId ?? undefined,
    currentMileageKm: vehicle.currentMileageKm,
    healthScore: vehicle.healthScore,
    baseConsumptionPerKm: vehicle.category === "car" ? 0.1 : 0.04,
    fuelPricePerLiter: 18000,
    licensePlate: vehicle.licensePlate,
    createdAt: vehicle.createdAt,
    mintedAt: vehicle.mintStatus === "minted" || vehicle.mintStatus === "demo" ? vehicle.createdAt : undefined,
    isDemo: vehicle.mintStatus === "demo",
  };
}

export const useVehicleRegistryStore = create<VehicleRegistryStore>((set, get) => ({
  vehicles: DEMO_VEHICLES,
  activeVehicleId: DEMO_VEHICLES[0].vehicleId,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const stored = loadJSON<StoredVehicleRegistryState | null>(STORAGE_KEYS.vehicleRegistry, null);
    const legacyActive =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.activeVehicleLegacy)
        : null;
    const vehicles = mergeDemoVehicles(stored?.vehicles ?? DEMO_VEHICLES);
    const activeVehicleId = normalizeActiveVehicleId(stored?.activeVehicleId ?? legacyActive);
    const safeActiveVehicleId = vehicles.some((vehicle) => vehicle.vehicleId === activeVehicleId)
      ? activeVehicleId
      : vehicles[0]?.vehicleId ?? null;

    set({ vehicles, activeVehicleId: safeActiveVehicleId, hydrated: true });
    persist({ vehicles, activeVehicleId: safeActiveVehicleId });
  },

  syncFromBackend: async (ownerId) => {
    try {
      const response = await api.vehicles(ownerId ? { ownerId } : undefined);
      const backendVehicles = response.items.map(mapApiVehicle);
      set((state) => {
        const existing = ownerId
          ? state.vehicles.filter((vehicle) => vehicle.isDemo || vehicle.currentOwnerId !== ownerId)
          : state.vehicles;
        const vehicles = mergeDemoVehicles([...existing, ...backendVehicles]);
        const activeStillValid = state.activeVehicleId
          ? vehicles.some((vehicle) => vehicle.vehicleId === state.activeVehicleId && (!ownerId || vehicle.currentOwnerId === ownerId))
          : false;
        const activeVehicleId = activeStillValid
          ? state.activeVehicleId
          : backendVehicles[0]?.vehicleId ?? (ownerId ? null : vehicles[0]?.vehicleId ?? null);
        persist({ vehicles, activeVehicleId });
        return { vehicles, activeVehicleId, hydrated: true };
      });
    } catch (error) {
      console.warn("[vehicle-registry] backend sync skipped", error);
    }
  },

  setActiveVehicle: (id) => {
    const activeVehicleId = normalizeActiveVehicleId(id);
    set({ activeVehicleId });
    persist({ vehicles: get().vehicles, activeVehicleId });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.activeVehicleLegacy, activeVehicleId);
      window.dispatchEvent(new Event("noc_active_vehicle_change"));
    }
  },

  addVehicle: (vehicle) => {
    set((state) => {
      const vehicles = state.vehicles.some((item) => item.vehicleId === vehicle.vehicleId)
        ? state.vehicles.map((item) => (item.vehicleId === vehicle.vehicleId ? vehicle : item))
        : [vehicle, ...state.vehicles];
      persist({ vehicles, activeVehicleId: state.activeVehicleId });
      return { vehicles };
    });
  },

  updateVehicle: (id, patch) => {
    set((state) => {
      const vehicles = state.vehicles.map((vehicle) =>
        vehicle.vehicleId === id ? { ...vehicle, ...patch } : vehicle,
      );
      persist({ vehicles, activeVehicleId: state.activeVehicleId });
      return { vehicles };
    });
  },

  getVehicleById: (id) => {
    const vehicleId = normalizeActiveVehicleId(id);
    return get().vehicles.find((vehicle) => vehicle.vehicleId === vehicleId);
  },

  getVisibleVehicles: (ownerId) =>
    get().vehicles.filter((vehicle) => {
      if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.vin) return false;
      if (ownerId) return vehicle.currentOwnerId === ownerId;
      if (vehicle.mintStatus === "transferred") return ownerId ? vehicle.currentOwnerId === ownerId : false;
      if (vehicle.mintStatus === "escrow") return false;
      return vehicle.isDemo;
    }),

  mintFromAudit: (auditReport) => {
    const now = new Date().toISOString();
    const vehicle: VehicleIdentity = {
      vehicleId: `vid-${auditReport.vin.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
      vin: auditReport.vin,
      frameNumber: auditReport.frameNumber,
      engineNumber: auditReport.engineNumber,
      make: auditReport.make,
      model: auditReport.model,
      year: auditReport.year,
      color: auditReport.color,
      category: auditReport.category,
      transmissionType: "manual",
      fuelType: "gasoline",
      mintStatus: "escrow",
      currentOwnerId: auditReport.submittedForUserId,
      enterpriseId: auditReport.reviewedByEnterpriseId ?? "ent-astra",
      currentMileageKm: auditReport.odometerKm,
      healthScore: auditReport.overallConditionScore,
      baseConsumptionPerKm: auditReport.category === "car" ? 0.1 : 0.04,
      fuelPricePerLiter: 18000,
      licensePlate: auditReport.licensePlate,
      createdAt: now,
      mintedAt: now,
      isDemo: false,
    };
    get().addVehicle(vehicle);
    return vehicle;
  },

  clearUserVehicles: (ownerId) => {
    set((state) => {
      const vehicles = state.vehicles.filter(
        (vehicle) => vehicle.isDemo || (ownerId ? vehicle.currentOwnerId !== ownerId : true),
      );
      const activeVehicleId = vehicles[0]?.vehicleId ?? null;
      persist({ vehicles, activeVehicleId });
      return { vehicles, activeVehicleId };
    });
  },
}));

export const useVehicleRegistry = useVehicleRegistryStore;
