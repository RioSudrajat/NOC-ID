'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { MOCK_VEHICLES } from '@/data/vehicles'
import { VehiclePreVisitBrief } from '@/components/rwa/VehiclePreVisitBrief'
import type { RegisteredVehicle } from '@/types/rwa'
import { formatKm } from '@/lib/yield'
import { getHealthColor } from '@/lib/health'
import { X } from 'lucide-react'

// Fleet map needs dynamic import (leaflet SSR issue)
const FleetLeafletMap = dynamic(() => import('@/components/ui/FleetLeafletMap'), { ssr: false })

type StatusFilter = 'semua' | 'active' | 'maintenance' | 'idle' | 'offline'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: '#86EFAC' },
  maintenance: { label: 'Maintenance', color: '#FCD34D' },
  idle: { label: 'Idle', color: '#A1A1AA' },
  offline: { label: 'Offline', color: '#FCA5A5' },
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'idle', label: 'Idle' },
  { key: 'offline', label: 'Offline' },
]

// Convert RegisteredVehicle to FleetVehicle shape for the map
function toFleetVehicle(v: RegisteredVehicle) {
  return {
    id: v.id,
    vin: v.vin,
    name: `${v.brand} ${v.model} ${v.unitId}`,
    region: 'Jakarta',
    health: v.healthScore,
    odometer: v.odometer,
    lastService: `${v.lastServiceKm} km`,
    owner: v.operatorId,
    status: v.status === 'active' ? 'Active' : v.status === 'maintenance' ? 'Maintenance' : v.status === 'idle' ? 'Idle' : 'Offline',
    type: v.type,
    brand: v.brand,
    model: v.model,
  }
}

export default function FleetMapPage() {
  const [filter, setFilter] = useState<StatusFilter>('semua')
  const [selectedVehicle, setSelectedVehicle] = useState<RegisteredVehicle | null>(null)

  const filtered = filter === 'semua' ? MOCK_VEHICLES : MOCK_VEHICLES.filter((v) => v.status === filter)

  const counts = {
    total: 83,
    active: 71,
    maintenance: 5,
    idle: 7,
    offline: 0,
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Fleet Map
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>
          Pantau posisi dan status seluruh unit armada secara real-time
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: '#5EEAD4' },
          { label: 'Aktif', value: counts.active, color: '#86EFAC' },
          { label: 'Maintenance', value: counts.maintenance, color: '#FCD34D' },
          { label: 'Idle', value: counts.idle, color: '#A1A1AA' },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-card rounded-xl p-3 text-center"
            style={{ border: '1px solid rgba(94,234,212,0.15)' }}
          >
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="text-sm px-4 py-1.5 rounded-xl transition-all"
            style={{
              background: filter === f.key ? 'rgba(94,234,212,0.15)' : 'rgba(255,255,255,0.05)',
              color: filter === f.key ? '#5EEAD4' : 'var(--solana-text-muted)',
              border: filter === f.key ? '1px solid rgba(94,234,212,0.4)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ height: 400, border: '1px solid rgba(94,234,212,0.2)' }}
      >
        <FleetLeafletMap vehicles={filtered.map(toFleetVehicle)} />
      </div>

      {/* Vehicle List */}
      <div className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(94,234,212,0.1)', background: 'rgba(94,234,212,0.05)' }}>
          <h2 className="font-bold text-sm">Daftar Unit ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Unit ID', 'Tipe', 'Status', 'Node Score', 'Health', 'Km Hari Ini', 'Detail'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const st = STATUS_LABEL[v.status] ?? STATUS_LABEL.offline
                const hc = getHealthColor(v.healthScore)
                return (
                  <tr
                    key={v.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  >
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: '#5EEAD4' }}>{v.unitId}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--solana-text-muted)' }}>{v.brand} {v.model}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}35` }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{v.nodeScore}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: hc }}>{v.healthScore}</span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full" style={{ width: `${v.healthScore}%`, background: hc }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--solana-text-muted)' }}>{formatKm(v.odometer)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedVehicle(v)}
                        className="text-xs px-3 py-1 rounded-lg transition-colors"
                        style={{ background: 'rgba(94,234,212,0.1)', color: '#5EEAD4', border: '1px solid rgba(94,234,212,0.25)' }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Brief Panel (inline modal) */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--solana-dark)', border: '1px solid rgba(94,234,212,0.25)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(94,234,212,0.15)' }}>
              <h3 className="font-bold">Pre-Visit Brief — {selectedVehicle.unitId}</h3>
              <button onClick={() => setSelectedVehicle(null)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <VehiclePreVisitBrief vehicle={selectedVehicle} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
