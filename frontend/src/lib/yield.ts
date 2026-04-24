import type { StakingPool } from '@/types/fi'
import type { LockPeriod, ReturnCalculation } from '@/types/fi'

/**
 * Calculate projected investment return for a staking pool
 */
export function calculateReturn(
  pool: StakingPool,
  investedIDRX: number,
  utilizationPct: number,       // 0–100
  lockPeriod: LockPeriod
): ReturnCalculation {
  const sharesCount = Math.floor(investedIDRX / pool.pricePerShare)
  const actualInvested = sharesCount * pool.pricePerShare

  // APY scales with utilization
  const baseApy = pool.apyMin + ((pool.apyMax - pool.apyMin) * (utilizationPct / 100))
  // Lock bonus: +2% for 3mo, +4% for 6mo, +6% for 12mo
  const lockBonus = lockPeriod === 3 ? 2 : lockPeriod === 6 ? 4 : lockPeriod === 12 ? 6 : 0
  const effectiveApy = baseApy + lockBonus

  const annualYieldIDRX = (actualInvested * effectiveApy) / 100
  const monthlyYieldIDRX = annualYieldIDRX / 12
  const breakEvenMonths = actualInvested > 0
    ? Math.ceil(actualInvested / monthlyYieldIDRX)
    : 0

  const fiveYearProjection = Array.from({ length: 5 }, (_, i) => ({
    year: i + 1,
    cumulativeYield: Math.round(annualYieldIDRX * (i + 1)),
  }))

  return {
    investedIDRX: actualInvested,
    sharesCount,
    utilizationPct,
    lockPeriodMonths: lockPeriod,
    monthlyYieldIDRX: Math.round(monthlyYieldIDRX),
    annualYieldIDRX: Math.round(annualYieldIDRX),
    effectiveApy: Math.round(effectiveApy * 10) / 10,
    breakEvenMonths,
    fiveYearProjection,
  }
}

/** Format IDRX number as Rupiah string */
export function formatIDRX(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('IDR', 'IDRX')
}

/** Format number with Indonesian locale */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

/** Format km */
export function formatKm(km: number): string {
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)} jt km`
  if (km >= 1_000) return `${(km / 1_000).toFixed(1)} rb km`
  return `${km} km`
}

/** Truncate wallet address */
export function truncateWallet(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
