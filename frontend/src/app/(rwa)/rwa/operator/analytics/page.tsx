'use client'

import { AIFleetInsights } from '@/components/rwa/AIFleetInsights'
import { InteractiveDonutChart } from '@/components/ui/InteractiveDonutChart'
import { WorkshopRevenueChart } from '@/components/ui/WorkshopRevenueChart'
import type { AIFleetInsight } from '@/types/rwa'

const AI_INSIGHTS: AIFleetInsight[] = [
  {
    unitId: '#NMS-0042',
    severity: 'critical',
    message: 'Ban belakang: keausan tidak merata',
    prediction: 'Perlu penggantian dalam 14 hari',
    confidence: 87,
    category: 'maintenance',
  },
  {
    unitId: '#NMS-0018',
    severity: 'warning',
    message: 'Efisiensi baterai turun 12%',
    prediction: 'Pantau selama 7 hari ke depan',
    confidence: 72,
    category: 'battery',
  },
  {
    severity: 'info',
    message: '3 unit di atas avg idle rate minggu ini',
    prediction: 'Investigasi pola pengemudi',
    confidence: 65,
    category: 'utilization',
  },
]

const DONUT_DATA = [
  { id: 'active', label: 'Aktif', value: 71, color: '#86EFAC' },
  { id: 'maintenance', label: 'Maintenance', value: 6, color: '#FCD34D' },
  { id: 'idle', label: 'Idle', value: 18, color: '#A1A1AA' },
  { id: 'offline', label: 'Offline', value: 5, color: '#FCA5A5' },
]

const STATS_ROW = [
  { label: 'Avg Health Score', value: '83/100', color: '#86EFAC', icon: '❤️' },
  { label: 'Utilisasi Rate', value: '85.5%', color: '#5EEAD4', icon: '⚡' },
  { label: 'Avg Km/Unit/Day', value: '72 km', color: '#FCD34D', icon: '🛣️' },
  { label: 'Yield Bulan Ini', value: 'Rp 4.2M', color: '#A78BFA', icon: '💰' },
]

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Analytics & AI Insights
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>
          Data performa armada dan prediksi berbasis AI
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_ROW.map((s) => (
          <div
            key={s.label}
            className="glass-card rounded-2xl p-5"
            style={{ border: '1px solid rgba(94,234,212,0.15)' }}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--solana-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status Donut */}
        <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-1" style={{ color: 'var(--solana-text-muted)' }}>
            Fleet Health Distribution
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--solana-text-muted)' }}>Status distribusi 83 unit armada</p>
          <InteractiveDonutChart data={DONUT_DATA} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {DONUT_DATA.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span style={{ color: 'var(--solana-text-muted)' }}>{d.label}</span>
                <span className="font-bold ml-auto" style={{ color: d.color }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Fleet Insights */}
        <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-1" style={{ color: 'var(--solana-text-muted)' }}>
            AI Fleet Insights
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--solana-text-muted)' }}>Prediksi berbasis data GPS & sensor kendaraan</p>
          <AIFleetInsights insights={AI_INSIGHTS} />
        </div>
      </div>

      {/* Yield Distribution Chart */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-1" style={{ color: 'var(--solana-text-muted)' }}>
          Distribusi Yield Mingguan
        </h2>
        <p className="text-xs mb-2" style={{ color: 'var(--solana-text-muted)' }}>
          Total IDRX yang terdistribusi ke investor per hari dalam 7 hari terakhir
        </p>
        <WorkshopRevenueChart />
      </div>

      {/* Performance Table */}
      <div className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(94,234,212,0.1)', background: 'rgba(94,234,212,0.05)' }}>
          <h2 className="font-bold text-sm">Performa Per Kategori</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Kategori', 'Unit', 'Avg Health', 'Avg Km/Hari', 'Utilisasi', 'Yield/Unit/Minggu'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Ojol', unit: 38, health: 87, km: 78, util: '89%', yield: 'Rp 48.000' },
                { cat: 'Kurir', unit: 31, health: 81, km: 65, util: '83%', yield: 'Rp 42.000' },
                { cat: 'Logistik', unit: 14, health: 79, km: 58, util: '79%', yield: 'Rp 55.000' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td className="px-4 py-3 font-semibold">{row.cat}</td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#86EFAC' }}>{row.health}</td>
                  <td className="px-4 py-3">{row.km} km</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#5EEAD4' }}>{row.util}</td>
                  <td className="px-4 py-3 font-semibold gradient-text">{row.yield}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
