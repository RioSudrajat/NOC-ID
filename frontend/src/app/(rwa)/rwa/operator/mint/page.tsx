'use client'

import { useState } from 'react'
import { Plus, FileSpreadsheet, Cpu, Loader2 } from 'lucide-react'

type TabKey = 'single' | 'csv'

const VEHICLE_TYPES = ['Motor Listrik', 'Motor Kargo', 'Mobil Listrik', 'Van Listrik', 'Truk Listrik', 'Bus Listrik']
const CONTRACT_TYPES = [{ value: 'rent', label: 'Rent — Flat Fee Harian' }, { value: 'cicil', label: 'Cicil — Cicilan Kepemilikan' }]

interface RWAVehicleEntry {
  vin: string
  type: string
  year: string
  brand: string
  model: string
  gpsDeviceId: string
  contractType: string
  flatFeeDaily: string
}

const BLANK_VEHICLE: RWAVehicleEntry = {
  vin: '',
  type: '',
  year: '2025',
  brand: '',
  model: '',
  gpsDeviceId: '',
  contractType: 'rent',
  flatFeeDaily: '50000',
}

export default function MintPage() {
  const [tab, setTab] = useState<TabKey>('single')
  const [vehicles, setVehicles] = useState<RWAVehicleEntry[]>([{ ...BLANK_VEHICLE }])
  const [minting, setMinting] = useState(false)
  const [mintDone, setMintDone] = useState(false)
  const [csvFile, setCsvFile] = useState<string | null>(null)

  function updateVehicle(i: number, patch: Partial<RWAVehicleEntry>) {
    setVehicles((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, { ...BLANK_VEHICLE }])
  }

  function removeVehicle(i: number) {
    setVehicles((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleMint() {
    setMinting(true)
    await new Promise((r) => setTimeout(r, 2000))
    setMinting(false)
    setMintDone(true)
  }

  if (mintDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-md mx-auto">
        <div className="text-6xl">✅</div>
        <h2 className="text-xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Kendaraan Berhasil Di-Mint!
        </h2>
        <p className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>
          {vehicles.length} unit kendaraan telah ditokenisasi ke pool. Share akan tersedia untuk investor segera.
        </p>
        <div
          className="w-full p-4 rounded-xl text-left"
          style={{ background: 'rgba(94,234,212,0.07)', border: '1px solid rgba(94,234,212,0.25)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#5EEAD4' }}>On-chain Hash (mock)</p>
          <p className="font-mono text-xs break-all" style={{ color: 'var(--solana-text-muted)' }}>
            3xR7mNkP2vWqJzLfDhUiCbEtYsXaGpOnV5wM9jKcHrT1eAdNFBSQZul6oIvmyW4
          </p>
        </div>
        <button onClick={() => { setMintDone(false); setVehicles([{ ...BLANK_VEHICLE }]) }} className="glow-btn-outline">
          Mint Unit Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Daftarkan Kendaraan Baru
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--solana-text-muted)' }}>
          Tokenisasi kendaraan listrik ke dalam pool
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {([['single', 'Satu per Satu'], ['csv', 'Import CSV']] as [TabKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="text-sm px-5 py-2 rounded-lg transition-all font-semibold"
            style={{
              background: tab === key ? 'rgba(94,234,212,0.15)' : 'transparent',
              color: tab === key ? '#5EEAD4' : 'var(--solana-text-muted)',
              border: tab === key ? '1px solid rgba(94,234,212,0.35)' : '1px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <>
          <div className="flex flex-col gap-4">
            {vehicles.map((v, i) => (
              <div key={i} className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm" style={{ color: '#5EEAD4' }}>Unit #{i + 1}</span>
                  {vehicles.length > 1 && (
                    <button
                      onClick={() => removeVehicle(i)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(252,165,165,0.1)', color: '#FCA5A5', border: '1px solid rgba(252,165,165,0.25)' }}
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>VIN (17 karakter)</label>
                    <input type="text" className="input-field mono uppercase" placeholder="NMS2026JKT0001" maxLength={17} value={v.vin} onChange={e => updateVehicle(i, { vin: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>Tipe Kendaraan</label>
                    <select className="input-field" value={v.type} onChange={e => updateVehicle(i, { type: e.target.value })}>
                      <option value="" disabled>Pilih tipe...</option>
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>Brand</label>
                    <input type="text" className="input-field" placeholder="Gesits / Viar / Volta" value={v.brand} onChange={e => updateVehicle(i, { brand: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>Model</label>
                    <input type="text" className="input-field" placeholder="G1 / Q1 / Charge" value={v.model} onChange={e => updateVehicle(i, { model: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>Tahun</label>
                    <input type="number" className="input-field" min="2020" max="2027" value={v.year} onChange={e => updateVehicle(i, { year: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>GPS Device ID (Phone IMEI)</label>
                    <input type="text" className="input-field mono" placeholder="352999111234567" value={v.gpsDeviceId} onChange={e => updateVehicle(i, { gpsDeviceId: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>Tipe Kontrak</label>
                    <select className="input-field" value={v.contractType} onChange={e => updateVehicle(i, { contractType: e.target.value })}>
                      {CONTRACT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--solana-text-muted)' }}>Flat Fee Harian (IDR)</label>
                    <input type="number" className="input-field" placeholder="50000" value={v.flatFeeDaily} onChange={e => updateVehicle(i, { flatFeeDaily: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addVehicle} className="glow-btn-outline gap-2 border-dashed py-3.5" style={{ border: '2px dashed rgba(94, 234, 212, 0.3)' }}>
            <Plus className="w-4 h-4" /> Tambah Unit Lagi
          </button>

          {/* Mint Summary */}
          <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.2)' }}>
            <h3 className="font-bold text-sm mb-4">Ringkasan Pendaftaran</h3>
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--solana-text-muted)' }}>Total Unit</span>
                <span className="font-bold">{vehicles.length} unit</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--solana-text-muted)' }}>Total Shares</span>
                <span className="font-bold gradient-text">{(vehicles.length * 1000).toLocaleString('id-ID')} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--solana-text-muted)' }}>Total Modal Dibutuhkan</span>
                <span className="font-bold gradient-text">Rp {(vehicles.length * 30_000_000).toLocaleString('id-ID')} IDRX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--solana-text-muted)' }}>Estimasi Biaya On-chain</span>
                <span className="font-bold">~${(vehicles.length * 0.005).toFixed(3)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--solana-text-muted)' }}>Teknologi</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(94,234,212,0.1)', color: '#5EEAD4', border: '1px solid rgba(94,234,212,0.3)' }}>
                  cNFT (Bubblegum)
                </span>
              </div>
            </div>
            <button
              onClick={handleMint}
              disabled={minting}
              className="glow-btn w-full gap-3 py-3.5 font-bold disabled:opacity-50"
            >
              {minting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Anchoring ke Solana...</>
              ) : (
                <><Cpu className="w-5 h-5" /> Daftar Kendaraan</>
              )}
            </button>
          </div>
        </>
      )}

      {tab === 'csv' && (
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-5 text-center" style={{ border: '2px dashed rgba(94,234,212,0.25)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(94,234,212,0.1)' }}>
            <FileSpreadsheet className="w-8 h-8" style={{ color: '#5EEAD4' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Import Batch CSV</h3>
            <p className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>
              Upload file CSV dengan format: VIN, Tipe, Brand, Model, Tahun, GPS ID, Kontrak, Flat Fee
            </p>
          </div>
          {csvFile ? (
            <div className="w-full glass-card rounded-xl p-4" style={{ border: '1px solid rgba(94,234,212,0.3)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{csvFile}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--solana-text-muted)' }}>Parsed 24 valid entries. 0 errors.</p>
                </div>
                <button onClick={() => setCsvFile(null)} className="text-xs" style={{ color: '#FCA5A5' }}>Remove</button>
              </div>
            </div>
          ) : (
            <label className="glow-btn cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0]?.name ?? null)} />
              Upload CSV
            </label>
          )}
          {csvFile && (
            <button onClick={handleMint} disabled={minting} className="glow-btn w-full max-w-xs gap-2 disabled:opacity-50">
              {minting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : <><Cpu className="w-4 h-4" /> Mint Semua Unit</>}
            </button>
          )}
          <a href="#" className="text-xs" style={{ color: 'var(--solana-text-muted)' }}>
            Download template CSV
          </a>
        </div>
      )}
    </div>
  )
}
