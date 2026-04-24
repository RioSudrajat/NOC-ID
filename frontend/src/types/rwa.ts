import { FleetCategory, NodeStatus } from './depin'
import { OperatorType } from './fi'

export type VehicleType =
  | 'motor_listrik'
  | 'motor_kargo'
  | 'mobil_listrik'
  | 'van_listrik'
  | 'truk_listrik'
  | 'bus_listrik'
  | 'pikap_listrik'

export type ContractType = 'rent' | 'cicil'

export type AssetModuleStatus = 'active' | 'coming_soon' | 'future'

export interface RegisteredVehicle {
  id: string
  vin: string
  unitId: string             // e.g. "#NMS-0042"
  type: VehicleType
  category: FleetCategory
  brand: string
  model: string
  year: number
  operatorId: string
  gpsDeviceId: string        // phone IMEI or hardware GPS ID (MVP = phone)
  sharesTotal: number        // always 1000
  pricePerShare: number      // IDRX (30,000)
  odometer: number           // km
  nodeScore: number          // 0-100
  healthScore: number        // 0-100
  healthBreakdown: VehicleHealthBreakdown
  status: NodeStatus
  maintenanceFundBalance: number  // IDRX
  lastServiceKm: number
  nextServiceKm: number
  contractType: ContractType
  flatFeeDaily: number       // IDR
  poolId?: string
  onChainAddress?: string
  imageUrl?: string
  registeredAt: string
  driverId?: string
}

export interface VehicleHealthBreakdown {
  rem: number        // 0-100
  ban: number
  baterai: number
  lampu: number
  mesin?: number
}

export interface MaintenanceFundEntry {
  id: string
  vehicleId: string
  unitId: string
  type: 'deposit' | 'release'
  amount: number             // IDRX
  triggeredAtKm?: number     // odometer when triggered
  workshopId?: string
  workshopName?: string
  serviceProofHash?: string
  serviceType?: string
  status: 'pending' | 'confirmed' | 'released'
  timestamp: string
}

export interface MaintenanceAlert {
  vehicleId: string
  unitId: string
  severity: 'info' | 'warning' | 'critical'
  type: 'scheduled' | 'predictive'
  message: string
  dueSinceKm?: number        // km overdue (negative = still ahead)
  component?: string
}

export interface AIFleetInsight {
  vehicleId?: string         // if unit-specific, else fleet-wide
  unitId?: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  prediction: string
  confidence: number         // 0-100
  category: 'maintenance' | 'performance' | 'utilization' | 'battery'
}

export interface AssetModule {
  id: string
  moduleNumber: number
  title: string
  subtitle: string
  description: string
  status: AssetModuleStatus
  statusLabel: string
  icon: string
  vehicleTypes?: string[]
  revenueSource?: string
  proofMechanism?: string
}

export interface OperatorProfile {
  id: string
  walletAddress: string
  name: string
  type: OperatorType
  businessName?: string
  city: string
  kycStatus: 'pending' | 'verified' | 'rejected'
  totalVehicles: number
  activeVehicles: number
  poolId?: string
  joinedAt: string
}
