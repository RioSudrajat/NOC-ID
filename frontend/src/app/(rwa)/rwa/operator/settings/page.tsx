'use client'

import { useState } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import { MOCK_OPERATOR_PROFILE } from '@/data/operators'
import { OperatorPoolBadge } from '@/components/rwa/OperatorPoolBadge'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    await new Promise((r) => setTimeout(r, 800))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>
          Kelola profil operator, konfigurasi pool, dan pengaturan GPS
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: 'var(--solana-text-muted)' }}>
          Profil Operator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Nama Bisnis
            </label>
            <input
              type="text"
              className="input-field"
              defaultValue={MOCK_OPERATOR_PROFILE.businessName}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Kota
            </label>
            <input
              type="text"
              className="input-field"
              defaultValue={MOCK_OPERATOR_PROFILE.city}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Wallet Address
            </label>
            <input
              type="text"
              className="input-field mono"
              defaultValue="NMSop1Xk7Rz9mP3dLvQ2wYfH8eT6sN5cBuA4gJ1xyz9"
              readOnly
              style={{ opacity: 0.7 }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Status KYC
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(134,239,172,0.15)', color: '#86EFAC', border: '1px solid rgba(134,239,172,0.3)' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Tipe Operator
            </label>
            <div className="mt-2">
              <OperatorPoolBadge type={MOCK_OPERATOR_PROFILE.type} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Email Kontak
            </label>
            <input
              type="email"
              className="input-field"
              defaultValue="ops@nemesisfleet.id"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              No. Telepon
            </label>
            <input
              type="tel"
              className="input-field"
              defaultValue="+62 812-3456-7890"
            />
          </div>
        </div>
      </div>

      {/* Pool Settings */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: 'var(--solana-text-muted)' }}>
          Konfigurasi Pool
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Pool Saat Ini</span>
            <span className="font-semibold text-sm">Fleet Pool Batch #1</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Protocol Fee</span>
            <span className="font-semibold text-sm text-amber-300">4%</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Fleet Manager Fee</span>
            <span className="font-semibold text-sm text-amber-300">3%</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Maintenance Fund</span>
            <span className="font-semibold text-sm text-amber-300">3%</span>
          </div>
        </div>
        <div
          className="mt-4 p-3 rounded-xl text-xs"
          style={{ background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.2)', color: 'var(--solana-text-muted)' }}
        >
          Fee dikonfigurasi oleh protokol dan tidak dapat diubah oleh operator secara individual.
          Perubahan membutuhkan governance vote.
        </div>
      </div>

      {/* GPS Settings */}
      <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
        <h2 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: 'var(--solana-text-muted)' }}>
          Pengaturan GPS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Tipe GPS Default
            </label>
            <select className="input-field">
              <option value="phone">Phone-based GPS (MVP)</option>
              <option value="hardware">Hardware GPS Device</option>
              <option value="obd">OBD-II GPS Dongle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Interval Reporting
            </label>
            <select className="input-field" defaultValue="60">
              <option value="30">30 detik</option>
              <option value="60">60 detik</option>
              <option value="120">2 menit</option>
              <option value="300">5 menit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Threshold Idle (menit)
            </label>
            <input type="number" className="input-field" defaultValue={15} min={5} max={60} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>
              Geofence Radius (km)
            </label>
            <input type="number" className="input-field" defaultValue={50} min={1} max={500} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="glow-btn flex items-center gap-2 px-8 py-3"
        >
          <Save className="w-4 h-4" />
          Simpan Perubahan
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#86EFAC' }}>
            <CheckCircle2 className="w-4 h-4" /> Tersimpan!
          </span>
        )}
      </div>
    </div>
  )
}
