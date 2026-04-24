// Nemesis Protocol — global constants

export const NEMESIS = {
  name: 'Nemesis Protocol',
  tagline: 'Protokol Infrastruktur EV Indonesia',
  description: 'Lapisan protokol untuk seluruh ekosistem infrastruktur EV produktif Indonesia — setiap aset EV yang menghasilkan pendapatan dapat ditokenisasi, diinvestasikan, dan didistribusikan imbal hasilnya on-chain.',
  chain: 'Solana',
  yieldCurrency: 'IDRX',
  protocolToken: '$NMS',
  tokenLaunchTarget: '2027',
  hackathon: 'Colosseum Frontier 2026',
  twitter: 'https://twitter.com/nemesisprotocol',
  telegram: 'https://t.me/nemesisprotocol',
  discord: 'https://discord.gg/nemesisprotocol',
} as const

export const SUB_PRODUCTS = {
  depin: {
    name: 'Nemesis DePIN',
    slug: 'depin',
    description: 'Lapisan data & aktivitas — GPS verifikasi on-chain untuk seluruh armada EV produktif',
    path: '/depin',
    color: '#5EEAD4',
    icon: 'Activity',
  },
  fi: {
    name: 'Nemesis FI',
    slug: 'fi',
    description: 'Lapisan finansial — tokenisasi imbal hasil dari armada EV produktif ke investor',
    path: '/fi',
    color: '#34D399',
    icon: 'TrendingUp',
  },
  rwa: {
    name: 'Nemesis RWA',
    slug: 'rwa',
    description: 'Lapisan aset — tokenisasi kepemilikan fraksional infrastruktur EV fisik',
    path: '/rwa',
    color: '#60A5FA',
    icon: 'Layers',
  },
} as const

export const SHARES_PER_VEHICLE = 1000
export const PRICE_PER_SHARE_IDRX = 30_000         // IDRX (= Rp 30.000)
export const FLAT_FEE_DAILY_IDR = 50_000            // IDR — default rent fee
export const MAINTENANCE_FUND_PCT = 0.03            // 3% of daily fee to maintenance fund
export const PROTOCOL_FEE_PCT = 0.04               // 4% to treasury
export const FLEET_MANAGER_FEE_PCT = 0.03           // 3% to fleet manager

export const MAINTENANCE_THRESHOLDS_KM = [2500, 5000, 10000, 20000] as const

export const NODE_SCORE_TIERS = {
  premium: { min: 80, label: 'Premium', color: '#86EFAC' },
  standard: { min: 50, label: 'Standard', color: '#5EEAD4' },
  flagged: { min: 0, label: 'Ditandai', color: '#FCA5A5' },
} as const

export const POOL_OPERATOR_LABELS: Record<string, string> = {
  nemesis_native: 'Nemesis Native',
  verified_partner: 'Partner Terverifikasi',
  independent: 'Independent',
}

export const FLEET_CATEGORY_LABELS: Record<string, string> = {
  ojol: 'Ojol / Ride-hailing',
  kurir: 'Kurir / Delivery',
  logistik: 'Logistik Last-mile',
  korporat: 'Armada Korporat',
}

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  motor_listrik: 'Motor Listrik',
  motor_kargo: 'Motor Kargo Listrik',
  mobil_listrik: 'Mobil Listrik',
  van_listrik: 'Van Listrik',
  truk_listrik: 'Truk Listrik',
  bus_listrik: 'Bus Listrik',
  pikap_listrik: 'Pikap Listrik',
}

export const CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Yogyakarta'] as const

export const DISTRIBUTION_DAY = 'Senin' // every Monday

export const SOLANA_EXPLORER_BASE = 'https://explorer.solana.com/tx'
