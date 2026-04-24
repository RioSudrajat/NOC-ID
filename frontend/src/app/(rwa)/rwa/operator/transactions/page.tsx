'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { formatIDRX } from '@/lib/yield'

type TxFilter = 'semua' | 'flat_fee' | 'yield' | 'maintenance'

const FILTER_ITEMS: { key: TxFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'flat_fee', label: 'Flat Fee' },
  { key: 'yield', label: 'Distribusi Yield' },
  { key: 'maintenance', label: 'Maintenance Fund' },
]

interface TxRow {
  date: string
  type: TxFilter
  typeLabel: string
  unitPool: string
  amount: number
  status: string
  hash: string
}

const MOCK_TXS: TxRow[] = [
  { date: '2026-04-22', type: 'flat_fee', typeLabel: 'Flat Fee Harian', unitPool: '#NMS-0001', amount: 50000, status: 'Confirmed', hash: '9aKd3...pW7n' },
  { date: '2026-04-22', type: 'flat_fee', typeLabel: 'Flat Fee Harian', unitPool: '#NMS-0018', amount: 50000, status: 'Confirmed', hash: '2bLm8...qX4o' },
  { date: '2026-04-21', type: 'yield', typeLabel: 'Distribusi Yield', unitPool: 'Fleet Pool Batch #1', amount: 192000, status: 'Distributed', hash: '5cNp1...rY5p' },
  { date: '2026-04-20', type: 'flat_fee', typeLabel: 'Flat Fee Harian', unitPool: '#NMS-0055', amount: 60000, status: 'Confirmed', hash: '7dOq4...sZ6q' },
  { date: '2026-04-20', type: 'maintenance', typeLabel: 'Maintenance Fund', unitPool: '#NMS-0042', amount: 180000, status: 'Released', hash: '4xPq2...mR9k' },
  { date: '2026-04-18', type: 'yield', typeLabel: 'Distribusi Yield', unitPool: 'Fleet Pool Batch #1', amount: 188000, status: 'Distributed', hash: '3ePr7...tA7r' },
  { date: '2026-04-17', type: 'flat_fee', typeLabel: 'Flat Fee Harian', unitPool: '#NMS-0073', amount: 55000, status: 'Confirmed', hash: '6fQs9...uB8s' },
  { date: '2026-04-15', type: 'yield', typeLabel: 'Distribusi Yield', unitPool: 'Fleet Pool Batch #1', amount: 196000, status: 'Distributed', hash: '1gRt2...vC9t' },
  { date: '2026-04-10', type: 'maintenance', typeLabel: 'Maintenance Fund', unitPool: '#NMS-0018', amount: 150000, status: 'Released', hash: '7yRn5...vL2m' },
  { date: '2026-04-08', type: 'flat_fee', typeLabel: 'Flat Fee Harian', unitPool: '#NMS-0001', amount: 50000, status: 'Confirmed', hash: '8hSu5...wD0u' },
]

const STATUS_COLOR: Record<string, string> = {
  Confirmed: '#86EFAC',
  Distributed: '#5EEAD4',
  Released: '#FCD34D',
  Pending: '#A1A1AA',
}

const TYPE_COLOR: Record<TxFilter, string> = {
  flat_fee: '#5EEAD4',
  yield: '#86EFAC',
  maintenance: '#FCD34D',
  semua: '#A1A1AA',
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TxFilter>('semua')

  const filtered = filter === 'semua' ? MOCK_TXS : MOCK_TXS.filter((tx) => tx.type === filter)

  const totalIn = filtered.reduce((s, tx) => s + tx.amount, 0)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Transaksi & Distribusi
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>
          Riwayat seluruh transaksi on-chain: flat fee, distribusi yield, dan maintenance fund
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Txs (Filter)', value: filtered.length.toString(), color: '#5EEAD4' },
          { label: 'Total Volume', value: formatIDRX(totalIn), color: '#86EFAC' },
          { label: 'Yield Bulan Ini', value: formatIDRX(MOCK_TXS.filter(t => t.type === 'yield').reduce((s,t)=>s+t.amount,0)), color: '#A78BFA' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4" style={{ border: '1px solid rgba(94,234,212,0.15)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--solana-text-muted)' }}>{s.label}</div>
            <div className="font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_ITEMS.map((f) => (
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

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(94,234,212,0.06)', borderBottom: '1px solid rgba(94,234,212,0.15)' }}>
                {['Tanggal', 'Tipe', 'Unit / Pool', 'Jumlah IDRX', 'Status', 'Hash'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--solana-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--solana-text-muted)' }}>{tx.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${TYPE_COLOR[tx.type]}15`,
                        color: TYPE_COLOR[tx.type],
                        border: `1px solid ${TYPE_COLOR[tx.type]}30`,
                      }}
                    >
                      {tx.typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#5EEAD4' }}>{tx.unitPool}</td>
                  <td className="px-4 py-3 font-bold">{formatIDRX(tx.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLOR[tx.status] ?? '#A1A1AA'}15`,
                        color: STATUS_COLOR[tx.status] ?? '#A1A1AA',
                        border: `1px solid ${STATUS_COLOR[tx.status] ?? '#A1A1AA'}30`,
                      }}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-xs font-mono hover:opacity-80 transition-opacity" style={{ color: '#5EEAD4' }}>
                      {tx.hash} <ExternalLink className="w-3 h-3" />
                    </button>
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
