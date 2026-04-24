"use client";

export type VehicleKey = "avanza" | "m4" | "scoopy" | "harley";

export interface VehicleInfo {
  key: VehicleKey;
  name: string;
  vin: string;
  owner: string;
  health: number;
  odometer: string;
  type: string;
  year: number;
  color?: string;
  plate?: string;
  category?: string;
  brand?: string;
  model?: string;
}

export const vehicleData: Record<VehicleKey, VehicleInfo> = {
  avanza: {
    key: "avanza",
    name: "Toyota Avanza 1.5 G",
    vin: "MHKA1BA1JFK000001",
    owner: "Budi Santoso",
    health: 87,
    odometer: "36,842 km",
    type: "MPV",
    year: 2021,
    plate: "B 1234 ABC",
    brand: "Toyota",
    model: "Avanza 1.5 G",
    category: "MPV",
  },
  m4: {
    key: "m4",
    name: "BMW M4 Competition",
    vin: "WBA43AZ0X0CH00001",
    owner: "Andi Wijaya",
    health: 94,
    odometer: "12,400 km",
    type: "Coupe",
    year: 2023,
    plate: "B 8 AWJ",
    brand: "BMW",
    model: "M4 Competition",
    category: "Coupe",
  },
  scoopy: {
    key: "scoopy",
    name: "Honda Scoopy Prestige",
    vin: "MH1JFZ110K000042",
    owner: "Siti Rahma",
    health: 91,
    odometer: "14,200 km",
    type: "Motorcycle",
    year: 2024,
    plate: "B 4567 DEF",
    brand: "Honda",
    model: "Scoopy Prestige",
    category: "Motorcycle",
  },
  harley: {
    key: "harley",
    name: "Harley-Davidson Fat Boy 114",
    vin: "HD1ME23145K998212",
    owner: "Rizky Pratama",
    health: 96,
    odometer: "8,900 km",
    type: "Motorcycle",
    year: 2023,
    plate: "B 114 HD",
    brand: "Harley-Davidson",
    model: "Fat Boy 114",
    category: "Motorcycle",
  },
};

// Stub hook for components that expected a React context
export function useActiveVehicle() {
  return { activeKey: "avanza" as VehicleKey, setActiveKey: (_k: VehicleKey) => {}, vehicle: vehicleData.avanza };
}
