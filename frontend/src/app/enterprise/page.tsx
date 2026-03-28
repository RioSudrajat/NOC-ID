"use client";

import { motion } from "framer-motion";
import { Car, Cpu, Shield, BarChart3, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight, Activity, DollarSign, Wrench, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useEnterprise } from "@/context/EnterpriseContext";
import { useBooking } from "@/context/BookingContext";

export default function EnterpriseDashboard() {
  const enterprise = useEnterprise();
  const bookingCtx = useBooking();
  const m = enterprise?.metrics;
  const notifications = bookingCtx?.bookingNotifications || [];

  // Derive recent activity from notifications (last 10)
  const recentActivity = notifications.slice(0, 10);

  // Top workshops by total services
  const topWorkshops = (m?.workshopMetrics || [])
    .sort((a, b) => b.totalServices - a.totalServices)
    .slice(0, 5);

  // Use workshops from context with seed data fallback for recent mints
  const recentMints = (m?.vehicles || []).slice(0, 5);

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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { icon: Car, label: "Vehicles Registered", value: m?.totalVehicles.toLocaleString() || "0", change: `${m?.totalVehicles || 0} total`, color: "var(--solana-purple)" },
          { icon: Activity, label: "Active Sessions", value: m?.activeServiceSessions.toString() || "0", change: m?.activeServiceSessions ? "Sedang berlangsung" : "Tidak ada aktif", color: "var(--solana-green)" },
          { icon: DollarSign, label: "Monthly Revenue", value: `Rp ${((m?.revenueThisMonth || 0) / 1000).toFixed(0)}K`, change: `${m?.completedThisMonth || 0} servis bulan ini`, color: "var(--solana-cyan)" },
          { icon: Shield, label: "Avg Fleet Health", value: m?.avgFleetHealth.toString() || "0", change: `${m?.totalVehicles || 0} kendaraan`, color: (m?.avgFleetHealth || 0) >= 70 ? "#22C55E" : "#F97316" },
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

      {/* Model distribution + Service Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Vehicle Model Distribution</h2>
          <div className="flex flex-col gap-3">
            {(m?.vehicles || []).reduce<{ model: string; count: number }[]>((acc, v) => {
              const modelName = v.name.split(" ")[0];
              const existing = acc.find(a => a.model === modelName);
              if (existing) existing.count++;
              else acc.push({ model: modelName, count: 1 });
              return acc;
            }, []).sort((a, b) => b.count - a.count).map((item, i) => {
              const total = m?.totalVehicles || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm w-24">{item.model}</span>
                  <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, var(--solana-purple), var(--solana-green))" }} />
                  </div>
                  <span className="text-sm mono w-16 text-right" style={{ color: "var(--solana-text-muted)" }}>{item.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Service Type Distribution</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(m?.serviceTypeDistribution || {}).length > 0 ? (
              Object.entries(m?.serviceTypeDistribution || {})
                .sort(([, a], [, b]) => b - a)
                .map(([type, count], i) => {
                  const maxCount = Math.max(...Object.values(m?.serviceTypeDistribution || {}));
                  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-4">
                      <span className="text-sm w-36 truncate">{type}</span>
                      <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-3 rounded-full" style={{ background: "var(--solana-cyan)" }} />
                      </div>
                      <span className="text-sm mono w-12 text-right" style={{ color: "var(--solana-text-muted)" }}>{count}</span>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Belum ada data servis. Selesaikan booking untuk melihat distribusi.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed + Workshop Network Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity Feed */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity Feed</h2>
          {recentActivity.length > 0 ? (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {recentActivity.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(153,69,255,0.15)" }}>
                    {n.type.includes("completed") ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                     n.type.includes("paid") ? <DollarSign className="w-4 h-4 text-cyan-400" /> :
                     n.type.includes("invoice") ? <BarChart3 className="w-4 h-4 text-purple-400" /> :
                     <Clock className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--solana-text-muted)" }}>{n.message}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--solana-text-muted)" }}>{n.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Belum ada aktivitas terbaru.</p>
            </div>
          )}
        </div>

        {/* Workshop Network Status */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Workshop Network</h2>
            <Link href="/enterprise/workshops" className="text-sm flex items-center gap-1" style={{ color: "var(--solana-purple)" }}>
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {(m?.workshops || []).length > 0 ? (
            <div className="flex flex-col gap-3">
              {(m?.workshops || []).slice(0, 5).map((ws) => {
                const wsMetric = topWorkshops.find(w => w.workshopId === ws.id);
                return (
                  <div key={ws.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: ws.verified ? "rgba(20,241,149,0.1)" : "rgba(250,204,21,0.1)" }}>
                      <Wrench className="w-5 h-5" style={{ color: ws.verified ? "var(--solana-green)" : "#FACC15" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ws.name}</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--solana-text-muted)" }}>
                        <span>{ws.location}</span>
                        {ws.verified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                        {ws.oem && <Shield className="w-3 h-3 text-purple-400" />}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="#FACC15" />
                        <span className="text-sm font-bold text-yellow-400">{wsMetric?.avgRating ? wsMetric.avgRating.toFixed(1) : ws.rating}</span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{wsMetric?.totalServices || ws.totalServices} servis</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Belum ada workshop terdaftar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Mints / Fleet Vehicles */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Fleet Vehicles</h2>
          <Link href="/enterprise/fleet" className="text-sm flex items-center gap-1" style={{ color: "var(--solana-purple)" }}>
            View Fleet Map <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>VIN</th><th>Model</th><th>Region</th><th>Health</th><th>Status</th></tr></thead>
            <tbody>
              {recentMints.length > 0 ? recentMints.map((v, i) => (
                <tr key={i}>
                  <td className="mono text-sm">{v.vin}</td>
                  <td className="font-medium">{v.name}</td>
                  <td style={{ color: "var(--solana-text-muted)" }}>{v.region}</td>
                  <td>
                    <span className="mono font-bold" style={{ color: v.health >= 80 ? "#22C55E" : v.health >= 60 ? "#FACC15" : "#F97316" }}>{v.health}</span>
                  </td>
                  <td>
                    {v.health >= 70 ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--solana-green)" }}><CheckCircle2 className="w-4 h-4" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#F97316" }}><AlertTriangle className="w-4 h-4" /> Warning</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada kendaraan terdaftar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
