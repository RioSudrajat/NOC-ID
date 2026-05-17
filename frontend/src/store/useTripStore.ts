import { create } from "zustand";
import { api, type ApiTrip } from "@/lib/api/client";
import { createInitialWear, applyTripWear } from "@/lib/componentWear";
import { calculateGasolineMetrics, formatDuration } from "@/lib/tripMetrics";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import type { ComponentWearSnapshot, GasolineMetrics, Trip, TripPoint, TripState } from "@/types/trip";
import { DEMO_VEHICLES, LEGACY_VEHICLE_ID_MAP, type LegacyVehicleKey, type VehicleIdentity } from "@/types/vehicle";

const STORAGE_KEY = "noc-trip-state-v2";
const LEGACY_STORAGE_KEY = "noc-trip-state-v1";
const EMPTY_TRIPS: Trip[] = [];

interface StoredTripState {
  trips: TripState["trips"];
  componentWear: TripState["componentWear"];
}

interface TripActions {
  hydrate: () => void;
  syncFromBackend: (vehicleId: string) => Promise<void>;
  startRecording: (vehicleId: string, initialPoint?: TripPoint) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  addPoint: (point: TripPoint) => void;
  stopRecording: () => Trip | null;
  resetRecording: () => void;
}

export type TripStore = TripState & TripActions;

const emptyRecording: TripState["recording"] = {
  status: "idle",
  vehicleId: null,
  startedAt: null,
  route: [],
  liveMetrics: {},
};

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
    // localStorage can fail in private mode; UI should keep working in-memory.
  }
}

function createComponentWearState() {
  const componentWear = {} as Record<string, ComponentWearSnapshot[]>;
  for (const vehicle of DEMO_VEHICLES) {
    componentWear[vehicle.vehicleId] = createInitialWear(vehicle.category);
  }
  return componentWear;
}

const INITIAL_COMPONENT_WEAR = createComponentWearState();

function createSeedState(): StoredTripState {
  const componentWear = createComponentWearState();
  const trips = {} as Record<string, Trip[]>;

  DEMO_VEHICLES.forEach((vehicle) => {
    trips[vehicle.vehicleId] = [];
  });

  return { trips, componentWear };
}

function persistState(state: Pick<TripState, "trips" | "componentWear">) {
  saveJSON<StoredTripState>(STORAGE_KEY, {
    trips: state.trips,
    componentWear: state.componentWear,
  });
}

function sanitizeStoredState(state: StoredTripState): StoredTripState {
  const trips: TripState["trips"] = {};
  const componentWear: TripState["componentWear"] = {};

  for (const vehicle of DEMO_VEHICLES) {
    const legacyKey = vehicle.legacyKey;
    const storedTrips = [
      ...(state.trips[vehicle.vehicleId] ?? []),
      ...(legacyKey ? state.trips[legacyKey] ?? [] : []),
    ];
    trips[vehicle.vehicleId] = storedTrips
      .filter((trip) => !isSyntheticSeedTrip(trip))
      .map((trip) => ({ ...trip, vehicleId: trip.vehicleId ?? vehicle.vehicleId }));
    componentWear[vehicle.vehicleId] =
      state.componentWear[vehicle.vehicleId] ??
      (legacyKey ? state.componentWear[legacyKey] : undefined) ??
      INITIAL_COMPONENT_WEAR[vehicle.vehicleId];
  }

  return { trips, componentWear };
}

function normalizeVehicleId(id: string) {
  return LEGACY_VEHICLE_ID_MAP[id as LegacyVehicleKey] ?? id;
}

function getVehicle(vehicleId: string): VehicleIdentity {
  const normalizedId = normalizeVehicleId(vehicleId);
  return (
    useVehicleRegistryStore.getState().getVehicleById(normalizedId) ??
    DEMO_VEHICLES.find((vehicle) => vehicle.vehicleId === normalizedId) ??
    DEMO_VEHICLES[0]
  );
}

function mapApiTrip(item: ApiTrip): Trip {
  const vehicle = getVehicle(item.vehicleId);
  const route = (item.points ?? []).map((point) => ({
    lat: Number(point.lat),
    lng: Number(point.lng),
    speedKmh: point.speedKmh == null ? 0 : Number(point.speedKmh),
    timestamp: new Date(point.timestamp).getTime(),
  }));
  const metrics = item.metrics as Partial<GasolineMetrics>;
  return {
    id: item.id,
    vehicleId: item.vehicleId,
    vehicleKey: vehicle.legacyKey,
    vehicleName: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
    ownerName: vehicle.currentOwnerId,
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin,
    startedAt: item.startedAt,
    completedAt: item.completedAt ?? item.startedAt,
    durationLabel: formatDuration(metrics.durationSeconds ?? 0),
    route,
    metrics: metricsOrEmpty(metrics),
    componentWearAfter: createInitialWear(vehicle.category),
    source: "gps_device",
    status: "completed",
  };
}

function isSyntheticSeedTrip(trip: Trip) {
  if (trip.route.length < 10) return false;
  const constantTwoMinuteSamples = trip.route
    .slice(1)
    .every((point, index) => point.timestamp - trip.route[index].timestamp === 120000);
  const looksLikeOldJakartaSeed =
    trip.route[0].lat > -6.28 &&
    trip.route[0].lat < -6.12 &&
    trip.route[0].lng > 106.8 &&
    trip.route[0].lng < 106.95;
  return constantTwoMinuteSamples && looksLikeOldJakartaSeed;
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: {},
  componentWear: {},
  recording: emptyRecording,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const fallback = createSeedState();
    const stored = sanitizeStoredState(
      loadJSON<StoredTripState>(STORAGE_KEY, loadJSON<StoredTripState>(LEGACY_STORAGE_KEY, fallback)),
    );
    set({
      trips: stored.trips,
      componentWear: stored.componentWear,
      hydrated: true,
    });
  },

  syncFromBackend: async (vehicleId) => {
    try {
      const normalizedVehicleId = normalizeVehicleId(vehicleId);
      const response = await api.trips(normalizedVehicleId);
      set((state) => {
        const fromBackend = response.items.map(mapApiTrip);
        const existing = state.trips[normalizedVehicleId] ?? [];
        const byId = new Map([...existing, ...fromBackend].map((trip) => [trip.id, trip]));
        const tripsForVehicle = Array.from(byId.values()).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        const trips = { ...state.trips, [normalizedVehicleId]: tripsForVehicle };
        persistState({ trips, componentWear: state.componentWear });
        return { trips, hydrated: true };
      });
    } catch (error) {
      console.warn("Failed to sync trips from backend", error);
    }
  },

  startRecording: (vehicleId, initialPoint) => {
    const now = Date.now();
    const normalizedVehicleId = normalizeVehicleId(vehicleId);
    const vehicle = getVehicle(normalizedVehicleId);
    set({
      recording: {
        status: "recording",
        vehicleId: normalizedVehicleId,
        startedAt: now,
        route: initialPoint ? [initialPoint] : [],
        liveMetrics: calculateGasolineMetrics([], vehicle),
      },
    });
  },

  pauseRecording: () => {
    set((state) => ({
      recording: state.recording.status === "recording"
        ? { ...state.recording, status: "paused" }
        : state.recording,
    }));
  },

  resumeRecording: () => {
    set((state) => ({
      recording: state.recording.status === "paused"
        ? { ...state.recording, status: "recording" }
        : state.recording,
    }));
  },

  addPoint: (point) => {
    set((state) => {
      const vehicleId = state.recording.vehicleId;
      if (!vehicleId || state.recording.status !== "recording") return state;
      const vehicle = getVehicle(vehicleId);
      const route = [...state.recording.route, point];
      return {
        recording: {
          ...state.recording,
          route,
          liveMetrics: calculateGasolineMetrics(route, vehicle),
        },
      };
    });
  },

  stopRecording: () => {
    const state = get();
    const vehicleId = state.recording.vehicleId;
    if (!vehicleId || state.recording.route.length === 0) {
      set({ recording: emptyRecording });
      return null;
    }

    const vehicle = getVehicle(vehicleId);
    const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
    const metrics = calculateGasolineMetrics(state.recording.route, vehicle);
    const currentWear = state.componentWear[vehicleId] ?? createInitialWear(vehicle.category);
    const componentWearAfter = applyTripWear(currentWear, vehicle.category, metrics);
    const startedAt = state.recording.startedAt ?? state.recording.route[0].timestamp;
    const completedAt = Date.now();
    const trip: Trip = {
      id: `TRIP-${vehicleId}-${completedAt}`,
      vehicleId,
      vehicleKey: vehicle.legacyKey,
      vehicleName,
      ownerName: vehicle.currentOwnerId,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationLabel: formatDuration(metrics.durationSeconds),
      route: state.recording.route,
      metrics,
      componentWearAfter,
      source: "gps_device",
      status: "completed",
    };

    const trips = {
      ...state.trips,
      [vehicleId]: [trip, ...(state.trips[vehicleId] ?? [])],
    };
    const componentWear = {
      ...state.componentWear,
      [vehicleId]: componentWearAfter,
    };
    persistState({ trips, componentWear });
    set({ trips, componentWear, recording: emptyRecording });
    void api.createTrip({
      vehicleId,
      startedAt: trip.startedAt,
      completedAt: trip.completedAt,
      metrics: { ...trip.metrics },
      points: trip.route.map((point) => ({
        lat: point.lat,
        lng: point.lng,
        speedKmh: point.speedKmh,
        timestamp: new Date(point.timestamp).toISOString(),
      })),
    }).catch((error) => {
      console.warn("Failed to persist trip to backend", error);
    });
    return trip;
  },

  resetRecording: () => {
    set({ recording: emptyRecording });
  },
}));

export function selectTripsForVehicle(state: TripStore, vehicleId: string) {
  const normalizedVehicleId = normalizeVehicleId(vehicleId);
  return state.trips[normalizedVehicleId] ?? EMPTY_TRIPS;
}

export function selectWearForVehicle(state: TripStore, vehicleId: string) {
  const normalizedVehicleId = normalizeVehicleId(vehicleId);
  return state.componentWear[normalizedVehicleId] ?? INITIAL_COMPONENT_WEAR[normalizedVehicleId];
}

export function metricsOrEmpty(metrics: Partial<GasolineMetrics> | undefined): GasolineMetrics {
  return {
    distanceKm: metrics?.distanceKm ?? 0,
    durationSeconds: metrics?.durationSeconds ?? 0,
    avgSpeedKmh: metrics?.avgSpeedKmh ?? 0,
    maxSpeedKmh: metrics?.maxSpeedKmh ?? 0,
    estimatedFuelLiters: metrics?.estimatedFuelLiters ?? 0,
    fuelEfficiencyKmPerL: metrics?.fuelEfficiencyKmPerL ?? 0,
    co2EstimateKg: metrics?.co2EstimateKg ?? 0,
    fuelCostIdr: metrics?.fuelCostIdr ?? 0,
    idleTimeSeconds: metrics?.idleTimeSeconds ?? 0,
    stopCount: metrics?.stopCount ?? 0,
    hardAccelerationCount: metrics?.hardAccelerationCount ?? 0,
    hardBrakingCount: metrics?.hardBrakingCount ?? 0,
    elevationGainM: metrics?.elevationGainM ?? 0,
  };
}
