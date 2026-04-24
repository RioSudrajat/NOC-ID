'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DriverProfile, DriverDailyStatus, KYCDocument, ServiceReminder } from '@/types/driver'

interface DriverState {
  profile: DriverProfile | null
  todayStatus: DriverDailyStatus | null
  kycDocs: KYCDocument[]
  serviceReminders: ServiceReminder[]
  gpsWatchId: number | null
  lastCoords: { lat: number; lng: number } | null
  _hydrated: boolean
}

interface DriverActions {
  setProfile: (profile: DriverProfile) => void
  setGPSActive: (active: boolean, watchId?: number) => void
  setGPSInactive: () => void
  updateCoords: (coords: { lat: number; lng: number }) => void
  markFlatFeePaid: () => void
  updateKYCDoc: (doc: KYCDocument) => void
  setHydrated: () => void
}

const TODAY = new Date().toISOString().split('T')[0]

const MOCK_DRIVER_PROFILE: DriverProfile = {
  id: 'drv-001',
  phone: '081234567890',
  fullName: 'Budi Santoso',
  ktpNumber: '3171234567890001',
  simNumber: 'SIM-A-2024-001',
  kycStatus: 'verified',
  assignedVehicleId: 'vhc-0042',
  assignedVehicleUnitId: '#NMS-0042',
  contractType: 'rent',
  flatFeeDaily: 50000,
  operatorId: 'op-nemesis-native',
  joinedAt: '2026-01-15T00:00:00.000Z',
}

const MOCK_TODAY_STATUS: DriverDailyStatus = {
  driverId: 'drv-001',
  date: TODAY,
  gpsActive: false,
  gpsActiveMinutes: 0,
  flatFeePaid: true,
  flatFeeAmount: 50000,
  kmToday: 0,
  tripsToday: 0,
  activeHours: 0,
}

export const useDriverStore = create<DriverState & DriverActions>()(
  persist(
    (set, get) => ({
      profile: MOCK_DRIVER_PROFILE,
      todayStatus: MOCK_TODAY_STATUS,
      kycDocs: [
        { type: 'ktp', label: 'KTP (Kartu Tanda Penduduk)', status: 'verified', uploadedAt: '2026-01-15T08:00:00.000Z' },
        { type: 'sim', label: 'SIM (Surat Izin Mengemudi)', status: 'verified', uploadedAt: '2026-01-15T08:05:00.000Z' },
        { type: 'selfie', label: 'Foto Selfie dengan KTP', status: 'verified', uploadedAt: '2026-01-15T08:10:00.000Z' },
      ],
      serviceReminders: [
        {
          vehicleUnitId: '#NMS-0042',
          kmUntilService: -747,   // negative = overdue
          serviceType: 'Pemeriksaan 7.500 km',
          urgency: 'overdue',
        },
      ],
      gpsWatchId: null,
      lastCoords: null,
      _hydrated: false,

      setProfile: (profile) => set({ profile }),

      setGPSActive: (active, watchId) => {
        set((state) => ({
          gpsWatchId: watchId ?? state.gpsWatchId,
          todayStatus: state.todayStatus
            ? { ...state.todayStatus, gpsActive: active }
            : null,
        }))
      },

      setGPSInactive: () => {
        const { gpsWatchId } = get()
        if (gpsWatchId !== null && typeof navigator !== 'undefined') {
          navigator.geolocation.clearWatch(gpsWatchId)
        }
        set((state) => ({
          gpsWatchId: null,
          todayStatus: state.todayStatus
            ? { ...state.todayStatus, gpsActive: false }
            : null,
        }))
      },

      updateCoords: (coords) => set({ lastCoords: coords }),

      markFlatFeePaid: () => {
        set((state) => ({
          todayStatus: state.todayStatus
            ? { ...state.todayStatus, flatFeePaid: true }
            : null,
        }))
      },

      updateKYCDoc: (doc) => {
        set((state) => ({
          kycDocs: state.kycDocs.map((d) => (d.type === doc.type ? doc : d)),
        }))
      },

      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'nemesis-driver',
      partialize: (state) => ({
        profile: state.profile,
        kycDocs: state.kycDocs,
        todayStatus: state.todayStatus,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
