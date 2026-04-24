'use client'

import Link from 'next/link'
import { LayoutDashboard, Map, Plus, Wrench, ArrowRight, Activity, Zap, TrendingUp } from 'lucide-react'
import { MOCK_VEHICLES } from '@/data/vehicles'
import { MOCK_OPERATOR_PROFILE } from '@/data/operators'
import { AIFleetInsights } from '@/components/rwa/AIFleetInsights'
import { OperatorPoolBadge } from '@/components/rwa/OperatorPoolBadge'
import type { AIFleetInsight } from '@/types/rwa'
import { formatIDRX, formatKm } from '@/lib/yield'
import { getHealthColor } from '@/lib/health'

const KPI_CARDS = [
  { label: 'Total Unit Terdaftar', value: '83 unit', icon: '🚗', color: '#5EEAD4', sub: `Pool: ${MOCK_OPERATOR_PROFILE.poolId}` },
  { label: 'Unit Aktif Hari Ini', value: '71 unit', icon: '⚡', color: '#86EFAC', sub: '85.5% utilisasi' },
  { label: 'Yield Didistribusikan', value: 'Rp 28.4M', icon: '💰', color: '#FCD34D', sub: 'Total kumulatif IDRX' },
  { label: 'Fleet Health Avg', value: '83/100', icon: '❤️', color: '#FCA5A5', sub: 'Di atas target 80' },
]

const RECENT_ACTIVITY = [
  { icon: '🔧', text: 'Unit #NMS-0042 masuk maintenance', time: '2 jam lalu', color: '#FCD34D' },
  { icon: '💰', text: 'Yield didistribusikan: 192.000 IDRX', time: '6 jam lalu', color: '#86EFAC' },
  { icon: '🆕', text: 'Unit #NMS-0073 berhasil di-mint', time: '1 hari lalu', color: '#5EEAD4' },
  { icon: '📍', text: 'Unit #NMS-0018 odometer 22.341 km', time: '1 hari lalu', color: '#A1A1AA' },
  { icon: '✅', text: 'KYC bisnis terverifikasi', time: '3 hari lalu', color: '#86EFAC' },
]

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
]

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: '#86EFAC' },
  maintenance: { label: 'Maintenance', color: '#FCD34D' },
  idle: { label: 'Idle', color: '#A1A1AA' },
  offline: { label: 'Offline', color: '#FCA5A5' },
}

export default function OperatorOverviewPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
            {MOCK_OPERATOR_PROFILE.businessName}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <OperatorPoolBadge type={MOCK_OPERATOR_PROFILE.type} />
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(134,239,172,0.15)', color: '#86EFAC', border: '1px solid rgba(134,239,172,0.3)' }}
            >
              KYC Terverifikasi ✓
            </span>
            <span className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>{MOCK_OPERATOR_PROFILE.city}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/rwa/operator/mint" className="glow-btn text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Mint Kendaraan
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            className="glass-card rounded-2xl p-5"
            style={{ border: '1px solid rgba(94,234,212,0.2)' }}
          >
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-xs font-semibold mt-1">{kpi.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pool Summary */}
        <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--solana-text-muted)' }}>
            Pool Summary
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Pool</span>
              <span className="font-semibold text-sm">Fleet Pool Batch #1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Investors</span>
              <span className="font-semibold text-sm">124 orang</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>TVL</span>
              <span className="font-bold gradient-text">2.4B IDRX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Tipe Operator</span>
              <OperatorPoolBadge type={MOCK_OPERATOR_PROFILE.type} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Distribusi Berikutnya</span>
              <span className="font-semibold text-sm" style={{ color: '#5EEAD4' }}>Senin depan</span>
            </div>
          </div>
        </div>

        {/* Vehicle Status Overview */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>
              Status Unit (5 dari 83)
            </h2>
            <Link href="/rwa/operator/fleet" className="text-xs flex items-center gap-1" style={{ color: '#5EEAD4' }}>
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {MOCK_VEHICLES.map((v) => {
              const st = STATUS_LABEL[v.status] ?? STATUS_LABEL.offline
              const hc = getHealthColor(v.healthScore)
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="font-mono text-xs font-bold w-24 shrink-0" style={{ color: '#5EEAD4' }}>{v.unitId}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}35` }}
                  >
                    {st.label}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="text-xs font-bold" style={{ color: hc }}>{v.healthScore}</div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${v.healthScore}%`, background: hc }} />
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--solana-text-muted)' }}>{formatKm(v.odometer)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--solana-text-muted)' }}>
            Aktivitas Terbaru
          </h2>
          <div className="flex flex-col gap-3">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base shrink-0">{act.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{act.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights preview */}
        <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>
              AI Fleet Insights
            </h2>
            <Link href="/rwa/operator/analytics" className="text-xs flex items-center gap-1" style={{ color: '#5EEAD4' }}>
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <AIFleetInsights insights={AI_INSIGHTS} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--solana-text-muted)' }}>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/rwa/operator/mint" className="glow-btn text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Mint Kendaraan Baru
          </Link>
          <Link href="/rwa/operator/fleet" className="glow-btn-outline text-sm flex items-center gap-2">
            <Map className="w-4 h-4" /> Lihat Fleet Map
          </Link>
          <Link href="/rwa/operator/maintenance" className="glow-btn-outline text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Maintenance Fund
          </Link>
          <Link href="/rwa/operator/analytics" className="glow-btn-outline text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}
