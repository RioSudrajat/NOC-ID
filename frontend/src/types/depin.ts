export type FleetCategory = 'ojol' | 'kurir' | 'logistik' | 'korporat'
export type NodeStatus = 'active' | 'idle' | 'maintenance' | 'offline'

export interface NetworkStats {
  totalFleet: number
  activeNodes: number
  kmToday: number
  onChainSubmissions: number
  sessionStartTime: string // ISO date — for live elapsed counter
}

export interface FleetCategoryStat {
  category: FleetCategory
  label: string
  unitCount: number
  kmToday: number
  imageUrl: string
}

export interface DrivingDistanceStat {
  totalPeriodKm: number
  yesterdayKm: number
  last30DaysKm: number
  chartData: { date: string; km: number }[]
}

export interface AnonymizedActivityEntry {
  unitAnonymId: string   // e.g. "#NMS-A**"
  zonaKota: string
  timestamp: string      // ISO date
  kmLifetime: number
  onChainHash: string
  category: FleetCategory
}

export interface QuestItem {
  id: string
  title: string
  description: string
  reward: number         // points
  actionUrl: string
  actionLabel: string
  completed: boolean
  icon: string           // lucide icon name
}

export interface PointCampaign {
  id: string
  season: number
  title: string
  subtitle: string
  totalPoints: number
  distributedPoints: number
  endDate: string
  active: boolean
  rewards: CampaignReward[]
}

export interface CampaignReward {
  id: string
  label: string
  description: string
  pointCost: number
  available: boolean
}

export interface LeaderboardEntry {
  rank: number
  walletAddress: string  // truncated: "8EM....peC"
  points: number
  change: number         // +/- vs yesterday
}

export interface PointActivity {
  id: string
  walletAddress: string
  points: number
  reason: string
  timestamp: string
}

// For investor-gated pool view
export interface PoolUnit {
  unitId: string         // full ID visible to pool investor
  vehicleType: string
  category: FleetCategory
  status: NodeStatus
  kmLifetime: number
  kmYesterday: number
  chargingSessionsTotal: number
  nodeScore: number
  healthScore: number
  nextServiceKm: number
  imageUrl?: string
  todayRouteCoords: RoutePoint[][]  // array of trips, each trip = array of coords
  todayTripLog: TripLogEntry[]
}

export interface RoutePoint {
  lat: number
  lng: number
}

export interface TripLogEntry {
  timestamp: string
  fromZona: string
  toZona: string
  km: number
  onChainHash: string
}

export interface PoolActivitySummary {
  poolId: string
  activeUnits: number
  idleUnits: number
  maintenanceUnits: number
  offlineUnits: number
  totalKmToday: number
  utilizationPct: number
  estimatedYieldThisWeek: number  // IDRX per share
}

// Driver portal (phone-only, no Web3)
export interface DriverGPSState {
  isActive: boolean
  activeMinutesToday: number
  kmToday: number
  tripsToday: number
  lastCoords?: { lat: number; lng: number }
}
