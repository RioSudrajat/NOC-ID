"use client";

import Link from "next/link";
import { WorkshopRevenueChart } from "@/components/ui/WorkshopRevenueChart";
import {
  Activity,
  TrendingUp,
  MapPin,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const fleetCategories = [
  {
    name: "Ojol",
    label: "Ride-hailing",
    units: 412,
    kmToday: 21847,
    color: "#5EEAD4",
    emoji: "🏍️",
  },
  {
    name: "Kurir",
    label: "Delivery",
    units: 289,
    kmToday: 14203,
    color: "#8B5CF6",
    emoji: "📦",
  },
  {
    name: "Logistik",
    label: "Logistics",
    units: 146,
    kmToday: 6341,
    color: "#F59E0B",
    emoji: "🚚",
  },
];

const kmData = [
  { name: "Sen", revenue: 38291 },
  { name: "Sel", revenue: 41023 },
  { name: "Rab", revenue: 39847 },
  { name: "Kam", revenue: 42391 },
  { name: "Jum", revenue: 44129 },
  { name: "Sab", revenue: 36412 },
  { name: "Min", revenue: 31284 },
];

const txData = [
  { name: "Sen", revenue: 847 },
  { name: "Sel", revenue: 923 },
  { name: "Rab", revenue: 891 },
  { name: "Kam", revenue: 952 },
  { name: "Jum", revenue: 1012 },
  { name: "Sab", revenue: 734 },
  { name: "Min", revenue: 612 },
];

const activityRows = [
  { unit: "#NMS-0**", zone: "Jakarta Selatan", time: "14:23", km: 47, hash: "4xK9...mR2p" },
  { unit: "#NMS-1**", zone: "Jakarta Barat", time: "14:21", km: 23, hash: "7yL3...nS4q" },
  { unit: "#NMS-2**", zone: "Surabaya", time: "14:19", km: 61, hash: "9zM5...pT6r" },
  { unit: "#NMS-0**", zone: "Bandung", time: "14:17", km: 34, hash: "2wN7...qU8s" },
  { unit: "#NMS-3**", zone: "Jakarta Timur", time: "14:15", km: 18, hash: "5aB8...vW9t" },
  { unit: "#NMS-1**", zone: "Bekasi", time: "14:13", km: 52, hash: "6cD2...xY1u" },
  { unit: "#NMS-2**", zone: "Tangerang", time: "14:11", km: 29, hash: "3eF4...zA2v" },
  { unit: "#NMS-0**", zone: "Jakarta Pusat", time: "14:09", km: 41, hash: "8gH6...bC3w" },
  { unit: "#NMS-1**", zone: "Depok", time: "14:07", km: 37, hash: "1iJ8...dE4x" },
  { unit: "#NMS-2**", zone: "Jakarta Utara", time: "14:05", km: 24, hash: "4kL0...fG5y" },
];

export default function NetworkDashboardPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      {/* Sticky Stats Bar */}
      <div
        className="sticky top-0 z-20 py-3 px-6 md:px-8 border-b"
        style={{
          background: "var(--solana-dark-2)",
          borderColor: "rgba(94,234,212,0.25)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 md:gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#5EEAD4", boxShadow: "0 0 10px #5EEAD4" }}
            />
            <span className="text-gray-400">Live</span>
          </div>
          <div>
            <span className="text-gray-400">Total Fleet: </span>
            <span className="font-bold text-white">847</span>
          </div>
          <div>
            <span className="text-gray-400">Km Hari Ini: </span>
            <span className="font-bold text-white">42.391</span>
          </div>
          <div>
            <span className="text-gray-400">Active Nodes: </span>
            <span className="font-bold text-white">623</span>
          </div>
          <div>
            <span className="text-gray-400">On-chain: </span>
            <span className="font-bold" style={{ color: "#5EEAD4" }}>
              847
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-3">
          <h1
            className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text"
          >
            Network DePIN
          </h1>
          <span
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "#5EEAD4", boxShadow: "0 0 12px #5EEAD4" }}
          />
          <span className="badge badge-green text-xs">Live</span>
        </div>

        {/* Fleet Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {fleetCategories.map((cat) => (
            <div
              key={cat.name}
              className="glass-card p-5 relative overflow-hidden"
              style={{ borderLeft: `4px solid ${cat.color}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl">{cat.emoji}</span>
                <TrendingUp
                  size={20}
                  style={{ color: cat.color }}
                />
              </div>
              <h3 className="text-xl font-bold text-white">{cat.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{cat.label}</p>
              <div className="text-2xl font-bold" style={{ color: cat.color }}>
                {cat.units.toLocaleString("id-ID")} unit
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {cat.kmToday.toLocaleString("id-ID")} km hari ini
              </div>
            </div>
          ))}
        </div>

        {/* Driving Distance Stats */}
        <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-orbitron)] text-white">
          Driving Distance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Periode</p>
            <p className="text-2xl font-bold text-white mt-2">1.247.832 km</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Kemarin</p>
            <p className="text-2xl font-bold text-white mt-2">38.291 km</p>
            <p className="text-xs mt-1" style={{ color: "#5EEAD4" }}>+8,2% vs 2 hari lalu</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider">30 Hari</p>
            <p className="text-2xl font-bold text-white mt-2">1.012.847 km</p>
          </div>
        </div>
        <div className="glass-card p-5 mb-8">
          <p className="text-sm text-gray-400 mb-3">Km 7 Hari Terakhir</p>
          <WorkshopRevenueChart data={kmData} />
        </div>

        {/* Activity Heatmap Placeholder */}
        <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-orbitron)] text-white">
          Peta Aktivitas
        </h2>
        <div
          className="rounded-2xl mb-8 flex flex-col items-center justify-center text-center p-6"
          style={{
            height: "320px",
            background:
              "radial-gradient(circle at center, rgba(94,234,212,0.08) 0%, rgba(34,38,46,0.6) 70%)",
            border: "2px dashed rgba(94,234,212,0.4)",
          }}
        >
          <MapPin size={48} style={{ color: "#5EEAD4" }} className="mb-3" />
          <h3 className="text-lg font-bold text-white">Peta Aktivitas Real-Time</h3>
          <p className="text-sm text-gray-400 mt-2">
            Data teranonimisasi — agregat per zona
          </p>
        </div>

        {/* Real-Time Activity Feed */}
        <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-orbitron)] text-white flex items-center gap-2">
          <Activity size={22} style={{ color: "#5EEAD4" }} />
          Real-Time Activity
        </h2>
        <div
          className="rounded-2xl overflow-hidden mb-3"
          style={{
            background: "rgba(34,38,46,0.7)",
            border: "1px solid rgba(94,234,212,0.25)",
          }}
        >
          <table className="w-full data-table text-sm">
            <thead>
              <tr
                style={{
                  background: "rgba(94,234,212,0.08)",
                  color: "#5EEAD4",
                }}
              >
                <th className="text-left py-3 px-4">Unit</th>
                <th className="text-left py-3 px-4">Zona</th>
                <th className="text-left py-3 px-4">Waktu</th>
                <th className="text-left py-3 px-4">Km</th>
                <th className="text-left py-3 px-4">On-chain</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t hover:bg-white/5 transition"
                  style={{ borderColor: "rgba(94,234,212,0.1)" }}
                >
                  <td className="py-3 px-4 font-mono text-white">{row.unit}</td>
                  <td className="py-3 px-4 text-gray-300">{row.zone}</td>
                  <td className="py-3 px-4 text-gray-400">{row.time}</td>
                  <td className="py-3 px-4 text-white">{row.km} km</td>
                  <td className="py-3 px-4">
                    <a
                      href="#"
                      className="font-mono text-xs flex items-center gap-1 hover:underline"
                      style={{ color: "#5EEAD4" }}
                    >
                      {row.hash}
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mb-8">
          <button className="glow-btn-outline inline-flex items-center gap-1 text-sm px-4 py-2">
            Lihat lebih
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Transaction Count Chart */}
        <div className="glass-card p-5 mb-8">
          <h3 className="text-lg font-bold text-white mb-1">On-chain Submissions</h3>
          <p className="text-sm text-gray-400 mb-4">7 hari terakhir</p>
          <WorkshopRevenueChart data={txData} />
        </div>

        {/* CTA Banner */}
        <div
          className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(94,234,212,0.15) 0%, rgba(34,38,46,0.8) 100%)",
            border: "1px solid rgba(94,234,212,0.4)",
          }}
        >
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Mau invest di fleet ini?
            </h3>
            <p className="text-sm text-gray-300">
              Lihat pool yang sedang open di Nemesis FI
            </p>
          </div>
          <Link href="/fi" className="glow-btn inline-flex items-center gap-2">
            Ke Nemesis FI
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
