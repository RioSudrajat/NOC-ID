"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";
import { WorkshopRevenueChart } from "@/components/ui/WorkshopRevenueChart";
import { Wallet, ExternalLink, CheckCircle2 } from "lucide-react";

const formatFull = (n: number) => new Intl.NumberFormat("id-ID").format(n);

const POSITIONS = [
  {
    poolId: "pool-batch-1",
    poolName: "Fleet Pool Batch #1 — Jakarta",
    shares: 10,
    value: 300_000,
    yieldEarned: 7_680,
    apy: 33.2,
  },
  {
    poolId: "pool-bandung",
    poolName: "Bandung Kurir Network",
    shares: 5,
    value: 150_000,
    yieldEarned: 2_410,
    apy: 30.5,
  },
];

const YIELD_HISTORY = [
  { name: "W1", revenue: 1680 },
  { name: "W2", revenue: 1760 },
  { name: "W3", revenue: 1840 },
  { name: "W4", revenue: 1920 },
];

const TXS = [
  { date: "28 Apr 2026", type: "Distribusi Yield", pool: "Batch #1", amount: "+1.920 IDRX", hash: "4xK9...mR2p" },
  { date: "21 Apr 2026", type: "Distribusi Yield", pool: "Batch #1", amount: "+1.840 IDRX", hash: "7yL3...nS4q" },
  { date: "14 Apr 2026", type: "Distribusi Yield", pool: "Batch #1", amount: "+1.970 IDRX", hash: "9zM5...pT6r" },
  { date: "7 Apr 2026", type: "Distribusi Yield", pool: "Batch #1", amount: "+1.760 IDRX", hash: "2wN7...qU8s" },
  { date: "15 Mar 2026", type: "Investment", pool: "Batch #1", amount: "-300.000 IDRX", hash: "5aB8...vW9t" },
  { date: "10 Mar 2026", type: "Investment", pool: "Bandung", amount: "-150.000 IDRX", hash: "6cD4...xY1u" },
];

export default function PortfolioPage() {
  const [isConnected] = useState(true);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 text-center">
        <Wallet size={64} className="text-teal-300" />
        <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">Portfolio Investor</h2>
        <p className="text-gray-400 max-w-md">
          Hubungkan wallet untuk melihat portfolio kamu
        </p>
        <ConnectWalletButton />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2">
        Portfolio Investor
      </h1>
      <p className="text-gray-400 mb-8">Overview dari semua posisi FI kamu</p>

      {/* Portfolio summary hero */}
      <div
        className="glass-card p-6 md:p-8 mb-8"
        style={{
          borderTop: "2px solid rgba(94,234,212,0.8)",
          background:
            "linear-gradient(180deg, rgba(94,234,212,0.08) 0%, rgba(34,38,46,0.7) 40%)",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-1">Saham Dimiliki</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">15</p>
            <p className="text-xs text-gray-500">dari 100.000 total pool</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Diinvestasikan</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">
              450.000 IDRX
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Yield Minggu Ini</p>
            <p className="text-2xl font-bold gradient-text font-[family-name:var(--font-orbitron)]">
              1.920 IDRX
            </p>
            <p className="text-xs text-teal-300 flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} /> Diklaim Otomatis
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Diperoleh</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">
              10.090 IDRX
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">APY Saat Ini</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">33,2%</p>
          </div>
        </div>
      </div>

      {/* Positions */}
      <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-5">Posisi Kamu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {POSITIONS.map((pos) => (
          <div key={pos.poolId} className="glass-card p-6">
            <h3 className="font-bold mb-4">{pos.poolName}</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-400 mb-1">Saham</p>
                <p className="text-lg font-bold font-[family-name:var(--font-orbitron)]">{pos.shares}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Nilai Sekarang</p>
                <p className="text-lg font-bold font-[family-name:var(--font-orbitron)]">
                  {formatFull(pos.value)} IDRX
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Yield Terkumpul</p>
                <p className="text-lg font-bold gradient-text font-[family-name:var(--font-orbitron)]">
                  {formatFull(pos.yieldEarned)} IDRX
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">APY</p>
                <p className="text-lg font-bold font-[family-name:var(--font-orbitron)]">{pos.apy}%</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/fi/pools/${pos.poolId}`}
                className="glow-btn-outline px-4 py-2 rounded-xl text-sm font-semibold"
              >
                Lihat Detail
              </Link>
              <Link
                href={`/depin/pool/${pos.poolId}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(34,38,46,0.8)", border: "1px solid rgba(94,234,212,0.25)" }}
              >
                Lihat Aktivitas
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Yield chart */}
      <div className="glass-card p-6 mb-10">
        <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Yield History</h3>
        <WorkshopRevenueChart data={YIELD_HISTORY} />
      </div>

      {/* TX history */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4 font-[family-name:var(--font-orbitron)]">Riwayat Transaksi</h3>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Pool</th>
                <th>Jumlah</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {TXS.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.date}</td>
                  <td>{tx.type}</td>
                  <td>{tx.pool}</td>
                  <td
                    style={{
                      color: tx.amount.startsWith("+") ? "#5EEAD4" : "#f87171",
                    }}
                  >
                    {tx.amount}
                  </td>
                  <td className="flex items-center gap-1">
                    {tx.hash} <ExternalLink size={12} className="opacity-60" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
