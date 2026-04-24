import { FleetCategory } from './depin'

export type OperatorType = 'nemesis_native' | 'verified_partner' | 'independent'
export type PoolStatus = 'upcoming' | 'active' | 'filled' | 'closed'
export type LockPeriod = 3 | 6 | 12 | 24 | 36 | null  // months; null = flexible

export interface StakingPool {
  id: string
  name: string
  slug: string
  description: string
  operatorType: OperatorType
  managedBy: string              // "Nemesis Protocol" | partner name
  category: FleetCategory[]
  unitCount: number
  apyMin: number
  apyMax: number
  totalSupplied: number          // IDRX
  targetSupply: number           // IDRX
  sharesTotal: number            // total shares in pool
  pricePerShare: number          // IDRX
  lockPeriodMonths: LockPeriod
  status: PoolStatus
  energyPointsEligible: boolean
  imageUrl: string
  locationLabel: string          // e.g. "Jakarta Selatan"
  nextDistribution: string       // ISO date (next Monday)
  createdAt: string
  tags: string[]                 // e.g. ["3 Years", "Decharge Managed"]
  // Breakdown
  unitBreakdown: { category: FleetCategory; label: string; count: number }[]
  // Health
  activeUnits: number
  idleUnits: number
  maintenanceUnits: number
}

export interface YieldDistribution {
  id: string
  poolId: string
  date: string                   // ISO date (Monday)
  totalDistributed: number       // IDRX
  perShare: number               // IDRX
  onChainHash: string
  activeUnitsContributed: number
  utilizationPct: number
}

export interface InvestorPosition {
  poolId: string
  poolName: string
  sharesHeld: number
  totalShares: number            // pool's total shares
  invested: number               // IDRX
  yieldEarned: number            // total IDRX received to date
  currentApy: number
  lockPeriodMonths: LockPeriod
  investedAt: string             // ISO date
  nextDistribution: string       // ISO date
}

export interface PoolReport {
  poolId: string
  period: string                 // e.g. "April 2026"
  type: 'monthly' | 'quarterly'
  avgUtilization: number
  totalYieldDistributed: number  // IDRX
  avgApy: number
  highlights: string[]
  downloadUrl?: string
  weeklyData: { week: string; yield: number; utilization: number }[]
}

export interface PoolImpact {
  poolId: string
  co2SavedKg: number
  petrolEquivalentLiters: number
  totalKmEV: number
  driversSupported: number
  economicValueIDR: number
}

export interface ReturnCalculation {
  investedIDRX: number
  sharesCount: number
  utilizationPct: number
  lockPeriodMonths: LockPeriod
  monthlyYieldIDRX: number
  annualYieldIDRX: number
  effectiveApy: number
  breakEvenMonths: number
  fiveYearProjection: { year: number; cumulativeYield: number }[]
}
