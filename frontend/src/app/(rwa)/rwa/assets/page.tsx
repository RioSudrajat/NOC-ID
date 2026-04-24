import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { VEHICLE_TYPE_LABELS, FLEET_CATEGORY_LABELS } from '@/constants/nemesis'

const ASSET_TYPES = [
  {
    id: 'motor-listrik',
    type: 'motor_listrik',
    categories: ['ojol', 'kurir'],
    icon: '🛵',
    minFleet: 1,
    pricePerShare: 30000,
    description: 'Motor listrik untuk ojek online dan pengiriman paket. ROI harian dari flat fee driver.',
    apy: '12–18%',
  },
  {
    id: 'motor-kargo',
    type: 'motor_kargo',
    categories: ['logistik', 'kurir'],
    icon: '📦',
    minFleet: 5,
    pricePerShare: 30000,
    description: 'Motor kargo listrik untuk last-mile delivery dan logistik gudang.',
    apy: '10–16%',
  },
  {
    id: 'mobil-listrik',
    type: 'mobil_listrik',
    categories: ['korporat'],
    icon: '🚗',
    minFleet: 3,
    pricePerShare: 45000,
    description: 'Mobil listrik untuk armada korporat dan ride-hailing premium.',
    apy: '8–14%',
  },
  {
    id: 'van-listrik',
    type: 'van_listrik',
    categories: ['logistik'],
    icon: '🚐',
    minFleet: 3,
    pricePerShare: 50000,
    description: 'Van listrik untuk pengiriman volume besar dan logistik mid-mile.',
    apy: '9–15%',
  },
  {
    id: 'truk-listrik',
    type: 'truk_listrik',
    categories: ['logistik'],
    icon: '🚛',
    minFleet: 2,
    pricePerShare: 75000,
    description: 'Truk listrik untuk distribusi barang jarak menengah.',
    apy: '8–13%',
  },
  {
    id: 'bus-listrik',
    type: 'bus_listrik',
    categories: ['korporat'],
    icon: '🚌',
    minFleet: 2,
    pricePerShare: 100000,
    description: 'Bus listrik untuk angkutan karyawan korporat dan wisata.',
    apy: '7–12%',
  },
]

export default function AssetsPage() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: 'var(--solana-dark)' }}>
      {/* Back */}
      <div className="max-w-5xl mx-auto mb-10">
        <Link href="/rwa" className="text-sm flex items-center gap-1" style={{ color: 'var(--solana-text-muted)' }}>
          ← Kembali ke RWA
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
          style={{ background: 'rgba(94,234,212,0.1)', color: '#5EEAD4', border: '1px solid rgba(94,234,212,0.25)' }}
        >
          Modul Aset 01
        </span>
        <h1
          className="text-3xl md:text-4xl font-black mb-4 gradient-text"
          style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}
        >
          Aset yang Bisa Ditokenisasi
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--solana-text-muted)' }}>
          Pilih tipe kendaraan listrik yang ingin lo tokenisasi dan lihat detail persyaratan serta proyeksi imbal hasil.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ASSET_TYPES.map((asset) => (
          <div
            key={asset.id}
            className="glass-card rounded-2xl p-5 flex flex-col gap-4 hover:border-teal-400/40 transition-all"
            style={{ border: '1px solid rgba(94,234,212,0.2)' }}
          >
            {/* Icon + type */}
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'rgba(94,234,212,0.08)', border: '1px solid rgba(94,234,212,0.2)' }}
              >
                {asset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{VEHICLE_TYPE_LABELS[asset.type]}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {asset.categories.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--solana-text-muted)' }}
                    >
                      {FLEET_CATEGORY_LABELS[c] ?? c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--solana-text-muted)' }}>
              {asset.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>Min. Fleet</div>
                <div className="font-bold text-sm mt-0.5">{asset.minFleet} unit</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: 'rgba(94,234,212,0.06)' }}>
                <div className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>Proyeksi APY</div>
                <div className="font-bold text-sm mt-0.5 gradient-text">{asset.apy}</div>
              </div>
            </div>

            <Link
              href={`/rwa/assets/${asset.id}`}
              className="glow-btn-outline text-xs flex items-center justify-center gap-1.5 mt-auto"
            >
              Detail & Persyaratan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
