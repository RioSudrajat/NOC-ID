"use client";

import { motion } from "framer-motion";
import { Car, Cpu, Shield, BarChart3, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const recentMints = [
  { vin: "MHKA1BA1JFK000001", model: "Avanza 2025", date: "2026-02-15", status: "Active", health: 87 },
  { vin: "MHKA1BA1JFK000002", model: "Avanza 2025", date: "2026-02-15", status: "Active", health: 92 },
  { vin: "MHKB2CC3JFK000001", model: "Rush 2025", date: "2026-02-10", status: "Active", health: 78 },
  { vin: "MHKC3DD4JFK000001", model: "Innova 2025", date: "2026-01-28", status: "Active", health: 95 },
  { vin: "MHKD4EE5JFK000001", model: "Fortuner 2025", date: "2026-01-20", status: "Warranty Alert", health: 65 },
];

export default function EnterpriseDashboard() {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Enterprise Overview</h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>PT Astra Manufacturing · Fleet Management</p>
        </div>
        <Link href="/enterprise/mint" className="glow-btn text-sm flex items-center gap-2" style={{ padding: "10px 20px" }}>
          <Cpu className="w-4 h-4" /> Mint New Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { icon: Car, label: "Vehicles Minted", value: "1,247", change: "+32 this month", color: "var(--solana-purple)" },
          { icon: Shield, label: "Avg Health Score", value: "84.2", change: "+2.1 vs last month", color: "var(--solana-green)" },
          { icon: BarChart3, label: "Service Events", value: "8,912", change: "+425 this month", color: "var(--solana-cyan)" },
          { icon: AlertTriangle, label: "Warranty Alerts", value: "12", change: "3 critical", color: "#F97316" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{stat.label}</p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <span className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--solana-green)" }}>
              <TrendingUp className="w-3 h-3" /> {stat.change}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Model distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Vehicle Model Distribution</h2>
          <div className="flex flex-col gap-3">
            {[
              { model: "Avanza", count: 520, pct: 42 },
              { model: "Rush", count: 280, pct: 22 },
              { model: "Innova", count: 210, pct: 17 },
              { model: "Fortuner", count: 150, pct: 12 },
              { model: "Other", count: 87, pct: 7 },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm w-20">{m.model}</span>
                <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-3 rounded-full" style={{ background: `linear-gradient(90deg, var(--solana-purple), var(--solana-green))` }} />
                </div>
                <span className="text-sm mono w-16 text-right" style={{ color: "var(--solana-text-muted)" }}>{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Health Score Distribution</h2>
          <div className="flex flex-col gap-3">
            {[
              { range: "90-100 (Excellent)", count: 687, pct: 55, color: "#22C55E" },
              { range: "70-89 (Good)", count: 312, pct: 25, color: "#A3E635" },
              { range: "50-69 (Warning)", count: 162, pct: 13, color: "#FACC15" },
              { range: "30-49 (Critical)", count: 62, pct: 5, color: "#F97316" },
              { range: "0-29 (Danger)", count: 24, pct: 2, color: "#EF4444" },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs w-36" style={{ color: h.color }}>{h.range}</span>
                <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${h.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-3 rounded-full" style={{ background: h.color }} />
                </div>
                <span className="text-sm mono w-12 text-right" style={{ color: "var(--solana-text-muted)" }}>{h.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent mints table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Mints</h2>
          <Link href="/enterprise/mint" className="text-sm flex items-center gap-1" style={{ color: "var(--solana-purple)" }}>
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>VIN</th><th>Model</th><th>Mint Date</th><th>Health</th><th>Status</th></tr></thead>
            <tbody>
              {recentMints.map((v, i) => (
                <tr key={i}>
                  <td className="mono text-sm">{v.vin}</td>
                  <td className="font-medium">{v.model}</td>
                  <td style={{ color: "var(--solana-text-muted)" }}>{v.date}</td>
                  <td>
                    <span className="mono font-bold" style={{ color: v.health >= 80 ? "#22C55E" : v.health >= 60 ? "#FACC15" : "#F97316" }}>{v.health}</span>
                  </td>
                  <td>
                    {v.status === "Active" ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--solana-green)" }}><CheckCircle2 className="w-4 h-4" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#F97316" }}><AlertTriangle className="w-4 h-4" /> {v.status}</span>
                    )}
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
