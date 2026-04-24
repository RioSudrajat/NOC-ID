"use client";

import { ReactNode, useMemo } from "react";
import { MOCK_VEHICLES } from "@/data/vehicles";

// Old-shape types
export interface FleetVehicle {
  id: string;
  vin: string;
  name: string;
  owner: string;
  status: string;
  health: number;
  odometer: number;
  region: string;
  lastService: string;
  type?: string;
  brand?: string;
  model?: string;
}

export interface WorkshopMetrics {
  id: string;
  name: string;
  city: string;
  rating: number;
  servicesCompleted: number;
  revenue: number;
  reputation: number;
}

export interface EnterpriseMetrics {
  totalVehicles: number;
  activeVehicles: number;
  totalRevenue: number;
  totalCompletedServices: number;
  vehicles: FleetVehicle[];
  workshopMetrics: WorkshopMetrics[];
  completedBookings: Array<{
    id: string;
    vehicleName: string;
    vin: string;
    workshop: string;
    date: string;
    totalIDR: number;
    status: string;
  }>;
}

// Map MOCK_VEHICLES to old FleetVehicle shape
function mapToFleetVehicles(): FleetVehicle[] {
  return MOCK_VEHICLES.map(v => ({
    id: v.id,
    vin: v.vin,
    name: `${v.brand} ${v.model}`,
    owner: "Nemesis Protocol",
    status: v.status === 'active' ? 'Active' : v.status === 'maintenance' ? 'Maintenance' : v.status === 'idle' ? 'Idle' : 'Offline',
    health: v.healthScore,
    odometer: v.odometer,
    region: 'Jakarta',
    lastService: `${v.lastServiceKm} km`,
    type: v.type,
    brand: v.brand,
    model: v.model,
  }));
}

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useEnterprise() {
  const metrics = useMemo<EnterpriseMetrics>(() => {
    const vehicles = mapToFleetVehicles();
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'Active').length,
      totalRevenue: 12_400_000,
      totalCompletedServices: 847,
      vehicles,
      workshopMetrics: [
        { id: 'ws-001', name: 'Bengkel Hendra Motor', city: 'Jakarta', rating: 4.8, servicesCompleted: 147, revenue: 8_400_000, reputation: 94 },
        { id: 'ws-002', name: 'Maju Jaya Auto', city: 'Jakarta', rating: 4.5, servicesCompleted: 92, revenue: 5_200_000, reputation: 81 },
        { id: 'ws-003', name: 'Toyota Astra BSD', city: 'Tangerang', rating: 4.9, servicesCompleted: 203, revenue: 12_800_000, reputation: 97 },
      ],
      completedBookings: [
        { id: 'bk-001', vehicleName: 'Toyota Avanza', vin: 'MHKA1BA1JFK000001', workshop: 'Bengkel Hendra Motor', date: '2026-04-20', totalIDR: 475100, status: 'completed' },
        { id: 'bk-002', vehicleName: 'BMW M4', vin: 'WBA43AZ0X0CH00001', workshop: 'EuroHaus ID', date: '2026-04-18', totalIDR: 850100, status: 'completed' },
        { id: 'bk-003', vehicleName: 'Honda Scoopy', vin: 'MH1JFZ110K000042', workshop: 'Ahass Motor', date: '2026-04-15', totalIDR: 75100, status: 'completed' },
      ],
    };
  }, []);

  return { metrics };
}
