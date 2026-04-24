"use client";

import Link from "next/link";
import { Lock, MapPin, ChevronRight } from "lucide-react";

const units = [
  { unit: "#NMS-0001", status: "🟢 Aktif", nodeScore: 94, kmToday: 127, health: 91 },
  { unit: "#NMS-0042", status: "🟡 Servis", nodeScore: 72, kmToday: 0, health: 72 },
  { unit: "#NMS-0018", status: "🟢 Aktif", nodeScore: 81, kmToday: 94, health: 79 },
  { unit: "#NMS-0055", status: "🟢 Aktif", nodeScore: 88, kmToday: 156, health: 92 },
  { unit: "#NMS-0073", status: "🟢 Aktif", nodeScore: 95, kmToday: 73, health: 98 },
];

export default function PoolFleetMapPage({ params }: { params: { poolId: string } }) {
  const isInvestor = true;

  if (!isInvestor) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
      >
        <div className="glass-card p-10 max-w-md w-full text-center">
          <Lock size={48} style={{ color: "#F59E0B" }} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-orbitron)]">
            Akses Terkunci
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Hanya Investor Pool. Invest di Nemesis FI untuk akses.
          </p>
          <Link href="/fi" className="glow-btn inline-flex items-center gap-2">
            Ke Nemesis FI <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // decorative dots for map
  const dots = Array.from({ length: 40 }).map((_, i) => {
    const colors = ["#22C55E", "#22C55E", "#22C55E", "#D1D5DB", "#F59E0B", "#EF4444"];
    const c = colors[i % colors.length];
    const top = Math.floor(Math.random() * 85) + 5;
    const left = Math.floor(Math.random() * 90) + 5;
    return { c, top, left };
  });

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2">
          Fleet Pool {params.poolId} — Jakarta
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Real-time monitoring armada dalam pool kamu
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">Total Unit</p>
            <p className="text-2xl font-bold text-white mt-1">100</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">Km Hari Ini</p>
            <p className="text-2xl font-bold text-white mt-1">47.291</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 uppercase">Utilisasi</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#5EEAD4" }}>
              71%
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <span className="badge">🟢 Aktif (71)</span>
          <span className="badge">⚪ Idle (12)</span>
          <span className="badge">🟡 Servis (5)</span>
          <span className="badge">🔴 Offline (12)</span>
        </div>

        {/* Map placeholder with decorative dots */}
        <div
          className="glass-card mb-6 relative overflow-hidden"
          style={{
            height: "450px",
            background:
              "radial-gradient(circle at center, rgba(94,234,212,0.1) 0%, rgba(34,38,46,0.8) 70%)",
          }}
        >
          {dots.map((d, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                top: `${d.top}%`,
                left: `${d.left}%`,
                width: "10px",
                height: "10px",
                background: d.c,
                boxShadow: `0 0 8px ${d.c}`,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <MapPin size={56} style={{ color: "#5EEAD4" }} className="mx-auto mb-3 opacity-60" />
              <p className="text-lg font-bold text-white">Peta Armada Pool</p>
              <p className="text-sm text-gray-400">Real-time — Jakarta region</p>
            </div>
          </div>
        </div>

        {/* Unit detail table */}
        <h3 className="text-lg font-bold text-white mb-4">Detail Unit</h3>
        <div
          className="rounded-2xl overflow-hidden mb-6"
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
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Node Score</th>
                <th className="text-right py-3 px-4">Km Today</th>
                <th className="text-right py-3 px-4">Health</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, idx) => (
                <tr
                  key={idx}
                  className="border-t"
                  style={{ borderColor: "rgba(94,234,212,0.1)" }}
                >
                  <td className="py-3 px-4 font-mono text-white">{u.unit}</td>
                  <td className="py-3 px-4">{u.status}</td>
                  <td className="py-3 px-4 text-right text-white">{u.nodeScore}</td>
                  <td className="py-3 px-4 text-right text-gray-300">{u.kmToday} km</td>
                  <td className="py-3 px-4 text-right font-bold" style={{ color: "#5EEAD4" }}>
                    {u.health}/100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Aggregate */}
        <div
          className="glass-card p-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(94,234,212,0.15) 0%, rgba(34,38,46,0.8) 100%)",
            border: "1px solid rgba(94,234,212,0.4)",
          }}
        >
          <p className="text-xs text-gray-400 uppercase">Estimasi Yield</p>
          <p className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "#5EEAD4" }}>
            192.000 IDRX <span className="text-sm text-gray-400 font-normal">minggu ini</span>
          </p>
        </div>
      </div>
    </div>
  );
}
