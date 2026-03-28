"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Star, Shield, CheckCircle2, MapPin, Phone, ExternalLink, ShieldAlert, BadgeCheck, Search, Filter, Download, Clock, DollarSign, BarChart3 } from "lucide-react";
import Link from "next/link";
import { workshopsData } from "@/context/BookingContext";
import { useEnterprise } from "@/context/EnterpriseContext";

export default function WorkshopDirectoryPage() {
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;
  const wsMetrics = m?.workshopMetrics || [];

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const workshops = workshopsData;

  const filtered = useMemo(() => {
    return workshops.filter(w => {
      if (filter === "verified" && !w.verified) return false;
      if (filter === "oem" && !w.oem) return false;
      if (filter === "pending" && w.verified) return false;
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [workshops, filter, searchQuery]);

  const verifiedCount = workshops.filter(w => w.verified).length;
  const oemCount = workshops.filter(w => w.oem).length;
  const pendingCount = workshops.filter(w => !w.verified).length;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="page-header mb-0">
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Wrench className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Partner Workshops
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Unified workshop data — live metrics from service records.</p>
        </div>
        <button className="glow-btn-outline text-sm flex items-center gap-2 py-2 px-4">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Network", value: workshops.length, color: "var(--solana-purple)", icon: Wrench },
          { label: "Officially Verified", value: verifiedCount, color: "var(--solana-green)", icon: CheckCircle2 },
          { label: "OEM Certified", value: oemCount, color: "var(--solana-cyan)", icon: Shield },
          { label: "Pending KYC", value: pendingCount, color: "#FACC15", icon: ShieldAlert },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <s.icon className="w-6 h-6 mb-2" style={{ color: s.color }} />
            <p className="text-3xl font-bold mb-1">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
          {[{ id: "all", label: "All Network" }, { id: "verified", label: "Verified Only" }, { id: "oem", label: "OEM Certified" }, { id: "pending", label: "Pending KYC" }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: filter === f.id ? "rgba(153,69,255,0.2)" : "transparent", color: filter === f.id ? "#fff" : "var(--solana-text-muted)" }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search Workshop Name..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Workshop cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filtered.map((w, i) => {
            const metric = wsMetrics.find(wm => wm.workshopId === w.id);
            return (
              <motion.div layout key={w.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }} className="glass-card-static p-6 rounded-2xl border border-white/5 group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{w.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> {w.location}, {w.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ background: "rgba(250,204,21,0.1)", borderColor: "rgba(250,204,21,0.25)" }}>
                    <Star className="w-3.5 h-3.5 text-yellow-400" fill="#FACC15" />
                    <span className="text-sm font-bold text-yellow-400">{metric?.avgRating ? metric.avgRating.toFixed(1) : w.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {w.verified ? (
                    <span className="badge badge-green flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> Verified Signer</span>
                  ) : (
                    <span className="badge flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3.5 h-3.5" /> Pending Approval</span>
                  )}
                  {w.oem && <span className="badge badge-purple flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> OEM Certified</span>}
                  <span className="badge flex items-center gap-1" style={{ background: "rgba(20,20,40,0.5)", color: "var(--solana-text-muted)", border: "1px solid rgba(153,69,255,0.1)" }}>{w.specialization}</span>
                </div>

                {/* Live metrics from context */}
                {metric && (
                  <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="text-center">
                      <BarChart3 className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                      <p className="text-sm font-bold">{metric.servicesThisMonth}</p>
                      <p className="text-[10px] text-gray-500">Servis Bulan Ini</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-400" />
                      <p className="text-sm font-bold">Rp {(metric.revenueThisMonth / 1000).toFixed(0)}K</p>
                      <p className="text-[10px] text-gray-500">Revenue Bulan Ini</p>
                    </div>
                    <div className="text-center">
                      <Shield className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                      <p className="text-sm font-bold">{metric.oemPartsUsed + metric.aftermarketPartsUsed > 0 ? Math.round((metric.oemPartsUsed / (metric.oemPartsUsed + metric.aftermarketPartsUsed)) * 100) : 100}%</p>
                      <p className="text-[10px] text-gray-500">OEM Rate</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 mt-auto border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="mono text-lg font-bold text-purple-400 leading-none">{metric?.totalServices || w.totalServices}</span>
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Logs Signed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center p-2.5 rounded-xl transition-colors hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", color: "var(--solana-text-muted)" }}>
                      <Phone className="w-4 h-4" />
                    </button>
                    <Link href={`/enterprise/workshops/${w.id}`} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-medium transition-colors" style={{ background: "rgba(153,69,255,0.1)", color: "var(--solana-purple)" }}>
                      <ExternalLink className="w-4 h-4" /> View Profile
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 px-4 border border-dashed rounded-3xl border-white/20 glass-card-static">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No workshops found</h3>
          <p className="text-gray-400 text-sm">Adjust your filters or search query to find partners.</p>
        </div>
      )}
    </div>
  );
}
