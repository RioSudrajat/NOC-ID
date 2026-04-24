import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const ASSET_DATA: Record<string, {
  icon: string
  name: string
  category: string
  description: string
  specs: { label: string; value: string }[]
  requirements: string[]
  apy: string
  pricePerShare: number
  minFleet: number
}> = {
  'motor-listrik': {
    icon: '🛵',
    name: 'Motor Listrik',
    category: 'Ojol / Kurir',
    description: 'Motor listrik paling populer untuk operasional harian. Cocok untuk ojek online dan pengiriman paket B2C.',
    specs: [
      { label: 'Range/charge', value: '60–120 km' },
      { label: 'Kecepatan maks', value: '60–80 km/jam' },
      { label: 'Kapasitas beban', value: '100–150 kg' },
      { label: 'Servis interval', value: 'Setiap 2.500 km' },
      { label: 'Masa pakai', value: '5–7 tahun' },
    ],
    requirements: ['Min. 1 unit', 'KYC operator aktif', 'GPS device terpasang', 'SLA operasional harian'],
    apy: '12–18%',
    pricePerShare: 30000,
    minFleet: 1,
  },
  'motor-kargo': {
    icon: '📦',
    name: 'Motor Kargo Listrik',
    category: 'Logistik / Kurir',
    description: 'Motor kargo dengan box besar untuk last-mile delivery dan logistik gudang urban.',
    specs: [
      { label: 'Range/charge', value: '50–100 km' },
      { label: 'Kecepatan maks', value: '50–70 km/jam' },
      { label: 'Kapasitas beban', value: '150–200 kg' },
      { label: 'Servis interval', value: 'Setiap 2.500 km' },
      { label: 'Masa pakai', value: '4–6 tahun' },
    ],
    requirements: ['Min. 5 unit', 'KYC bisnis', 'GPS device terpasang', 'Kontrak logistik aktif'],
    apy: '10–16%',
    pricePerShare: 30000,
    minFleet: 5,
  },
  'mobil-listrik': {
    icon: '🚗',
    name: 'Mobil Listrik',
    category: 'Korporat',
    description: 'Kendaraan listrik roda empat untuk armada korporat, ride-hailing premium, dan pool kendaraan perusahaan.',
    specs: [
      { label: 'Range/charge', value: '200–400 km' },
      { label: 'Kecepatan maks', value: '100–150 km/jam' },
      { label: 'Kapasitas', value: '4–5 penumpang' },
      { label: 'Servis interval', value: 'Setiap 5.000 km' },
      { label: 'Masa pakai', value: '7–10 tahun' },
    ],
    requirements: ['Min. 3 unit', 'KYC bisnis (PT)', 'GPS + telematics aktif', 'Asuransi kendaraan'],
    apy: '8–14%',
    pricePerShare: 45000,
    minFleet: 3,
  },
  'van-listrik': {
    icon: '🚐',
    name: 'Van Listrik',
    category: 'Logistik',
    description: 'Van listrik untuk pengiriman volume besar, catering, dan logistik mid-mile.',
    specs: [
      { label: 'Range/charge', value: '150–300 km' },
      { label: 'Kecepatan maks', value: '90–120 km/jam' },
      { label: 'Kapasitas beban', value: '500–1.000 kg' },
      { label: 'Servis interval', value: 'Setiap 5.000 km' },
      { label: 'Masa pakai', value: '7–10 tahun' },
    ],
    requirements: ['Min. 3 unit', 'KYC bisnis', 'GPS terpasang', 'Kontrak logistik aktif'],
    apy: '9–15%',
    pricePerShare: 50000,
    minFleet: 3,
  },
  'truk-listrik': {
    icon: '🚛',
    name: 'Truk Listrik',
    category: 'Logistik',
    description: 'Truk listrik kapasitas besar untuk distribusi barang antar kota jarak menengah.',
    specs: [
      { label: 'Range/charge', value: '200–400 km' },
      { label: 'Kecepatan maks', value: '80–100 km/jam' },
      { label: 'Kapasitas beban', value: '3–8 ton' },
      { label: 'Servis interval', value: 'Setiap 7.500 km' },
      { label: 'Masa pakai', value: '10–15 tahun' },
    ],
    requirements: ['Min. 2 unit', 'KYC bisnis (PT)', 'GPS + telematics', 'Izin angkutan barang'],
    apy: '8–13%',
    pricePerShare: 75000,
    minFleet: 2,
  },
  'bus-listrik': {
    icon: '🚌',
    name: 'Bus Listrik',
    category: 'Korporat',
    description: 'Bus listrik untuk angkutan karyawan korporat, wisata, dan antar-jemput pabrik.',
    specs: [
      { label: 'Range/charge', value: '200–350 km' },
      { label: 'Kecepatan maks', value: '80–100 km/jam' },
      { label: 'Kapasitas', value: '20–50 penumpang' },
      { label: 'Servis interval', value: 'Setiap 10.000 km' },
      { label: 'Masa pakai', value: '10–15 tahun' },
    ],
    requirements: ['Min. 2 unit', 'KYC bisnis (PT)', 'GPS + telematics', 'Izin angkutan penumpang', 'Kontrak korporat aktif'],
    apy: '7–12%',
    pricePerShare: 100000,
    minFleet: 2,
  },
}

export default function AssetDetailPage({ params }: { params: { assetId: string } }) {
  const asset = ASSET_DATA[params.assetId]

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--solana-dark)' }}>
        <div className="text-center">
          <p className="text-2xl mb-4">🔍</p>
          <p className="font-bold mb-2">Tipe aset tidak ditemukan</p>
          <Link href="/rwa/assets" className="text-sm" style={{ color: '#5EEAD4' }}>← Kembali ke daftar aset</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16 px-6" style={{ background: 'var(--solana-dark)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/rwa/assets" className="text-sm flex items-center gap-1 mb-8" style={{ color: 'var(--solana-text-muted)' }}>
          ← Kembali ke daftar aset
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: 'rgba(94,234,212,0.1)', border: '1px solid rgba(94,234,212,0.25)' }}
          >
            {asset.icon}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
              {asset.name}
            </h1>
            <span
              className="text-xs px-2.5 py-1 rounded-full mt-1 inline-block"
              style={{ background: 'rgba(94,234,212,0.1)', color: '#5EEAD4', border: '1px solid rgba(94,234,212,0.25)' }}
            >
              {asset.category}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--solana-text-muted)' }}>{asset.description}</p>

        {/* Specs */}
        <div className="glass-card rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--solana-text-muted)' }}>Spesifikasi</h2>
          <div className="flex flex-col gap-3">
            {asset.specs.map((s) => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>{s.label}</span>
                <span className="font-semibold text-sm">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="glass-card rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--solana-text-muted)' }}>Persyaratan Tokenisasi</h2>
          <ul className="flex flex-col gap-2">
            {asset.requirements.map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm">
                <span style={{ color: '#5EEAD4' }}>✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--solana-text-muted)' }}>APY Proyeksi</div>
            <div className="font-black gradient-text">{asset.apy}</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--solana-text-muted)' }}>Harga/Share</div>
            <div className="font-black">Rp {asset.pricePerShare.toLocaleString('id-ID')}</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--solana-text-muted)' }}>Min. Fleet</div>
            <div className="font-black">{asset.minFleet} unit</div>
          </div>
        </div>

        {/* CTA */}
        <Link href="/rwa/operator/mint" className="glow-btn text-base flex items-center justify-center gap-2 py-4">
          Tokenisasi Tipe Ini <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
