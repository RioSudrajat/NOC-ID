"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Map, Car, Shield, AlertTriangle, CheckCircle2, MapPin, Search, Filter, Download, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";
import { getHealthColor, getHealthStatus } from "@/lib/health";

const FleetLeafletMap = dynamic(() => import("@/components/ui/FleetLeafletMap"), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <Map className="w-12 h-12 mx-auto mb-3 animate-pulse" style={{ color: "var(--solana-purple)", opacity: 0.5 }} />
      <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Loading Fleet Map...</p>
    </div>
  </div>
)});

export default function FleetPage() {
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;
  const vehicles = m?.vehicles || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Compute regional distribution
  const regions = useMemo(() => {
    const regionMap: Record<string, { healthy: number; warning: number; critical: number }> = {};
    for (const v of vehicles) {
      const existing = regionMap[v.region] || { healthy: 0, warning: 0, critical: 0 };
      if (v.health >= 70) existing.healthy++;
      else if (v.health >= 50) existing.warning++;
      else existing.critical++;
      regionMap[v.region] = existing;
    }
    const colors = ["var(--solana-purple)", "var(--solana-green)", "var(--solana-cyan)", "#FCD34D", "#5EEAD4", "var(--solana-pink)"];
    return Object.entries(regionMap)
      .map(([name, data], i) => ({ name, vehicles: data.healthy + data.warning + data.critical, ...data, color: colors[i % colors.length] }))
      .sort((a, b) => b.vehicles - a.vehicles);
  }, [vehicles]);

  const regionNames = regions.map(r => r.name);

  // Filtered vehicle list
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (searchQuery && !v.vin.toLowerCase().includes(searchQuery.toLowerCase()) && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (regionFilter && v.region !== regionFilter) return false;
      if (statusFilter === "good" && v.health < 70) return false;
      if (statusFilter === "warning" && (v.health < 50 || v.health >= 70)) return false;
      if (statusFilter === "critical" && v.health >= 50) return false;
      return true;
    });
  }, [vehicles, searchQuery, regionFilter, statusFilter]);

  const totalVehicles = vehicles.length;
  const healthyCount = vehicles.filter(v => v.health >= 70).length;
  const warningCount = vehicles.filter(v => v.health >= 50 && v.health < 70).length;
  const criticalCount = vehicles.filter(v => v.health < 50).length;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="page-header mb-0">
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Map className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Fleet Map
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Vehicle distribution across regions — live from fleet registry</p>
        </div>
        <button className="glow-btn-outline text-sm flex items-center gap-2 py-2 px-4">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: Car, label: "Total Vehicles", value: totalVehicles.toLocaleString(), color: "var(--solana-purple)" },
          { icon: CheckCircle2, label: "Healthy", value: healthyCount.toLocaleString(), color: "#86EFAC" },
          { icon: AlertTriangle, label: "Warnings", value: warningCount.toLocaleString(), color: "#FCD34D" },
          { icon: Shield, label: "Critical", value: criticalCount.toLocaleString(), color: "#FCA5A5" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl">
            <s.icon className="w-6 h-6 mb-3" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Region breakdown & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="glass-card-static p-6 rounded-2xl col-span-1 border" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
          <h3 className="text-base font-semibold mb-6">Regional Distribution</h3>
          <div className="flex flex-col gap-6">
            {regions.map((r, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <MapPin className="w-4 h-4 shrink-0 transition-transform group-hover:scale-125" style={{ color: r.color }} />
                <span className="text-sm w-20">{r.name}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(20,20,40,0.5)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.healthy / Math.max(r.vehicles, 1)) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} className="h-full" style={{ background: "#86EFAC", opacity: 0.8 }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.warning / Math.max(r.vehicles, 1)) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 + 0.1 }} className="h-full" style={{ background: "#FCD34D", opacity: 0.8 }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.critical / Math.max(r.vehicles, 1)) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 + 0.2 }} className="h-full" style={{ background: "#FCA5A5", opacity: 0.8 }} />
                </div>
                <span className="text-xs font-semibold mono w-12 text-right">{r.vehicles}</span>
              </div>
            ))}
            {regions.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--solana-text-muted)" }}>Belum ada data regional.</p>
            )}
          </div>
        </div>

        {/* Live Leaflet Map */}
        <div className="glass-card-static rounded-2xl col-span-1 lg:col-span-2 relative overflow-hidden border" style={{ borderColor: "rgba(94, 234, 212,0.1)", minHeight: 400 }}>
          <FleetLeafletMap vehicles={vehicles} />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
          <input type="text" placeholder="Search by VIN or Model..." className="input-field pl-9 w-full text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
            <select className="input-field pl-9 text-sm w-40 appearance-none bg-transparent" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="">All Regions</option>
              {regionNames.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="relative">
            <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
            <select className="input-field pl-9 text-sm w-40 appearance-none bg-transparent" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status: All</option>
              <option value="good">Good / Excellent</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical / Danger</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle list */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">VIN</th>
              <th className="py-4 px-6 font-medium">Model</th>
              <th className="py-4 px-6 font-medium">Region</th>
              <th className="py-4 px-6 font-medium">Health Score</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredVehicles.length > 0 ? filteredVehicles.map((v, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer">
                <td className="py-4 px-6"><span className="mono text-xs">{v.vin}</span></td>
                <td className="py-4 px-6 font-medium">{v.name}</td>
                <td className="py-4 px-6 text-gray-400">{v.region}</td>
                <td className="py-4 px-6">
                  <span className="font-bold mono px-2 py-1 rounded-md" style={{ color: getHealthColor(v.health), background: `${getHealthColor(v.health)}15` }}>
                    {v.health}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${getHealthColor(v.health)}15`, color: getHealthColor(v.health), border: `1px solid ${getHealthColor(v.health)}40` }}>
                    {getHealthStatus(v.health)}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tidak ada kendaraan yang cocok dengan filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
