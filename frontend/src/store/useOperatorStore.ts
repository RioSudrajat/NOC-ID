'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RegisteredVehicle, MaintenanceFundEntry, MaintenanceAlert, AIFleetInsight, OperatorProfile } from '@/types/rwa'
import { MOCK_VEHICLES } from '@/data/vehicles'
import { MOCK_OPERATOR_PROFILE } from '@/data/operators'

interface OperatorState {
  profile: OperatorProfile | null
  vehicles: RegisteredVehicle[]
  maintenanceFundLog: MaintenanceFundEntry[]
  maintenanceAlerts: MaintenanceAlert[]
  aiInsights: AIFleetInsight[]
  poolSummary: { poolId: string; tvl: number; investorCount: number; nextDistribution: string } | null
  _hydrated: boolean
}

interface OperatorActions {
  registerVehicle: (vehicle: Omit<RegisteredVehicle, 'id' | 'registeredAt' | 'unitId'>) => void
  updateVehicleStatus: (vehicleId: string, status: RegisteredVehicle['status']) => void
  releaseMaintFund: (vehicleId: string, amount: number, workshopId: string, serviceProofHash: string) => void
  setHydrated: () => void
}

export const useOperatorStore = create<OperatorState & OperatorActions>()(
  persist(
    (set, get) => ({
      profile: MOCK_OPERATOR_PROFILE,
      vehicles: MOCK_VEHICLES,
      maintenanceFundLog: [
        {
          id: 'mf-001',
          vehicleId: 'vhc-0042',
          unitId: '#NMS-0042',
          type: 'deposit',
          amount: 6000,
          triggeredAtKm: 8247,
          status: 'confirmed',
          timestamp: new Date().toISOString(),
        },
      ],
      maintenanceAlerts: [
        {
          vehicleId: 'vhc-0042',
          unitId: '#NMS-0042',
          severity: 'warning',
          type: 'scheduled',
          message: 'Servis 7.500 km terlewat 747 km',
          dueSinceKm: -747,
          component: 'General',
        },
        {
          vehicleId: 'vhc-0018',
          unitId: '#NMS-0018',
          severity: 'warning',
          type: 'predictive',
          message: 'Efisiensi baterai turun 12%',
          component: 'Baterai',
        },
      ],
      aiInsights: [
        {
          vehicleId: 'vhc-0042',
          unitId: '#NMS-0042',
          severity: 'critical',
          message: 'Ban belakang: pola pengereman menunjukkan keausan tidak merata',
          prediction: 'Kemungkinan perlu penggantian ban dalam 7–10 hari',
          confidence: 82,
          category: 'maintenance',
        },
        {
          vehicleId: 'vhc-0018',
          unitId: '#NMS-0018',
          severity: 'warning',
          message: 'Efisiensi baterai unit #NMS-0018 turun 12% dibanding bulan lalu',
          prediction: 'Kemungkinan degradasi sel baterai — pantau 2 minggu ke depan',
          confidence: 71,
          category: 'battery',
        },
        {
          severity: 'warning',
          message: '3 unit di atas rata-rata idle rate minggu ini',
          prediction: 'Kemungkinan ada masalah pengemudi atau rute — investigasi diperlukan',
          confidence: 65,
          category: 'utilization',
        },
      ],
      poolSummary: {
        poolId: 'pool-batch-1',
        tvl: 45000000,
        investorCount: 312,
        nextDistribution: '2026-04-28T00:00:00.000Z',
      },
      _hydrated: false,

      registerVehicle: (vehicleData) => {
        const { vehicles } = get()
        const idx = vehicles.length + 1
        const newVehicle: RegisteredVehicle = {
          ...vehicleData,
          id: `vhc-${String(idx).padStart(4, '0')}`,
          unitId: `#NMS-${String(idx).padStart(4, '0')}`,
          registeredAt: new Date().toISOString(),
        }
        set({ vehicles: [...vehicles, newVehicle] })
      },

      updateVehicleStatus: (vehicleId, status) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === vehicleId ? { ...v, status } : v
          ),
        }))
      },

      releaseMaintFund: (vehicleId, amount, workshopId, serviceProofHash) => {
        const { maintenanceFundLog, vehicles } = get()
        const vehicle = vehicles.find((v) => v.id === vehicleId)
        if (!vehicle || vehicle.maintenanceFundBalance < amount) return

        const entry: MaintenanceFundEntry = {
          id: `mf-${Date.now()}`,
          vehicleId,
          unitId: vehicle.unitId,
          type: 'release',
          amount,
          workshopId,
          serviceProofHash,
          status: 'released',
          timestamp: new Date().toISOString(),
        }

        set({
          maintenanceFundLog: [entry, ...maintenanceFundLog],
          vehicles: vehicles.map((v) =>
            v.id === vehicleId
              ? { ...v, maintenanceFundBalance: v.maintenanceFundBalance - amount }
              : v
          ),
        })
      },

      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'nemesis-operator',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
