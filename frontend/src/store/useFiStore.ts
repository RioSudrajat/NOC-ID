'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  StakingPool,
  YieldDistribution,
  InvestorPosition,
  PoolReport,
  PoolImpact,
  ReturnCalculation,
  LockPeriod,
} from '@/types/fi'
import { MOCK_POOLS, MOCK_YIELD_DISTRIBUTIONS } from '@/data/pools'
import { calculateReturn } from '@/lib/yield'

interface FiState {
  pools: StakingPool[]
  yieldDistributions: Record<string, YieldDistribution[]>   // keyed by poolId
  myPositions: InvestorPosition[]
  poolReports: Record<string, PoolReport[]>
  poolImpacts: Record<string, PoolImpact>
  _hydrated: boolean
}

interface FiActions {
  investInPool: (poolId: string, sharesCount: number, lockPeriod: LockPeriod, walletAddress: string) => void
  calculatePoolReturn: (poolId: string, investedIDRX: number, utilizationPct: number, lockPeriod: LockPeriod) => ReturnCalculation | null
  setHydrated: () => void
}

export const useFiStore = create<FiState & FiActions>()(
  persist(
    (set, get) => ({
      pools: MOCK_POOLS,
      yieldDistributions: MOCK_YIELD_DISTRIBUTIONS,
      myPositions: [],
      poolReports: {},
      poolImpacts: {},
      _hydrated: false,

      investInPool: (poolId, sharesCount, lockPeriod, walletAddress) => {
        const { pools, myPositions } = get()
        const pool = pools.find((p) => p.id === poolId)
        if (!pool) return

        const invested = sharesCount * pool.pricePerShare
        const existing = myPositions.find((p) => p.poolId === poolId)
        if (existing) {
          set({
            myPositions: myPositions.map((p) =>
              p.poolId === poolId
                ? { ...p, sharesHeld: p.sharesHeld + sharesCount, invested: p.invested + invested }
                : p
            ),
          })
        } else {
          const newPosition: InvestorPosition = {
            poolId,
            poolName: pool.name,
            sharesHeld: sharesCount,
            totalShares: pool.sharesTotal,
            invested,
            yieldEarned: 0,
            currentApy: (pool.apyMin + pool.apyMax) / 2,
            lockPeriodMonths: lockPeriod,
            investedAt: new Date().toISOString(),
            nextDistribution: pool.nextDistribution,
          }
          set({ myPositions: [...myPositions, newPosition] })
        }

        // Update pool supplied amount
        set({
          pools: pools.map((p) =>
            p.id === poolId
              ? { ...p, totalSupplied: p.totalSupplied + invested }
              : p
          ),
        })
      },

      calculatePoolReturn: (poolId, investedIDRX, utilizationPct, lockPeriod) => {
        const { pools } = get()
        const pool = pools.find((p) => p.id === poolId)
        if (!pool) return null
        return calculateReturn(pool, investedIDRX, utilizationPct, lockPeriod)
      },

      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'nemesis-fi',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
