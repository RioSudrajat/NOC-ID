export type FuelType = "gasoline";
export type VehicleCategory = "car" | "motorcycle_matic" | "motorcycle_big";

export interface TripPoint {
  lat: number;
  lng: number;
  altitude?: number;
  speedKmh: number;
  timestamp: number;
}

export interface GasolineMetrics {
  distanceKm: number;
  durationSeconds: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  estimatedFuelLiters: number;
  fuelEfficiencyKmPerL: number;
  co2EstimateKg: number;
  fuelCostIdr: number;
  idleTimeSeconds: number;
  stopCount: number;
  hardAccelerationCount: number;
  hardBrakingCount: number;
  elevationGainM: number;
}

export interface ComponentWearSnapshot {
  id: string;
  name: string;
  kmSinceService: number;
  intervalKm: number;
  percentWorn: number;
  deltaKmFromTrip: number;
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicleKey?: string;
  vehicleName: string;
  ownerName: string;
  licensePlate: string;
  vin: string;
  startedAt: string;
  completedAt: string;
  durationLabel: string;
  route: TripPoint[];
  metrics: GasolineMetrics;
  componentWearAfter: ComponentWearSnapshot[];
  source: "gps_device" | "iot";
  status: "completed";
}

export interface TripState {
  trips: Partial<Record<string, Trip[]>>;
  componentWear: Partial<Record<string, ComponentWearSnapshot[]>>;
  recording: {
    status: "idle" | "starting" | "recording" | "paused";
    vehicleId: string | null;
    startedAt: number | null;
    route: TripPoint[];
    liveMetrics: Partial<GasolineMetrics>;
  };
  hydrated: boolean;
}
