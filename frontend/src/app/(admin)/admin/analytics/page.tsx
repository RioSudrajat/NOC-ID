"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Star, DollarSign, Car, Users, Wrench, Shield } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";
import { useAdmin } from "@/context/AdminContext";

export default function AdminAnalyticsPage() {
  const enterprise = useEnterprise();
  const admin = useAdmin();
  const m = enterprise?.metrics;
  const wallets = admin?.whitelistedWallets || [];

  const totalDrivers = wallets.filter(w => w.role === "driver").length;
  const totalWorkshops = wallets.filter(w => w.role === "workshop").length;

  const wsMetrics = m?.workshopMetrics || [];
  const maxWsServices = wsMetrics.length > 0 ? Math.max(...wsMetrics.map(w => w.servicesCompleted)) : 1;
  const avgRating = wsMetrics.length > 0 ? wsMetrics.reduce((s, w) => s + w.rating, 0) / wsMetrics.length : 0;
  const oemRate = 96;
  const totalOemParts = 1240;
  const totalAftermarketParts = 52;
  const avgFleetHealth = 87;

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
          <BarChart3 className="w-7 h-7" style={{ color: "#5EEAD4" }} />
          Platform Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Cross-entity analytics and platform health metrics.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: "Platform Revenue", value: `Rp ${((m?.totalRevenue || 0) / 1_000_000).toFixed(1)}M`, color: "var(--solana-green)" },
          { icon: Car, label: "Vehicles Minted", value: m?.totalVehicles || 0, color: "#5EEAD4" },
          { icon: Star, label: "Avg Workshop Rating", value: avgRating ? avgRating.toFixed(1) : "—", color: "#FCD34D" },
          { icon: Shield, label: "OEM Parts Rate", value: `${oemRate}%`, color: "var(--solana-purple)" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Growth */}
        <div className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-teal-400" /> Growth Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Vehicles", value: m?.totalVehicles || 0, icon: Car },
              { label: "Workshops Onboarded", value: totalWorkshops, icon: Wrench },
              { label: "Active Drivers", value: totalDrivers, icon: Users },
              { label: "Completed Services", value: m?.totalCompletedServices || 0, icon: BarChart3 },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                <item.icon className="w-5 h-5 mx-auto mb-2 text-teal-400" />
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Workshop Performance */}
        <div className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-teal-400" /> Workshop Performance</h3>
          {wsMetrics.length > 0 ? (
            <div className="flex flex-col gap-4">
              {[...wsMetrics].sort((a, b) => b.servicesCompleted - a.servicesCompleted).slice(0, 6).map((ws, i) => {
                const pct = Math.round((ws.servicesCompleted / maxWsServices) * 100);
                return (
                  <div key={ws.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-[180px]">{ws.name}</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-yellow-400" fill="#FCD34D" />
                        <span className="text-xs text-yellow-400">{ws.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">{ws.servicesCompleted} servis</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/30">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #5EEAD4, #FCD34D)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>No workshop data yet.</p>
            </div>
          )}
        </div>

        {/* Part Distribution */}
        <div className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-teal-400" /> Part Origin Distribution</h3>
          <div className="flex items-center gap-8 justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--solana-green)" strokeWidth="3" strokeDasharray={`${oemRate} ${100 - oemRate}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{oemRate}%</span>
                <span className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>OEM</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-400" /><span className="text-sm">OEM: {totalOemParts}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-400" /><span className="text-sm">Aftermarket: {totalAftermarketParts}</span></div>
            </div>
          </div>
        </div>

        {/* Quality */}
        <div className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Quality Metrics</h3>
          <div className="flex flex-col gap-4">
            {[
              { label: "Avg Fleet Health", value: avgFleetHealth, max: 100, color: "var(--solana-green)" },
              { label: "OEM Compliance", value: oemRate, max: 100, color: "var(--solana-purple)" },
              { label: "Avg Rating (out of 5)", value: avgRating * 20, max: 100, color: "#FCD34D", display: avgRating ? avgRating.toFixed(1) : "—" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--solana-text-muted)" }}>{item.label}</span>
                  <span className="font-bold">{item.display || `${item.value}%`}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/30">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
