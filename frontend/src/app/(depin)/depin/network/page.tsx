"use client";

import { useState } from "react";
import { Globe, ExternalLink, Activity } from "lucide-react";

const filters = ["Semua", "Ojol", "Kurir", "Logistik"];

const activityRows = [
  { unit: "#NMS-0**", cat: "Ojol", zone: "Jakarta Selatan", time: "14:23", km: 47, hash: "4xK9...mR2p" },
  { unit: "#NMS-1**", cat: "Kurir", zone: "Jakarta Barat", time: "14:21", km: 23, hash: "7yL3...nS4q" },
  { unit: "#NMS-2**", cat: "Logistik", zone: "Surabaya", time: "14:19", km: 61, hash: "9zM5...pT6r" },
  { unit: "#NMS-0**", cat: "Ojol", zone: "Bandung", time: "14:17", km: 34, hash: "2wN7...qU8s" },
  { unit: "#NMS-3**", cat: "Ojol", zone: "Jakarta Timur", time: "14:15", km: 18, hash: "5aB8...vW9t" },
  { unit: "#NMS-1**", cat: "Kurir", zone: "Bekasi", time: "14:13", km: 52, hash: "6cD2...xY1u" },
  { unit: "#NMS-2**", cat: "Logistik", zone: "Tangerang", time: "14:11", km: 29, hash: "3eF4...zA2v" },
  { unit: "#NMS-0**", cat: "Ojol", zone: "Jakarta Pusat", time: "14:09", km: 41, hash: "8gH6...bC3w" },
  { unit: "#NMS-1**", cat: "Kurir", zone: "Depok", time: "14:07", km: 37, hash: "1iJ8...dE4x" },
  { unit: "#NMS-2**", cat: "Logistik", zone: "Jakarta Utara", time: "14:05", km: 24, hash: "4kL0...fG5y" },
];

export default function NetworkDetailPage() {
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filtered =
    activeFilter === "Semua"
      ? activityRows
      : activityRows.filter((r) => r.cat === activeFilter);

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text">
              Network Detail
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Monitor fleet status, connectivity, dan aktivitas on-chain
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={
                  activeFilter === f
                    ? "glow-btn text-xs px-4 py-2"
                    : "glow-btn-outline text-xs px-4 py-2"
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">Online</p>
            <p className="text-2xl font-bold text-white mt-1">623</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">Offline</p>
            <p className="text-2xl font-bold text-white mt-1">224</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">In Transit</p>
            <p className="text-2xl font-bold text-white mt-1">412</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">Uptime</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#5EEAD4" }}>
              73.6%
            </p>
          </div>
        </div>

        {/* Map placeholder */}
        <div
          className="glass-card mb-8 flex flex-col items-center justify-center"
          style={{
            height: "420px",
            border: "2px dashed rgba(94,234,212,0.4)",
            background:
              "radial-gradient(circle at center, rgba(94,234,212,0.08) 0%, rgba(34,38,46,0.6) 70%)",
          }}
        >
          <Globe size={64} style={{ color: "#5EEAD4" }} className="mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-white">Peta Fleet Network</h3>
          <p className="text-sm text-gray-400 mt-2">
            Sebaran unit aktif di 10+ kota Indonesia
          </p>
        </div>

        {/* Connectivity + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={18} style={{ color: "#5EEAD4" }} />
              Connectivity
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Avg Uptime</p>
                <p className="text-xl font-bold text-white">96,4%</p>
              </div>
              <div>
                <p className="text-gray-400">Data Lag</p>
                <p className="text-xl font-bold text-white">2.1s</p>
              </div>
              <div>
                <p className="text-gray-400">Blockchain Sync</p>
                <p className="text-xl font-bold" style={{ color: "#5EEAD4" }}>
                  99,8%
                </p>
              </div>
              <div>
                <p className="text-gray-400">Tx Success</p>
                <p className="text-xl font-bold text-white">98,2%</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t" style={{ borderColor: "rgba(94,234,212,0.15)" }}>
              <p className="text-xs text-gray-400 mb-2">Zona Teratas</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Jakarta Selatan</span>
                  <span className="text-white">147 unit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Jakarta Pusat</span>
                  <span className="text-white">121 unit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Bandung</span>
                  <span className="text-white">94 unit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Surabaya</span>
                  <span className="text-white">88 unit</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
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
                  <th className="text-left py-3 px-4">Kategori</th>
                  <th className="text-left py-3 px-4">Zona</th>
                  <th className="text-left py-3 px-4">Waktu</th>
                  <th className="text-left py-3 px-4">Km</th>
                  <th className="text-left py-3 px-4">On-chain</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-white/5 transition"
                    style={{ borderColor: "rgba(94,234,212,0.1)" }}
                  >
                    <td className="py-3 px-4 font-mono text-white">{row.unit}</td>
                    <td className="py-3 px-4">
                      <span className="badge text-xs">{row.cat}</span>
                    </td>
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
        </div>
      </div>
    </div>
  );
}
