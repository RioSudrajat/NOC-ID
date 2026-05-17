export type VehicleCategory = "car" | "motorcycle_matic" | "motorcycle_big";

export type MintStatus = "demo" | "pending" | "minted" | "escrow" | "transferred";

export type LegacyVehicleKey = "bmw_m4" | "harley" | "pcx_150" | "supra";
export type VehicleKey = LegacyVehicleKey;

export interface VehicleIdentity {
  vehicleId: string;
  legacyKey?: LegacyVehicleKey;
  vin: string;
  frameNumber?: string;
  engineNumber?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  transmissionType: "manual" | "automatic" | "cvt" | "ev";
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid";
  modelGlbUrl?: string;
  thumbnailUrl?: string;
  mintStatus: MintStatus;
  onChainMintAddress?: string;
  treeAddress?: string;
  leafIndex?: number;
  vehicleRecordPda?: string;
  currentOwnerId: string | "demo";
  enterpriseId?: string;
  currentMileageKm: number;
  healthScore: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  baseConsumptionPerKm: number;
  fuelPricePerLiter: number;
  licensePlate: string;
  createdAt: string;
  mintedAt?: string;
  isDemo: boolean;
}

export const LEGACY_VEHICLE_ID_MAP: Record<LegacyVehicleKey, string> = {
  bmw_m4: "vid-bmw-m4-g82-001",
  harley: "vid-harley-sportster-s-001",
  pcx_150: "vid-honda-pcx-150-001",
  supra: "vid-toyota-supra-veilside-001",
};

export const VEHICLE_ID_LEGACY_KEY_MAP: Record<string, LegacyVehicleKey> =
  Object.fromEntries(
    Object.entries(LEGACY_VEHICLE_ID_MAP).map(([legacyKey, vehicleId]) => [vehicleId, legacyKey]),
  ) as Record<string, LegacyVehicleKey>;

export const DEMO_VEHICLES: VehicleIdentity[] = [
  {
    vehicleId: LEGACY_VEHICLE_ID_MAP.bmw_m4,
    legacyKey: "bmw_m4",
    vin: "WBA43AZ0X0CH00001",
    make: "BMW",
    model: "M4 G82",
    year: 2025,
    color: "Isle of Man Green",
    category: "car",
    transmissionType: "automatic",
    fuelType: "gasoline",
    modelGlbUrl: "/models/bmw_m4_g82.glb",
    mintStatus: "demo",
    currentOwnerId: "demo",
    enterpriseId: "ent-astra",
    currentMileageKm: 12400,
    healthScore: 95,
    nextServiceDue: "In 45 days",
    baseConsumptionPerKm: 0.12,
    fuelPricePerLiter: 18000,
    licensePlate: "B 4 M",
    createdAt: "2026-01-15T00:00:00.000Z",
    isDemo: true,
  },
  {
    vehicleId: LEGACY_VEHICLE_ID_MAP.harley,
    legacyKey: "harley",
    vin: "HD1ME23145K998212",
    make: "Harley-Davidson",
    model: "Sportster S",
    year: 2024,
    color: "Vivid Black",
    category: "motorcycle_big",
    transmissionType: "manual",
    fuelType: "gasoline",
    modelGlbUrl: "/models/harley_sportster_s.glb",
    mintStatus: "demo",
    currentOwnerId: "demo",
    enterpriseId: "ent-astra",
    currentMileageKm: 8900,
    healthScore: 98,
    nextServiceDue: "In 120 days",
    baseConsumptionPerKm: 0.14,
    fuelPricePerLiter: 18000,
    licensePlate: "B 8888 HD",
    createdAt: "2026-02-02T00:00:00.000Z",
    isDemo: true,
  },
  {
    vehicleId: LEGACY_VEHICLE_ID_MAP.pcx_150,
    legacyKey: "pcx_150",
    vin: "MH1KF1810HK150001",
    make: "Honda",
    model: "PCX 150",
    year: 2017,
    color: "Pearl White",
    category: "motorcycle_matic",
    transmissionType: "cvt",
    fuelType: "gasoline",
    modelGlbUrl: "/models/honda-pcx/source/PCXDLXABS.glb",
    mintStatus: "demo",
    currentOwnerId: "demo",
    enterpriseId: "ent-astra",
    currentMileageKm: 18250,
    healthScore: 91,
    nextServiceDue: "In 21 days",
    baseConsumptionPerKm: 0.034,
    fuelPricePerLiter: 18000,
    licensePlate: "B 150 PCX",
    createdAt: "2026-05-15T00:00:00.000Z",
    isDemo: true,
  },
  {
    vehicleId: LEGACY_VEHICLE_ID_MAP.supra,
    legacyKey: "supra",
    vin: "JT2BF28K6420S0001",
    make: "Toyota",
    model: "Supra Veilside A80",
    year: 1998,
    color: "Orange",
    category: "car",
    transmissionType: "manual",
    fuelType: "gasoline",
    modelGlbUrl: "/models/supra_veilside.glb",
    mintStatus: "demo",
    currentOwnerId: "demo",
    enterpriseId: "ent-astra",
    currentMileageKm: 8500,
    healthScore: 94,
    nextServiceDue: "In 30 days",
    baseConsumptionPerKm: 0.11,
    fuelPricePerLiter: 18000,
    licensePlate: "B 80 PRA",
    createdAt: "2026-02-14T00:00:00.000Z",
    isDemo: true,
  },
];

export function getVehicleDisplayName(vehicle: Pick<VehicleIdentity, "make" | "model" | "year">) {
  return `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
}

export function formatMileageKm(value: number) {
  return value.toLocaleString("id-ID");
}
