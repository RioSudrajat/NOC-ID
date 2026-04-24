"use client";

import { useState, useMemo, useTransition } from "react";
import { motion } from "framer-motion";
import { Car, Search, Filter, Shield, Download, MoreHorizontal } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";
import { getHealthColor, getHealthStatus } from "@/lib/health";

export default function AdminVehiclesPage() {
  const enterprise = useEnterprise();
  const vehicles = enterprise?.metrics.vehicles || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const regions = useMemo(() => [...new Set(vehicles.map(v => v.region))], [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      if (searchQuery && !v.vin.toLowerCase().includes(searchQuery.toLowerCase()) && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (regionFilter && v.region !== regionFilter) return false;
      if (statusFilter === "good" && v.health < 70) return false;
      if (statusFilter === "warning" && (v.health < 50 || v.health >= 70)) return false;
      if (statusFilter === "critical" && v.health >= 50) return false;
      return true;
    });
  }, [vehicles, searchQuery, regionFilter, statusFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Car className="w-7 h-7" style={{ color: "#5EEAD4" }} />
            Vehicle Registry
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Master vehicle registry across all enterprises.</p>
        </div>
        <button className="text-sm flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(94, 234, 212,0.1)", color: "#5EEAD4", border: "1px solid rgba(94, 234, 212,0.3)" }}>
          <Download className="w-4 h-4" /> Export Fleet Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Vehicles", value: vehicles.length, color: "#5EEAD4" },
          { label: "Healthy (≥70)", value: vehicles.filter(v => v.health >= 70).length, color: "#86EFAC" },
          { label: "Warning (50-69)", value: vehicles.filter(v => v.health >= 50 && v.health < 70).length, color: "#FCD34D" },
          { label: "Critical (<50)", value: vehicles.filter(v => v.health < 50).length, color: "#FCA5A5" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 rounded-2xl">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by VIN or Model..." className="input-field pl-9 w-full text-sm" value={searchQuery} onChange={e => startTransition(() => setSearchQuery(e.target.value))} />
        </div>
        <div className="flex gap-3">
          <select className="input-field text-sm w-36 bg-transparent" value={regionFilter} onChange={e => startTransition(() => setRegionFilter(e.target.value))}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="input-field text-sm w-36 bg-transparent" value={statusFilter} onChange={e => startTransition(() => setStatusFilter(e.target.value))}>
            <option value="">All Status</option>
            <option value="good">Good / Excellent</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`glass-card-static overflow-hidden rounded-2xl border transition-opacity ${isPending ? "opacity-60" : ""}`} style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">VIN</th>
              <th className="py-4 px-6 font-medium">Model</th>
              <th className="py-4 px-6 font-medium">Owner</th>
              <th className="py-4 px-6 font-medium">Region</th>
              <th className="py-4 px-6 font-medium">Health</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Mileage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((v, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 mono text-xs" style={{ color: "#5EEAD4" }}>{v.vin}</td>
                <td className="py-4 px-6 font-medium">{v.name}</td>
                <td className="py-4 px-6 mono text-xs text-gray-400">{v.owner.slice(0, 8)}...</td>
                <td className="py-4 px-6 text-gray-400">{v.region}</td>
                <td className="py-4 px-6">
                  <span className="font-bold mono px-2 py-1 rounded-md" style={{ color: getHealthColor(v.health), background: `${getHealthColor(v.health)}15` }}>{v.health}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${getHealthColor(v.health)}15`, color: getHealthColor(v.health) }}>{getHealthStatus(v.health)}</span>
                </td>
                <td className="py-4 px-6 text-gray-400">{v.odometer.toLocaleString("id-ID")} km</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500"><Car className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No vehicles match the filter.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
