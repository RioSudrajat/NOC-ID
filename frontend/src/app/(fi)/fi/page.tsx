"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
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

type FilterKey = "all" | "highest" | "flex" | "locked" | "native";

const HEADER_STATS = [
  { label: "Total Value Locked", value: "8,7 M IDRX", Icon: DollarSign },
  { label: "Avg APY", value: "35,2%", Icon: TrendingUp },
  { label: "Total Investors", value: "342", Icon: Users },
  { label: "Total Yield Distributed", value: "124 jt IDRX", Icon: CheckCircle2 },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "highest", label: "APY Tertinggi" },
  { key: "flex", label: "Fleksibel" },
  { key: "locked", label: "Terkunci" },
  { key: "native", label: "Nemesis Native" },
];

export default function FiPoolsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const activePools = useMemo(() => {
    let pools = POOLS.filter((p) => p.status === "active" || p.status === "filled");
    if (activeFilter === "native") pools = pools.filter((p) => p.operatorType === "nemesis_native");
    else if (activeFilter === "flex") pools = pools.filter((p) => p.lockPeriodMonths === null);
    else if (activeFilter === "locked") pools = pools.filter((p) => p.lockPeriodMonths !== null);
    else if (activeFilter === "highest") pools = [...pools].sort((a, b) => b.apyMax - a.apyMax);
    return pools;
  }, [activeFilter]);

  const upcomingPools = POOLS.filter((p) => p.status === "upcoming");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {HEADER_STATS.map(({ label, value, Icon }) => (
          <div key={label} className="glass-card p-4 relative">
            <Icon className="absolute top-3 right-3 text-teal-300/60" size={18} />
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2">
          Nemesis FI — Investment Pools
        </h1>
        <p className="text-gray-400">
          Invest di infrastruktur EV produktif Indonesia. Yield otomatis tiap Senin.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="px-4 py-2 rounded-full text-sm font-medium transition"
              style={{
                background: active ? "rgba(94,234,212,0.18)" : "rgba(34,38,46,0.6)",
                border: active ? "1px solid rgba(94,234,212,0.6)" : "1px solid rgba(94,234,212,0.15)",
                color: active ? "#5EEAD4" : "#cbd5e1",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Pool Aktif */}
      <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-5">Pool Aktif</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {activePools.map((pool) => {
          const pct = (pool.totalSupplied / pool.targetSupply) * 100;
          return (
            <Link key={pool.id} href={`/fi/pools/${pool.id}`}>
              <div className="glass-card overflow-hidden cursor-pointer hover:scale-[1.01] transition">
                <div
                  className="h-20 px-4 flex items-end pb-3"
                  style={{ background: "linear-gradient(135deg, rgba(94,234,212,0.3), rgba(139,92,246,0.25))" }}
                >
                  <div>
                    <p className="text-xs opacity-80">{pool.city}</p>
                    <p className="text-sm font-bold">{pool.city.toUpperCase()} POOL</p>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold mb-2">{pool.name}</h3>

                  <div className="mb-3">
                    {pool.operatorType === "nemesis_native" ? (
                      <span className="badge badge-green">🔵 Nemesis Native</span>
                    ) : (
                      <span
                        className="badge"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd" }}
                      >
                        ⭐ Partner
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-400">APY</p>
                    <p className="text-3xl font-bold gradient-text font-[family-name:var(--font-orbitron)]">
                      {pool.apyMin}–{pool.apyMax}%
                    </p>
                  </div>

                  {pool.energyPointsEligible && (
                    <div className="mb-3">
                      <span className="badge text-xs">⚡ Energy Points Eligible</span>
                    </div>
                  )}

                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Supplied</span>
                      <span>
                        {formatIDRX(pool.totalSupplied)} / {formatIDRX(pool.targetSupply)} IDRX
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(94,234,212,0.1)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #5EEAD4, #14B8A6)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-400 mt-3 flex-wrap">
                    <span>🔒 {pool.lockPeriodMonths === null ? "Fleksibel" : `${pool.lockPeriodMonths} bln`}</span>
                    <span>·</span>
                    <span>{pool.unitCount} unit</span>
                  </div>

                  <button
                    className={`w-full mt-4 py-2.5 rounded-xl font-semibold ${
                      pool.status === "filled" ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "glow-btn"
                    }`}
                  >
                    {pool.status === "filled" ? "Pool Penuh" : "Lihat Detail"}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pool Segera Hadir */}
      <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-5">Pool Segera Hadir</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {upcomingPools.map((pool) => (
          <div key={pool.id} className="glass-card overflow-hidden opacity-90">
            <div
              className="h-20 px-4 flex items-end pb-3"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(94,234,212,0.2))" }}
            >
              <div>
                <p className="text-xs opacity-80">{pool.city}</p>
                <p className="text-sm font-bold">{pool.city.toUpperCase()} POOL</p>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold mb-2">{pool.name}</h3>

              <div className="mb-3 flex gap-2 flex-wrap">
                <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#fcd34d" }}>
                  ⏳ Segera
                </span>
                {pool.operatorType === "nemesis_native" && (
                  <span className="badge badge-green">🔵 Nemesis Native</span>
                )}
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-400">Target APY</p>
                <p className="text-3xl font-bold gradient-text font-[family-name:var(--font-orbitron)]">
                  {pool.apyMin}–{pool.apyMax}%
                </p>
              </div>

              <div className="flex gap-2 text-xs text-gray-400 mt-3 flex-wrap">
                <span>🔒 {pool.lockPeriodMonths === null ? "Fleksibel" : `${pool.lockPeriodMonths} bln`}</span>
                <span>·</span>
                <span>{pool.unitCount} unit</span>
              </div>

              <button className="w-full mt-4 py-2.5 rounded-xl font-semibold glow-btn-outline">
                Join Waitlist
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Income — Coming Soon */}
      <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-5">Fixed Income</h2>
      <div className="glass-card p-10 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: "rgba(26,29,35,0.4)" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Clock size={56} className="text-teal-300" />
          <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)]">Segera Hadir</h3>
          <p className="text-gray-400 max-w-md">
            Pool dengan return tetap — Coming Soon. Predictable yield untuk investor konservatif yang
            ingin exposure ke EV fleet tanpa volatilitas utilisasi.
          </p>
        </div>
      </div>
    </div>
  );
}
