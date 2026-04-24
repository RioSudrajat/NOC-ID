import type {
  NetworkStats,
  FleetCategoryStat,
  DrivingDistanceStat,
  AnonymizedActivityEntry,
  QuestItem,
  PointCampaign,
  LeaderboardEntry,
} from '@/types/depin'

export const MOCK_NETWORK_STATS: NetworkStats = {
  totalFleet: 847,
  activeNodes: 623,
  kmToday: 42391,
  onChainSubmissions: 847,
  sessionStartTime: new Date(Date.now() - 5 * 365 * 24 * 3600 * 1000 - 130 * 24 * 3600 * 1000).toISOString(),
}

export const MOCK_FLEET_CATEGORIES: FleetCategoryStat[] = [
  { category: 'ojol', label: 'Ojol / Ride-hailing', unitCount: 512, kmToday: 24871, imageUrl: '/images/motor-ojol.jpg' },
  { category: 'kurir', label: 'Kurir / Delivery', unitCount: 231, kmToday: 11203, imageUrl: '/images/motor-kurir.jpg' },
  { category: 'logistik', label: 'Logistik Last-mile', unitCount: 104, kmToday: 6317, imageUrl: '/images/van-logistik.jpg' },
]

const generateChartData = () =>
  Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
      km: 30000 + Math.floor(Math.random() * 20000),
    }
  })

export const MOCK_DRIVING_STATS: DrivingDistanceStat = {
  totalPeriodKm: 32_914_637,
  yesterdayKm: 31_047,
  last30DaysKm: 3_993_407,
  chartData: generateChartData(),
}

const KOTA_LIST = ['Jakarta Sel.', 'Jakarta Ut.', 'Jakarta Bar.', 'Surabaya', 'Bandung', 'Semarang', 'Medan', 'Yogyakarta']
const CATEGORIES = ['ojol', 'kurir', 'logistik'] as const
const genHash = () =>
  Array.from({ length: 4 }, () =>
    Math.random().toString(36).substring(2, 6)
  ).join('')

export const MOCK_ACTIVITY_FEED: AnonymizedActivityEntry[] = Array.from({ length: 20 }, (_, i) => ({
  unitAnonymId: `#NMS-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}**`,
  zonaKota: KOTA_LIST[i % KOTA_LIST.length],
  timestamp: new Date(Date.now() - i * 47000).toISOString(),
  kmLifetime: 5000 + Math.floor(Math.random() * 70000),
  onChainHash: `0x${genHash()}...${genHash()}`,
  category: CATEGORIES[i % 3],
}))

export const MOCK_QUESTS: QuestItem[] = [
  { id: 'follow-twitter', title: 'Follow Twitter Nemesis', description: 'Follow akun Twitter resmi Nemesis Protocol', reward: 100, actionUrl: 'https://twitter.com/nemesisprotocol', actionLabel: 'Follow on Twitter', completed: false, icon: 'Twitter' },
  { id: 'join-telegram', title: 'Join Telegram', description: 'Bergabung ke Telegram komunitas Nemesis', reward: 100, actionUrl: 'https://t.me/nemesisprotocol', actionLabel: 'Join Telegram', completed: false, icon: 'MessageCircle' },
  { id: 'join-discord', title: 'Join Discord', description: 'Bergabung ke server Discord Nemesis Protocol', reward: 100, actionUrl: 'https://discord.gg/nemesis', actionLabel: 'Join Discord', completed: false, icon: 'Headphones' },
  { id: 'connect-wallet', title: 'Connect Wallet', description: 'Hubungkan Solana wallet lo ke Nemesis DePIN', reward: 100, actionUrl: '#', actionLabel: 'Connect Wallet', completed: true, icon: 'Wallet' },
  { id: 'refer-operator', title: 'Refer 1 Operator', description: 'Ajak 1 operator armada EV bergabung ke Nemesis', reward: 500, actionUrl: '/depin/referrals', actionLabel: 'Lihat Referral Link', completed: false, icon: 'Users' },
  { id: 'join-pool-1', title: 'Early Pool Investor', description: 'Invest di Fleet Pool Batch #1 sebelum penuh', reward: 1000, actionUrl: '/fi', actionLabel: 'Lihat Pool', completed: false, icon: 'TrendingUp' },
  { id: 'hold-points', title: 'Hold 1.000+ Poin 30 Hari', description: 'Pertahankan minimal 1.000 poin selama 30 hari berturut-turut', reward: 200, actionUrl: '#', actionLabel: 'Cek Progres', completed: false, icon: 'Star' },
]

export const MOCK_CAMPAIGNS: PointCampaign[] = [
  {
    id: 'season-1',
    season: 1,
    title: 'Season 1 — 10 Juta Activity Points',
    subtitle: 'Campaign pertama Nemesis Protocol. Poin dapat ditukar $NMS saat IDO 2027.',
    totalPoints: 10_000_000,
    distributedPoints: 18_010_260,
    endDate: '2026-12-31T23:59:59.000Z',
    active: true,
    rewards: [
      { id: 'ido-whitelist', label: 'IDO Whitelist $NMS', description: 'Priority whitelist di IDO $NMS 2027', pointCost: 5000, available: true },
      { id: 'fee-discount', label: 'Diskon Fee 50%', description: 'Diskon 50% protocol fee selama 3 bulan', pointCost: 2000, available: true },
      { id: 'pool-access', label: 'Akses Pool Eksklusif', description: 'Akses early ke pool batch berikutnya', pointCost: 1000, available: true },
    ],
  },
]

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, walletAddress: '8EM....peC', points: 1_927_261_747, change: 12000 },
  { rank: 2, walletAddress: 'Ht5....EpE', points: 1_017_650, change: 8000 },
  { rank: 3, walletAddress: '91h....PDi', points: 1_012_830, change: 5000 },
  { rank: 4, walletAddress: 'EnE....hQC', points: 501_060, change: 2000 },
  { rank: 5, walletAddress: '4EK....b7u', points: 500_850, change: 1500 },
  { rank: 6, walletAddress: '2xw....A4m', points: 405_720, change: 1200 },
  { rank: 7, walletAddress: '88F....vFH', points: 330_706, change: 800 },
  { rank: 8, walletAddress: 'MightBuddha', points: 262_150, change: 600 },
  { rank: 9, walletAddress: 'TDegenCrypto', points: 231_710, change: 400 },
  { rank: 10, walletAddress: 'Xk9....mWq', points: 198_340, change: 300 },
]
