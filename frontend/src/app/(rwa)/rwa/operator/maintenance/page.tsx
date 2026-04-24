'use client'

import { MaintenanceFundTracker } from '@/components/rwa/MaintenanceFundTracker'
import { MOCK_VEHICLES } from '@/data/vehicles'
import type { MaintenanceFundEntry } from '@/types/rwa'
import { formatIDRX } from '@/lib/yield'
import { ExternalLink } from 'lucide-react'

const MOCK_FUND_LOG: MaintenanceFundEntry[] = [
  {
    id: 'mf-001', vehicleId: 'vhc-0042', unitId: '#NMS-0042',
    type: 'release', amount: 180000, triggeredAtKm: 7500,
    workshopId: 'ws-001', workshopName: 'Bengkel Mitra JKT-01',
    serviceProofHash: '4xPq2...mR9k', serviceType: 'Ganti Ban',
    status: 'released', timestamp: '2026-04-10T08:30:00.000Z',
  },
  {
    id: 'mf-002', vehicleId: 'vhc-0018', unitId: '#NMS-0018',
    type: 'release', amount: 150000, triggeredAtKm: 20000,
    workshopId: 'ws-002', workshopName: 'Workshop Nemesis',
    serviceProofHash: '7yRn5...vL2m', serviceType: 'Servis Rutin',
    status: 'released', timestamp: '2026-04-08T10:00:00.000Z',
  },
  {
    id: 'mf-003', vehicleId: 'vhc-0055', unitId: '#NMS-0055',
    type: 'release', amount: 95000, triggeredAtKm: 5000,
    workshopId: 'ws-001', workshopName: 'Bengkel Mitra JKT-01',
    serviceType: 'Servis Rutin',
    status: 'pending', timestamp: '2026-04-20T14:00:00.000Z',
  },
  {
    id: 'mf-004', vehicleId: 'vhc-0001', unitId: '#NMS-0001',
    type: 'release', amount: 210000, triggeredAtKm: 12500,
    serviceType: 'Ganti Rem',
    status: 'pending', timestamp: '2026-04-22T09:00:00.000Z',
  },
  {
    id: 'mf-005', vehicleId: 'vhc-0073', unitId: '#NMS-0073',
    type: 'deposit', amount: 18200,
    status: 'confirmed', timestamp: '2026-03-15T00:00:00.000Z',
  },
]

const MAINTENANCE_LOG = [
  { date: '2026-04-10', unit: '#NMS-0042', service: 'Ganti Ban', workshop: 'Bengkel Mitra JKT-01', cost: 180000, status: 'Selesai', hash: '4xPq2...mR9k' },
  { date: '2026-04-08', unit: '#NMS-0018', service: 'Servis Rutin', workshop: 'Workshop Nemesis', cost: 150000, status: 'Selesai', hash: '7yRn5...vL2m' },
  { date: '2026-04-20', unit: '#NMS-0055', service: 'Servis Rutin', workshop: 'Bengkel Mitra JKT-01', cost: 95000, status: 'Pending', hash: '—' },
  { date: '2026-04-22', unit: '#NMS-0001', service: 'Ganti Rem', workshop: 'TBD', cost: 210000, status: 'Pending', hash: '—' },
  { date: '2026-03-15', unit: '#NMS-0073', service: 'Deposit Fund', workshop: '—', cost: 18200, status: 'Confirmed', hash: '2zA1p...xQ8w' },
]

const totalFund = MOCK_VEHICLES.reduce((s, v) => s + v.maintenanceFundBalance, 0)
const pendingCount = MOCK_FUND_LOG.filter((e) => e.status === 'pending').length
const completedMonth = MOCK_FUND_LOG.filter((e) => e.status === 'released').length

const STATUS_COLOR: Record<string, string> = {
  Selesai: '#86EFAC',
  Pending: '#FCD34D',
  Confirmed: '#5EEAD4',
}

export default function MaintenancePage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Maintenance Fund Tracker
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>
          Pantau saldo, riwayat, dan release dana maintenance per unit
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--solana-text-muted)' }}>Total Fund Balance</div>
          <div className="text-xl font-black gradient-text">{formatIDRX(totalFund)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--solana-text-muted)' }}>Dari {MOCK_VEHICLES.length} unit</div>
        </div>
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(252,211,77,0.2)' }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--solana-text-muted)' }}>Pending Releases</div>
          <div className="text-xl font-black" style={{ color: '#FCD34D' }}>{pendingCount}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--solana-text-muted)' }}>Menunggu konfirmasi</div>
        </div>
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(134,239,172,0.2)' }}>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--solana-text-muted)' }}>Selesai Bulan Ini</div>
          <div className="text-xl font-black" style={{ color: '#86EFAC' }}>{completedMonth}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--solana-text-muted)' }}>Servis terverifikasi</div>
        </div>
      </div>

      {/* Tracker */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--solana-text-muted)' }}>
          Status per Unit
        </h2>
        <MaintenanceFundTracker vehicles={MOCK_VEHICLES} fundLog={MOCK_FUND_LOG} />
      </div>

      {/* Maintenance Log Table */}
      <div className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(94,234,212,0.1)', background: 'rgba(94,234,212,0.05)' }}>
          <h2 className="font-bold text-sm">Log Maintenance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Tanggal', 'Unit', 'Jenis Servis', 'Workshop', 'Biaya', 'Status', 'Hash'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MAINTENANCE_LOG.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < MAINTENANCE_LOG.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--solana-text-muted)' }}>{row.date}</td>
                  <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: '#5EEAD4' }}>{row.unit}</td>
                  <td className="px-4 py-3 text-sm">{row.service}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--solana-text-muted)' }}>{row.workshop}</td>
                  <td className="px-4 py-3 font-semibold text-sm">{formatIDRX(row.cost)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${STATUS_COLOR[row.status] ?? '#A1A1AA'}18`,
                        color: STATUS_COLOR[row.status] ?? '#A1A1AA',
                        border: `1px solid ${STATUS_COLOR[row.status] ?? '#A1A1AA'}30`,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.hash !== '—' ? (
                      <button className="flex items-center gap-1 text-xs font-mono" style={{ color: '#5EEAD4' }}>
                        {row.hash} <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
