"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Clock, Wrench, Users } from "lucide-react";

const monthlyRevenue = [
  { month: "Oct", value: 4200000 }, { month: "Nov", value: 5100000 }, { month: "Dec", value: 4800000 },
  { month: "Jan", value: 6200000 }, { month: "Feb", value: 7100000 }, { month: "Mar", value: 6800000 },
];
const maxRevenue = Math.max(...monthlyRevenue.map(r => r.value));

const serviceBreakdown = [
  { name: "Oil Change", count: 128, pct: 32, color: "var(--solana-green)" },
  { name: "Brake Service", count: 86, pct: 22, color: "var(--solana-purple)" },
  { name: "Full Inspection", count: 64, pct: 16, color: "var(--solana-cyan)" },
  { name: "CVT Service", count: 48, pct: 12, color: "#FACC15" },
  { name: "Tire Service", count: 40, pct: 10, color: "#F97316" },
  { name: "Others", count: 32, pct: 8, color: "var(--solana-text-muted)" },
];

const peakHours = [
  [0.2, 0.3, 0.5, 0.9, 1.0, 0.8, 0.4],
  [0.1, 0.2, 0.4, 0.7, 0.9, 0.6, 0.3],
  [0.3, 0.4, 0.6, 0.8, 0.7, 0.5, 0.2],
];
const timeSlots = ["08-10", "10-12", "12-14", "14-16", "16-18"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WorkshopAnalyticsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Analytics
        </h1>
        <p>Workshop performance overview and service metrics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
        {[
          { icon: DollarSign, label: "Revenue (Mar)", value: "Rp 6.8M", change: "+12%", color: "var(--solana-green)" },
          { icon: Wrench, label: "Total Services", value: "398", change: "+8%", color: "var(--solana-purple)" },
          { icon: Users, label: "Unique Customers", value: "156", change: "+15%", color: "var(--solana-cyan)" },
          { icon: Clock, label: "Avg Service Time", value: "2.4h", change: "-10%", color: "#FACC15" },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 md:p-8">
            <card.icon className="w-5 h-5 mb-3" style={{ color: card.color }} />
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{card.label}</p>
            <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: card.color }}><TrendingUp className="w-3 h-3" /> {card.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Revenue chart */}
        <div className="glass-card-static p-8">
          <h3 className="text-base font-semibold mb-8">Monthly Revenue</h3>
          <div className="flex items-end gap-3" style={{ height: 200 }}>
            {monthlyRevenue.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div initial={{ height: 0 }} animate={{ height: `${(m.value / maxRevenue) * 160}px` }} transition={{ duration: 0.6, delay: i * 0.1 }} className="w-full rounded-t-lg" style={{ background: "var(--solana-gradient)", minHeight: 4 }} />
                <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service breakdown */}
        <div className="glass-card-static p-8">
          <h3 className="text-base font-semibold mb-8">Service Breakdown</h3>
          <div className="flex flex-col gap-4">
            {serviceBreakdown.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-28 truncate" style={{ color: "var(--solana-text-muted)" }}>{s.name}</span>
                <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "rgba(20,20,40,0.5)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} className="h-full rounded-md" style={{ background: s.color, opacity: 0.7 }} />
                </div>
                <span className="text-xs mono w-12 text-right font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak hours heatmap */}
      <div className="glass-card-static p-8">
        <h3 className="text-base font-semibold mb-8">Peak Hours Heatmap</h3>
        <div className="overflow-x-auto">
          <div className="grid gap-2" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)`, minWidth: 400 }}>
            <div />
            {days.map(d => <div key={d} className="text-center text-xs" style={{ color: "var(--solana-text-muted)" }}>{d}</div>)}
            {peakHours.map((row, ri) => (
              <>
                <div key={`label-${ri}`} className="text-xs flex items-center" style={{ color: "var(--solana-text-muted)" }}>{timeSlots[ri]}</div>
                {row.map((val, ci) => (
                  <div key={`${ri}-${ci}`} className="h-10 rounded-lg" style={{ background: `rgba(153,69,255,${val * 0.5 + 0.05})` }} title={`${(val * 100).toFixed(0)}% busy`} />
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
