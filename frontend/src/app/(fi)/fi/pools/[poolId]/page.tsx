"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { WorkshopRevenueChart } from "@/components/ui/WorkshopRevenueChart";
import {
  ExternalLink,
  FileText,
  Leaf,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react";

const POOLS = [
  {
    id: "pool-batch-1",
    name: "Fleet Pool Batch #1 — Jakarta",
    operatorType: "nemesis_native",
    apyMin: 35,
    apyMax: 41,
    totalSupplied: 2_400_000_000,
    targetSupply: 3_000_000_000,
    unitCount: 100,
    lockPeriodMonths: null as number | null,
    status: "active",
    energyPointsEligible: true,
    unitBreakdown: { ojol: 60, kurir: 30, logistik: 10 },
    nextDistribution: "28 Apr 2026",
    managedBy: "Nemesis Protocol",
    city: "Jakarta",
  },
  {
    id: "pool-batch-2",
    name: "Fleet Pool Batch #2 — Surabaya",
    operatorType: "verified_partner",
    apyMin: 30,
    apyMax: 36,
    totalSupplied: 3_000_000_000,
    targetSupply: 3_000_000_000,
    unitCount: 100,
    lockPeriodMonths: 36 as number | null,
    status: "filled",
    energyPointsEligible: true,
    unitBreakdown: { ojol: 50, kurir: 35, logistik: 15 },
    nextDistribution: "28 Apr 2026",
    managedBy: "PT SurabayaExpress Logistics",
    city: "Surabaya",
  },
  {
    id: "pool-bandung",
    name: "Bandung Kurir Network",
    operatorType: "verified_partner",
    apyMin: 28,
    apyMax: 33,
    totalSupplied: 1_800_000_000,
    targetSupply: 1_800_000_000,
    unitCount: 60,
    lockPeriodMonths: 12 as number | null,
    status: "filled",
    energyPointsEligible: false,
    unitBreakdown: { ojol: 10, kurir: 45, logistik: 5 },
    nextDistribution: "28 Apr 2026",
    managedBy: "PT Bandung Kurir Utama",
    city: "Bandung",
  },
  {
    id: "pool-medan",
    name: "Medan Expansion Pool",
    operatorType: "nemesis_native",
    apyMin: 32,
    apyMax: 38,
    totalSupplied: 0,
    targetSupply: 2_000_000_000,
    unitCount: 80,
    lockPeriodMonths: 6 as number | null,
    status: "upcoming",
    energyPointsEligible: true,
    unitBreakdown: { ojol: 40, kurir: 30, logistik: 10 },
    nextDistribution: "TBA",
    managedBy: "Nemesis Protocol",
    city: "Medan",
  },
];

const formatIDRX = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".", ",") + " M";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + " jt";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " rb";
  return n.toString();
};
const formatFull = (n: number) => new Intl.NumberFormat("id-ID").format(n);

type TabKey = "overview" | "report" | "impact" | "calculator";

const DISTRIBUTIONS = [
  { date: "28 Apr 2026", total: 192000, per: "1,92", hash: "4xK9...mR2p" },
  { date: "21 Apr 2026", total: 184000, per: "1,84", hash: "7yL3...nS4q" },
  { date: "14 Apr 2026", total: 197000, per: "1,97", hash: "9zM5...pT6r" },
  { date: "7 Apr 2026", total: 176000, per: "1,76", hash: "2wN7...qU8s" },
];

const YIELD_HISTORY = [
  { name: "W1", revenue: 176000 },
  { name: "W2", revenue: 184000 },
  { name: "W3", revenue: 191000 },
  { name: "W4", revenue: 197000 },
  { name: "W5", revenue: 202000 },
  { name: "W6", revenue: 185000 },
  { name: "W7", revenue: 188000 },
  { name: "W8", revenue: 192000 },
];

const UTILIZATION = [
  { name: "Sen", revenue: 73 },
  { name: "Sel", revenue: 71 },
  { name: "Rab", revenue: 78 },
  { name: "Kam", revenue: 75 },
  { name: "Jum", revenue: 82 },
  { name: "Sab", revenue: 68 },
  { name: "Min", revenue: 62 },
];

const REVENUE_LOG = [
  { week: "W1", revenue: 280_000, expenses: 104_000, net: 176_000, distributed: 176_000 },
  { week: "W2", revenue: 294_000, expenses: 110_000, net: 184_000, distributed: 184_000 },
  { week: "W3", revenue: 305_000, expenses: 114_000, net: 191_000, distributed: 191_000 },
  { week: "W4", revenue: 315_000, expenses: 118_000, net: 197_000, distributed: 197_000 },
  { week: "W5", revenue: 322_000, expenses: 120_000, net: 202_000, distributed: 202_000 },
  { week: "W6", revenue: 295_000, expenses: 110_000, net: 185_000, distributed: 185_000 },
  { week: "W7", revenue: 300_000, expenses: 112_000, net: 188_000, distributed: 188_000 },
  { week: "W8", revenue: 307_000, expenses: 115_000, net: 192_000, distributed: 192_000 },
];

export default function PoolDetailPage({ params }: { params: { poolId: string } }) {
  const pool = POOLS.find((p) => p.id === params.poolId) ?? POOLS[0];
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [investAmount, setInvestAmount] = useState<number>(300_000);
  const [utilizationPct, setUtilizationPct] = useState<number>(75);
  const [lockMonths, setLockMonths] = useState<number | null>(null);

  const pctFilled = Math.round((pool.totalSupplied / pool.targetSupply) * 100);

  const calc = useMemo(() => {
    const apyBase =
      pool.apyMin + ((utilizationPct - 60) / 40) * (pool.apyMax - pool.apyMin);
    const lockBonus =
      lockMonths === 3 ? 2 : lockMonths === 6 ? 4 : lockMonths === 12 ? 6 : 0;
    const effectiveApy = apyBase + lockBonus;
    const annualYield = (investAmount * effectiveApy) / 100;
    const monthlyYield = annualYield / 12;
    const breakEvenMonths = monthlyYield > 0 ? investAmount / monthlyYield : 0;
    return { effectiveApy, annualYield, monthlyYield, breakEvenMonths };
  }, [investAmount, utilizationPct, lockMonths, pool.apyMin, pool.apyMax]);

  const sharesPreview = Math.floor(investAmount / 30_000);
  const yieldPerWeekPreview = sharesPreview * 1.92 * 10; // rough per-saham/week

  const TABS: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "report", label: "Report" },
    { key: "impact", label: "Dampak" },
    { key: "calculator", label: "Kalkulator" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Pool header card */}
      <div className="glass-card overflow-hidden mb-6">
        <div
          className="h-24 px-6 flex items-end pb-4"
          style={{ background: "linear-gradient(135deg, rgba(94,234,212,0.35), rgba(139,92,246,0.25))" }}
        >
          <p className="text-sm flex items-center gap-2 opacity-90">
            <MapPin size={14} /> {pool.city}
          </p>
        </div>
        <div className="p-6">
          <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-orbitron)] mb-3">
            {pool.name}
          </h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="badge badge-green">{pool.status === "filled" ? "Pool Penuh" : "Aktif"}</span>
            {pool.operatorType === "nemesis_native" ? (
              <span className="badge badge-green">🔵 Nemesis Native</span>
            ) : (
              <span className="badge" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd" }}>
                ⭐ Partner — {pool.managedBy}
              </span>
            )}
            {pool.energyPointsEligible && <span className="badge">⚡ Energy Points</span>}
          </div>

          <div>
            <p className="text-xs text-gray-400">APY Range</p>
            <p className="text-5xl font-bold gradient-text font-[family-name:var(--font-orbitron)]">
              {pool.apyMin}–{pool.apyMax}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Supplied", value: `${formatIDRX(pool.totalSupplied)} IDRX` },
          { label: "Target", value: `${formatIDRX(pool.targetSupply)} IDRX` },
          { label: "% Terisi", value: `${pctFilled}%` },
          { label: "Next Distribution", value: pool.nextDistribution },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold font-[family-name:var(--font-orbitron)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-5 py-2 rounded-full text-sm font-medium transition"
              style={{
                background: active ? "rgba(94,234,212,0.18)" : "rgba(34,38,46,0.6)",
                border: active ? "1px solid rgba(94,234,212,0.6)" : "1px solid rgba(94,234,212,0.15)",
                color: active ? "#5EEAD4" : "#cbd5e1",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Fleet health bar */}
          <div className="glass-card p-6">
            <h3 className="font-bold mb-3 font-[family-name:var(--font-orbitron)]">Fleet Health</h3>
            <div className="w-full h-4 rounded-full overflow-hidden flex">
              <div style={{ width: "71%", background: "#5EEAD4" }} />
              <div style={{ width: "18%", background: "#64748b" }} />
              <div style={{ width: "11%", background: "#f59e0b" }} />
            </div>
            <div className="flex gap-4 mt-3 text-sm flex-wrap">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: "#5EEAD4" }} /> Aktif 71%
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: "#64748b" }} /> Idle 18%
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} /> Servis 11%
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Unit breakdown: {pool.unitBreakdown.ojol} ojol · {pool.unitBreakdown.kurir} kurir ·{" "}
              {pool.unitBreakdown.logistik} logistik
            </p>
          </div>

          {/* Recent distributions */}
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Distribusi Terbaru</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Total IDRX</th>
                    <th>Per Saham</th>
                    <th>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {DISTRIBUTIONS.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{formatFull(d.total)} IDRX</td>
                      <td>{d.per} IDRX</td>
                      <td className="flex items-center gap-1">
                        {d.hash} <ExternalLink size={12} className="opacity-60" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invest section */}
          <div
            className="glass-card p-6"
            style={{ border: "1px solid rgba(94,234,212,0.5)" }}
          >
            <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Invest di Pool Ini</h3>
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Jumlah (IDRX)</label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value) || 0)}
                className="input-field w-full"
              />
              <p className="text-xs text-gray-400 mt-2">
                {sharesPreview} saham = est. {formatFull(Math.round(yieldPerWeekPreview))} IDRX/minggu
              </p>
            </div>
            <button
              onClick={() => alert("Wallet integration coming soon")}
              className="glow-btn w-full py-3 rounded-xl font-semibold"
            >
              Invest Sekarang
            </button>
          </div>

          <Link
            href={`/depin/pool/${pool.id}`}
            className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200"
          >
            Lihat Aktivitas Fleet <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* REPORT */}
      {activeTab === "report" && (
        <div className="space-y-8">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Yield History (8 minggu)</h3>
            <WorkshopRevenueChart data={YIELD_HISTORY} />
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Utilization Rate (harian)</h3>
            <WorkshopRevenueChart data={UTILIZATION} />
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Revenue Log</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Minggu</th>
                    <th>Total Revenue</th>
                    <th>Expenses</th>
                    <th>Net</th>
                    <th>Distributed</th>
                  </tr>
                </thead>
                <tbody>
                  {REVENUE_LOG.map((r) => (
                    <tr key={r.week}>
                      <td>{r.week}</td>
                      <td>{formatFull(r.revenue)} IDRX</td>
                      <td>{formatFull(r.expenses)} IDRX</td>
                      <td>{formatFull(r.net)} IDRX</td>
                      <td>{formatFull(r.distributed)} IDRX</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FileText size={32} className="text-teal-300" />
              <div>
                <p className="font-bold">Laporan Maret 2026</p>
                <p className="text-xs text-gray-400">PDF · 2,4 MB</p>
              </div>
            </div>
            <button className="glow-btn-outline px-5 py-2 rounded-xl font-semibold">Download</button>
          </div>
        </div>
      )}

      {/* IMPACT */}
      {activeTab === "impact" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: "🌱", value: "47,2 ton", label: "CO2 Dikurangi", sub: "setara dengan 3.200 pohon" },
              { icon: "🚗", value: "1.247.832 km", label: "Total Km EV", sub: "dalam pool ini" },
              { icon: "👤", value: "94 pengemudi", label: "Driver Didukung", sub: "income harian" },
              { icon: "💰", value: "Rp 892 juta", label: "Nilai Ekonomi", sub: "economic value generated" },
            ].map((c) => (
              <div key={c.label} className="glass-card p-6">
                <div className="text-4xl mb-3">{c.icon}</div>
                <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                <p className="text-3xl font-bold gradient-text font-[family-name:var(--font-orbitron)] mb-1">
                  {c.value}
                </p>
                <p className="text-xs text-gray-400">{c.sub}</p>
              </div>
            ))}
          </div>

          <div
            className="glass-card p-6 flex items-start gap-4"
            style={{ border: "1px solid rgba(94,234,212,0.5)" }}
          >
            <Leaf className="text-teal-300 shrink-0" size={28} />
            <p className="text-sm text-gray-200 leading-relaxed">
              Setiap 1 km EV = 87g CO2 dihindari vs motor BBM equivalent. Nemesis Protocol membantu
              Indonesia mencapai target Net Zero 2060.
            </p>
          </div>
        </div>
      )}

      {/* CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-5 font-[family-name:var(--font-orbitron)]">Parameter Investasi</h3>

            <div className="mb-5">
              <label className="text-xs text-gray-400 mb-1 block">Jumlah Investasi (IDRX)</label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value) || 0)}
                className="input-field w-full text-xl font-bold"
              />
              <p className="text-xs text-gray-400 mt-1">
                30.000 IDRX = 1 saham · kamu dapet {Math.floor(investAmount / 30_000)} saham
              </p>
            </div>

            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-xs text-gray-400">Utilisasi Fleet</label>
                <span className="text-teal-300 font-semibold">{utilizationPct}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={100}
                value={utilizationPct}
                onChange={(e) => setUtilizationPct(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>

            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-2 block">Periode Lock</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Fleksibel", val: null },
                  { label: "3 Bulan", val: 3 },
                  { label: "6 Bulan", val: 6 },
                  { label: "12 Bulan", val: 12 },
                ].map((opt) => {
                  const active = lockMonths === opt.val;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setLockMonths(opt.val)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition"
                      style={{
                        background: active ? "rgba(94,234,212,0.18)" : "rgba(34,38,46,0.6)",
                        border: active
                          ? "1px solid rgba(94,234,212,0.6)"
                          : "1px solid rgba(94,234,212,0.15)",
                        color: active ? "#5EEAD4" : "#cbd5e1",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">Lock lebih lama → APY lebih tinggi</p>
            </div>
          </div>

          {/* Output cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Estimasi Yield Bulanan",
                value: `${formatFull(Math.round(calc.monthlyYield))} IDRX`,
              },
              {
                label: "Estimasi Yield Tahunan",
                value: `${formatFull(Math.round(calc.annualYield))} IDRX`,
              },
              { label: "APY Efektif", value: `${calc.effectiveApy.toFixed(1)}%` },
              {
                label: "Break-even",
                value: `${calc.breakEvenMonths.toFixed(1)} bulan`,
              },
            ].map((c) => (
              <div key={c.label} className="glass-card p-5">
                <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                <p className="text-2xl md:text-3xl font-bold gradient-text font-[family-name:var(--font-orbitron)]">
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          {/* 5-Year Projection */}
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Proyeksi 5 Tahun</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Yield Tahunan</th>
                    <th>Kumulatif</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <tr key={yr}>
                      <td>{yr}</td>
                      <td>{formatFull(Math.round(calc.annualYield))} IDRX</td>
                      <td>{formatFull(Math.round(calc.annualYield * yr))} IDRX</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              * Asumsi APY konstan. Kondisi pasar dapat mempengaruhi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
