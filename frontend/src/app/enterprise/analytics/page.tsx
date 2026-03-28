"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Shield, AlertTriangle, Download, Wrench, Star, Package } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";

export default function EnterpriseAnalyticsPage() {
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;

  const partFrequency = m?.partFrequency || [];
  const maxPartCount = partFrequency.length > 0 ? partFrequency[0].count : 1;

  // Workshop volume
  const wsMetrics = (m?.workshopMetrics || []).sort((a, b) => b.totalServices - a.totalServices);
  const maxWsServices = wsMetrics.length > 0 ? wsMetrics[0].totalServices : 1;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="page-header mb-0">
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <BarChart3 className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Fleet Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Live data from completed service records on-chain.</p>
        </div>
        <button className="glow-btn-outline text-sm flex items-center gap-2 py-2 px-4 shadow-lg shadow-purple-500/10">
          <Download className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: TrendingUp, label: "Avg Fleet Health", value: m?.avgFleetHealth.toString() || "0", change: `${m?.totalVehicles || 0} kendaraan`, color: "var(--solana-green)" },
          { icon: DollarSign, label: "Avg Cost/Service", value: `Rp ${((m?.avgCostPerService || 0) / 1000).toFixed(0)}K`, change: `${m?.totalCompletedServices || 0} total servis`, color: "var(--solana-cyan)" },
          { icon: Shield, label: "OEM Parts Rate", value: `${m?.oemRate || 100}%`, change: `${m?.totalOemParts || 0} OEM / ${m?.totalAftermarketParts || 0} aftermarket`, color: "var(--solana-purple)" },
          { icon: Star, label: "Avg Rating", value: m?.avgRating.toFixed(1) || "0", change: `${m?.totalReviews || 0} review`, color: "#FACC15" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{s.value}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--solana-text-muted)" }}>{s.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Failure Points / Part Frequency */}
        <div className="glass-card-static p-8 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-400" /> Top Part Frequency
          </h3>
          <p className="text-sm mb-6 pb-4 border-b border-white/5" style={{ color: "var(--solana-text-muted)" }}>Parts most frequently used across completed services.</p>
          {partFrequency.length > 0 ? (
            <div className="flex flex-col gap-5">
              {partFrequency.slice(0, 6).map((f, i) => {
                const pct = Math.round((f.count / maxPartCount) * 100);
                const colors = ["#EF4444", "#F97316", "#FACC15", "var(--solana-pink)", "var(--solana-cyan)", "var(--solana-green)"];
                return (
                  <div key={f.name} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{f.name}</span>
                      <span className="mono text-gray-400">{f.count}x used</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden bg-black/30 border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full rounded-full relative" style={{ background: colors[i % colors.length] }}>
                        <div className="absolute inset-0 bg-white/20 w-0 group-hover:w-full transition-all duration-500 ease-out" />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Belum ada data part. Selesaikan booking untuk melihat frekuensi.</p>
            </div>
          )}
        </div>

        {/* Service Volume by Workshop */}
        <div className="glass-card-static p-8 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" /> Service Volume by Workshop
          </h3>
          {wsMetrics.length > 0 ? (
            <div className="flex flex-col gap-5">
              {wsMetrics.slice(0, 6).map((ws, i) => {
                const pct = Math.round((ws.totalServices / maxWsServices) * 100);
                return (
                  <div key={ws.workshopId} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium truncate max-w-[200px]">{ws.workshopName}</span>
                      <span className="mono text-gray-400">{ws.totalServices} servis</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden bg-black/30 border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, var(--solana-purple), var(--solana-green))" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Belum ada data workshop. Selesaikan booking untuk melihat volume.</p>
            </div>
          )}
        </div>

        {/* Part Origin Distribution */}
        <div className="glass-card-static p-8 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" /> Part Origin Distribution
          </h3>
          <div className="flex items-center gap-8 justify-center py-4">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--solana-green)" strokeWidth="3" strokeDasharray={`${m?.oemRate || 100} ${100 - (m?.oemRate || 100)}`} strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{m?.oemRate || 100}%</span>
                <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>OEM</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--solana-green)" }} />
                <span className="text-sm">OEM Parts: <strong>{m?.totalOemParts || 0}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-sm">Aftermarket: <strong>{m?.totalAftermarketParts || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Compliance Overview */}
        <div className="glass-card-static p-8 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-6">Service Compliance Overview</h3>
          <div className="grid grid-cols-1 gap-5">
            {[
              { category: "OEM Parts Used", pct: m?.oemRate || 100, color: "var(--solana-purple)" },
              { category: "Digital Records (On-Chain)", pct: m?.totalCompletedServices ? 100 : 0, color: "#FACC15" },
              { category: "Avg Customer Satisfaction", pct: Math.round(((m?.avgRating || 0) / 5) * 100), color: "var(--solana-green)" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm font-medium w-44" style={{ color: "var(--solana-text-muted)" }}>{c.category}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-black/30 border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: c.color }} />
                </div>
                <span className="text-sm font-bold mono w-10 text-right">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
