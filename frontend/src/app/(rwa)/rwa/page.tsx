import Link from 'next/link'
import { AssetModuleCard } from '@/components/rwa/AssetModuleCard'
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart2 } from 'lucide-react'

const ASSET_MODULES = [
  {
    moduleNumber: 1,
    title: 'Armada EV Produktif',
    subtitle: 'Motor & Mobil Listrik Penghasil Pendapatan',
    description:
      'Tokenisasi kepemilikan fraksional kendaraan listrik yang aktif beroperasi. Setiap unit menghasilkan flat fee harian yang otomatis terdistribusi ke pemegang token.',
    status: 'active' as const,
    examples: ['Ojol', 'Kurir', 'Logistik'],
    cta: 'Daftar Armada',
    ctaHref: '/rwa/operator',
  },
  {
    moduleNumber: 2,
    title: 'Jaringan Pengisian EV',
    subtitle: 'SPKLU & Charging Station',
    description:
      'Tokenisasi infrastruktur pengisian daya EV. Pendapatan dari biaya pengisian terdistribusi otomatis ke investor setiap minggu.',
    status: 'coming_soon' as const,
    examples: ['SPKLU', 'Charging Station', 'Battery Swap'],
    cta: 'Notify Me',
    ctaHref: '#',
  },
  {
    moduleNumber: 3,
    title: 'Energi Surya + P2P',
    subtitle: 'Solar Panel & Battery Storage',
    description:
      'Tokenisasi aset energi surya produktif dengan mekanisme P2P energy trading on-chain. Pendapatan dari penjualan energi dibagi ke pemegang token.',
    status: 'future' as const,
    examples: ['Solar Panel', 'Battery Storage', 'P2P Trading'],
    cta: 'Pelajari',
    ctaHref: '#',
  },
]

const STEPS = [
  { number: '01', title: 'Daftar & KYC', desc: 'Buat akun operator dan selesaikan verifikasi identitas bisnis.' },
  { number: '02', title: 'Pasang GPS Device', desc: 'Install perangkat GPS (phone-based MVP) di setiap kendaraan untuk verifikasi on-chain.' },
  { number: '03', title: 'Mint Token', desc: 'Tokenisasi kendaraan ke pool — 1.000 share per unit @ IDRX 30.000.' },
  { number: '04', title: 'Terima Modal', desc: 'Modal masuk dari investor, yield otomatis terdistribusi setiap Senin.' },
]

export default function RWALandingPage() {
  return (
    <div className="min-h-screen" style={{ color: 'var(--text-primary)' }}>
      {/* Nav bar minimal */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(94,234,212,0.1)', background: 'rgba(26,29,35,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}
      >
        <Link href="/" className="font-bold text-lg gradient-text" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
          Nemesis RWA
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/rwa/assets" className="text-sm hidden md:block" style={{ color: 'var(--solana-text-muted)' }}>
            Aset
          </Link>
          <Link href="/rwa/operator" className="glow-btn text-sm px-4 py-2">
            Masuk Portal
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 md:py-36 text-center overflow-hidden">
        {/* Glow bg */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(94,234,212,0.1)', color: '#5EEAD4', border: '1px solid rgba(94,234,212,0.25)' }}
          >
            Nemesis RWA — Real World Asset Protocol
          </span>

          <h1
            className="text-4xl md:text-6xl font-black mb-6 gradient-text leading-tight"
            style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}
          >
            Tokenisasi Infrastruktur EV Lo
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--solana-text-muted)' }}>
            Ubah armada kendaraan listrik produktif jadi aset investasi on-chain.
            Terverifikasi. Transparan. Yield otomatis.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/rwa/operator" className="glow-btn text-base px-8 py-3 flex items-center gap-2">
              Daftar Sebagai Operator <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/rwa/assets" className="glow-btn-outline text-base px-8 py-3">
              Pelajari Lebih Lanjut
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t" style={{ borderColor: 'rgba(94,234,212,0.1)' }}>
            {[
              { label: 'Unit Terdaftar', value: '83' },
              { label: 'TVL (IDRX)', value: '2.4B' },
              { label: 'Yield Didistribusikan', value: 'Rp 28.4M' },
              { label: 'Investor Aktif', value: '124' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black gradient-text">{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--solana-text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Asset Modules */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
            Modul Aset
          </h2>
          <p className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>
            Berbagai jenis infrastruktur EV yang dapat ditokenisasi di Nemesis Protocol
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ASSET_MODULES.map((m) => (
            <AssetModuleCard key={m.moduleNumber} {...m} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20" style={{ background: 'rgba(94,234,212,0.03)', borderTop: '1px solid rgba(94,234,212,0.1)', borderBottom: '1px solid rgba(94,234,212,0.1)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
              Cara Tokenisasi
            </h2>
            <p className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>4 langkah untuk tokenisasi armada lo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="relative">
                {idx < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-full w-full h-px"
                    style={{ background: 'linear-gradient(to right, rgba(94,234,212,0.4), transparent)', width: '80%', left: '60%' }}
                  />
                )}
                <div className="glass-card rounded-2xl p-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-4"
                    style={{ background: 'rgba(94,234,212,0.1)', border: '1px solid rgba(94,234,212,0.25)', color: '#5EEAD4', fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}
                  >
                    {step.number}
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--solana-text-muted)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Types */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
            Tipe Operator
          </h2>
          <p className="text-sm" style={{ color: 'var(--solana-text-muted)' }}>Bergabung sesuai skala bisnis lo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enterprise */}
          <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(94,234,212,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(94,234,212,0.15)' }}>
                <BarChart2 className="w-5 h-5" style={{ color: '#5EEAD4' }} />
              </div>
              <div>
                <h3 className="font-bold">Enterprise / Fleet Manager</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(94,234,212,0.1)', color: '#5EEAD4' }}>Nemesis Native / Verified Partner</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {['Min. 10 unit kendaraan', 'KYC bisnis (PT/CV/UD)', 'SLA uptime 85%+', 'Laporan bulanan ke investor', 'Akses pool eksklusif'].map((req) => (
                <li key={req} className="flex items-center gap-2 text-sm" style={{ color: 'var(--solana-text-muted)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#5EEAD4' }} />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Individual */}
          <div className="glass-card rounded-2xl p-6" style={{ border: '1px solid rgba(161,161,170,0.2)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(161,161,170,0.1)' }}>
                <Zap className="w-5 h-5" style={{ color: '#A1A1AA' }} />
              </div>
              <div>
                <h3 className="font-bold">Operator Individual</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(161,161,170,0.1)', color: '#A1A1AA' }}>Independent</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {['Min. 1 unit kendaraan', 'KYC perorangan (KTP)', 'Node score aktif (GPS)', 'Bergabung ke pool komunitas', 'Yield proporsional per unit'].map((req) => (
                <li key={req} className="flex items-center gap-2 text-sm" style={{ color: 'var(--solana-text-muted)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#A1A1AA' }} />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: 'linear-gradient(to bottom, rgba(94,234,212,0.05), transparent)', borderTop: '1px solid rgba(94,234,212,0.1)' }}
      >
        <div className="max-w-xl mx-auto">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#5EEAD4' }} />
          <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: 'var(--font-orbitron, Orbitron, sans-serif)' }}>
            Sudah siap?
          </h2>
          <p className="mb-8" style={{ color: 'var(--solana-text-muted)' }}>
            Daftarkan armada lo sekarang dan mulai terima modal dari investor on-chain.
          </p>
          <Link href="/rwa/operator" className="glow-btn text-base px-10 py-3.5 inline-flex items-center gap-2">
            Daftarkan Armada Lo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-xs border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--solana-text-muted)' }}>
        © 2026 Nemesis Protocol · Built on Solana · IDRX Powered
      </footer>
    </div>
  )
}
