'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  NetworkStats,
  FleetCategoryStat,
  DrivingDistanceStat,
  AnonymizedActivityEntry,
  QuestItem,
  PointCampaign,
  LeaderboardEntry,
  PointActivity,
  PoolUnit,
  PoolActivitySummary,
  DriverGPSState,
} from '@/types/depin'
import { MOCK_NETWORK_STATS, MOCK_FLEET_CATEGORIES, MOCK_DRIVING_STATS, MOCK_ACTIVITY_FEED, MOCK_QUESTS, MOCK_CAMPAIGNS, MOCK_LEADERBOARD } from '@/data/depin'

interface DepinState {
  // Network (public)
  networkStats: NetworkStats
  fleetCategories: FleetCategoryStat[]
  drivingStats: DrivingDistanceStat
  activityFeed: AnonymizedActivityEntry[]

  // Authenticated user
  walletAddress: string | null
  myPoints: number
  globalRank: number
  questsCompleted: string[]
  pointActivities: PointActivity[]

  // Campaign
  activeCampaign: PointCampaign | null
  campaigns: PointCampaign[]

  // Leaderboard
  leaderboard: LeaderboardEntry[]

  // Pool-specific (investor gated)
  poolUnits: Record<string, PoolUnit[]>
  poolSummaries: Record<string, PoolActivitySummary>

  // Driver GPS state (stored per driver session)
  driverGPS: DriverGPSState

  // Hydration
  _hydrated: boolean
}

interface DepinActions {
  setWallet: (address: string | null) => void
  completeQuest: (questId: string, points: number) => void
  setDriverGPSActive: (active: boolean) => void
  updateDriverGPS: (coords: { lat: number; lng: number }) => void
  loadPoolUnits: (poolId: string, units: PoolUnit[]) => void
  setHydrated: () => void
}

const initialDriverGPS: DriverGPSState = {
  isActive: false,
  activeMinutesToday: 0,
  kmToday: 0,
  tripsToday: 0,
}

export const useDepinStore = create<DepinState & DepinActions>()(
  persist(
    (set, get) => ({
      // Initial state
      networkStats: MOCK_NETWORK_STATS,
      fleetCategories: MOCK_FLEET_CATEGORIES,
      drivingStats: MOCK_DRIVING_STATS,
      activityFeed: MOCK_ACTIVITY_FEED,

      walletAddress: null,
      myPoints: 50,
      globalRank: 5394,
      questsCompleted: [],
      pointActivities: [],

      activeCampaign: MOCK_CAMPAIGNS[0] || null,
      campaigns: MOCK_CAMPAIGNS,
      leaderboard: MOCK_LEADERBOARD,

      poolUnits: {},
      poolSummaries: {},

      driverGPS: initialDriverGPS,

      _hydrated: false,

      // Actions
      setWallet: (address) => set({ walletAddress: address }),

      completeQuest: (questId, points) => {
        const { questsCompleted, myPoints, pointActivities } = get()
        if (questsCompleted.includes(questId)) return
        set({
          questsCompleted: [...questsCompleted, questId],
          myPoints: myPoints + points,
          pointActivities: [
            {
              id: Date.now().toString(),
              walletAddress: get().walletAddress || 'unknown',
              points,
              reason: `Quest completed: ${questId}`,
              timestamp: new Date().toISOString(),
            },
            ...pointActivities,
          ],
        })
      },

      setDriverGPSActive: (active) => {
        set((state) => ({
          driverGPS: { ...state.driverGPS, isActive: active },
        }))
      },

      updateDriverGPS: (coords) => {
        set((state) => ({
          driverGPS: { ...state.driverGPS, lastCoords: coords },
        }))
      },

      loadPoolUnits: (poolId, units) => {
        set((state) => ({
          poolUnits: { ...state.poolUnits, [poolId]: units },
        }))
      },

      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'nemesis-depin',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
