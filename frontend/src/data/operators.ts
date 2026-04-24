import type { OperatorProfile } from '@/types/rwa'

export const MOCK_OPERATOR_PROFILE: OperatorProfile = {
  id: 'op-nemesis-native',
  walletAddress: 'NMSop1...xyz9',
  name: 'Nemesis Protocol',
  type: 'nemesis_native',
  businessName: 'Nemesis Protocol — Native Fleet',
  city: 'Jakarta',
  kycStatus: 'verified',
  totalVehicles: 100,
  activeVehicles: 83,
  poolId: 'pool-batch-1',
  joinedAt: '2026-01-01T00:00:00.000Z',
}

export const MOCK_PARTNER_OPERATORS: OperatorProfile[] = [
  {
    id: 'op-sby-express',
    walletAddress: 'SBYex1...abc4',
    name: 'SurabayaExpress Fleet',
    type: 'verified_partner',
    businessName: 'PT SurabayaExpress Logistics',
    city: 'Surabaya',
    kycStatus: 'verified',
    totalVehicles: 100,
    activeVehicles: 91,
    poolId: 'pool-batch-2',
    joinedAt: '2026-01-10T00:00:00.000Z',
  },
]
