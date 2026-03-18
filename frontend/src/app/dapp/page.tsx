"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Calendar,
  Coins,
  TrendingUp,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const recentEvents = [
  { date: "2026-02-10", type: "Oil Change", mechanic: "Pak Hendra (★ 4.8)", mileage: "34,521 km", status: "Verified" },
  { date: "2026-01-15", type: "Brake Pad Replacement", mechanic: "Workshop Maju Jaya (★ 4.5)", mileage: "31,200 km", status: "Verified" },
  { date: "2025-11-20", type: "Full Inspection", mechanic: "Dealer Toyota BSD (★ 4.9)", mileage: "28,000 km", status: "Verified" },
  { date: "2025-08-15", type: "CVT Fluid Replacement", mechanic: "Pak Hendra (★ 4.8)", mileage: "24,100 km", status: "Verified" },
];

const aiAlerts = [
  { part: "CVT Belt", health: 42, risk: "High", prediction: "Replace within 45 days", color: "#F97316" },
  { part: "Air Filter", health: 55, risk: "Medium", prediction: "Replace within 60 days", color: "#FACC15" },
  { part: "Brake Fluid", health: 68, risk: "Medium", prediction: "Flush within 90 days", color: "#FACC15" },
];

function HealthScoreRing({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "#22C55E" : score >= 70 ? "#A3E635" : score >= 50 ? "#FACC15" : score >= 30 ? "#F97316" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(153,69,255,0.1)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health</p>
      </div>
    </div>
  );
}

export default function DAppDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Vehicle Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Toyota Avanza 2025 · VIN: MHKA1BA1JFK000001</p>
        </div>
        <Link href="/dapp/viewer" className="glow-btn text-sm flex items-center gap-2" style={{ padding: "10px 20px" }}>
          Open 3D Twin <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col items-center">
          <HealthScoreRing score={87} />
          <p className="mt-3 text-sm font-semibold">Overall Health</p>
          <span className="badge badge-green mt-2">Good</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(153,69,255,0.12)" }}>
              <Calendar className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Next Service</p>
              <p className="font-semibold">In 15 days</p>
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>CVT Belt Inspection recommended</p>
          <div className="mt-3 w-full h-1 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
            <div className="h-1 rounded-full" style={{ width: "70%", background: "var(--solana-gradient)" }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,241,149,0.12)" }}>
              <Coins className="w-5 h-5" style={{ color: "var(--solana-green)" }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>$NOC Balance</p>
              <p className="text-2xl font-bold gradient-text">1,247</p>
            </div>
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--solana-green)" }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">+125 this month</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(153,69,255,0.12)" }}>
              <Clock className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Total Mileage</p>
              <p className="text-2xl font-bold">34,521 km</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>12 service events on-chain</p>
        </motion.div>
      </div>

      {/* AI Alerts */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
          AI Predictive Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {aiAlerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 border-l-4"
              style={{ borderLeftColor: alert.color }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{alert.part}</h3>
                <span className="text-2xl font-bold mono" style={{ color: alert.color }}>{alert.health}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{alert.prediction}</p>
              <div className="mt-3 w-full h-1.5 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${alert.health}%`, background: alert.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent events */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Wrench className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
            Recent Service Events
          </h2>
          <Link href="/dapp/timeline" className="text-sm flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--solana-purple)" }}>
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Mechanic</th>
                <th>Mileage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e, i) => (
                <tr key={i}>
                  <td className="mono text-sm">{e.date}</td>
                  <td className="font-medium">{e.type}</td>
                  <td style={{ color: "var(--solana-text-muted)" }}>{e.mechanic}</td>
                  <td className="mono">{e.mileage}</td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--solana-green)" }}>
                      <CheckCircle2 className="w-4 h-4" /> {e.status}
                    </span>
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
