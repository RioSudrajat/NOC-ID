"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Shield, Clock, Car, AlertTriangle } from "lucide-react";

const healthTrend = [78, 80, 79, 82, 84, 83, 85, 87, 86, 88, 87, 89];
const costData = [
  { month: "Oct", cost: 145 }, { month: "Nov", cost: 132 }, { month: "Dec", cost: 168 },
  { month: "Jan", cost: 121 }, { month: "Feb", cost: 115 }, { month: "Mar", cost: 108 },
];
const maxCost = Math.max(...costData.map(c => c.cost));

const compliance = [
  { category: "On-time Service", pct: 92, color: "var(--solana-green)" },
  { category: "OEM Parts Used", pct: 87, color: "var(--solana-purple)" },
  { category: "Warranty Coverage", pct: 78, color: "var(--solana-cyan)" },
  { category: "Digital Records", pct: 95, color: "#FACC15" },
];

export default function EnterpriseAnalyticsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Fleet Analytics
        </h1>
        <p>Fleet-wide health trends, cost analysis, and compliance metrics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
        {[
          { icon: TrendingUp, label: "Avg Health Score", value: "87.4", change: "+2.1", color: "var(--solana-green)" },
          { icon: DollarSign, label: "Avg Cost/Vehicle", value: "$108", change: "-12%", color: "var(--solana-cyan)" },
          { icon: Shield, label: "Compliance Rate", value: "92%", change: "+3%", color: "var(--solana-purple)" },
          { icon: AlertTriangle, label: "Open Issues", value: "23", change: "-5", color: "#F97316" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 lg:p-8">
            <s.icon className="w-6 h-6 mb-3" style={{ color: s.color }} />
            <p className="text-3xl font-bold mb-1">{s.value}</p>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
            <p className="text-sm font-semibold mt-2" style={{ color: s.color }}>{s.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Health trend */}
        <div className="glass-card-static p-8">
          <h3 className="text-base font-semibold mb-6">Fleet Health Trend (12 months)</h3>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {healthTrend.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div initial={{ height: 0 }} animate={{ height: `${((h - 70) / 30) * 140}px` }} transition={{ duration: 0.5, delay: i * 0.05 }} className="w-full rounded-t-md" style={{ background: `rgba(34,197,94,${0.3 + (h - 70) / 60})`, minHeight: 4 }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Apr 2025</span>
            <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Mar 2026</span>
          </div>
        </div>

        {/* Cost chart */}
        <div className="glass-card-static p-8">
          <h3 className="text-base font-semibold mb-6">Avg Maintenance Cost / Vehicle</h3>
          <div className="flex items-end gap-4" style={{ height: 160 }}>
            {costData.map((c, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <span className="text-sm mono font-semibold" style={{ color: "var(--solana-text-muted)" }}>${c.cost}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(c.cost / maxCost) * 120}px` }} transition={{ duration: 0.5, delay: i * 0.08 }} className="w-full rounded-t-lg" style={{ background: "var(--solana-gradient)", opacity: 0.7, minHeight: 4 }} />
                <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{c.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="glass-card-static p-8">
        <h3 className="text-base font-semibold mb-8">Service Compliance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {compliance.map((c, i) => (
            <div key={i} className="flex items-center gap-6">
              <span className="text-base w-40" style={{ color: "var(--solana-text-muted)" }}>{c.category}</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(20,20,40,0.5)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: c.color }} />
              </div>
              <span className="text-base font-bold mono">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
