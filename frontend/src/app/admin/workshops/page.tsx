"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Star, Shield, CheckCircle2, ShieldAlert, Search, MapPin, BadgeCheck, Clock } from "lucide-react";
import { workshopsData, useBooking } from "@/context/BookingContext";
import { useEnterprise } from "@/context/EnterpriseContext";
import { useToast } from "@/components/ui/Toast";

export default function AdminWorkshopsPage() {
  const { showToast } = useToast();
  const booking = useBooking();
  const enterprise = useEnterprise();
  const wsMetrics = enterprise?.metrics.workshopMetrics || [];

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const workshops = workshopsData;
  const verifiedCount = workshops.filter(w => w.verified).length;
  const oemCount = workshops.filter(w => w.oem).length;
  const pendingCount = workshops.filter(w => !w.verified).length;

  const filtered = useMemo(() => {
    return workshops.filter(w => {
      if (filter === "verified" && !w.verified) return false;
      if (filter === "oem" && !w.oem) return false;
      if (filter === "pending" && w.verified) return false;
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [workshops, filter, searchQuery]);

  const pendingWorkshops = workshops.filter(w => !w.verified);

  const handleApproveKYC = (name: string) => {
    showToast("success", "KYC Approved", `${name} has been verified. On-chain credential issued.`);
    // Notify workshop + enterprise
    booking?.addNotification("kyc_change", "KYC Approved", `Your workshop "${name}" has been verified by platform admin.`, "workshop");
    booking?.addNotification("kyc_change", "Workshop KYC Approved", `Workshop "${name}" has been verified and credentialed.`, "enterprise");
  };

  const handleRejectKYC = (name: string) => {
    showToast("error", "KYC Rejected", `${name} application has been rejected.`);
    // Notify workshop
    booking?.addNotification("kyc_change", "KYC Rejected", `Your workshop "${name}" KYC application has been rejected.`, "workshop");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
          <Wrench className="w-7 h-7" style={{ color: "#F97316" }} />
          Workshop Management
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Master directory — all workshops across enterprises with KYC workflow.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Workshops", value: workshops.length, color: "#F97316", icon: Wrench },
          { label: "Verified", value: verifiedCount, color: "#22C55E", icon: CheckCircle2 },
          { label: "OEM Certified", value: oemCount, color: "var(--solana-cyan)", icon: Shield },
          { label: "Pending KYC", value: pendingCount, color: "#FACC15", icon: ShieldAlert },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* KYC Pending Queue */}
      {pendingWorkshops.length > 0 && (
        <div className="glass-card p-6 rounded-2xl mb-8 border" style={{ borderColor: "rgba(250,204,21,0.3)" }}>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-400" /> Pending KYC Approval ({pendingWorkshops.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pendingWorkshops.map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(250,204,21,0.1)" }}>
                    <Wrench className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{w.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.location}, {w.city}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveKYC(w.name)} className="px-4 py-2 rounded-lg text-xs font-bold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">Approve</button>
                  <button onClick={() => handleRejectKYC(w.name)} className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
          {[{ id: "all", label: "All" }, { id: "verified", label: "Verified" }, { id: "oem", label: "OEM" }, { id: "pending", label: "Pending" }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-4 py-2 rounded-lg text-xs font-medium transition-all" style={{ background: filter === f.id ? "rgba(249,115,22,0.2)" : "transparent", color: filter === f.id ? "#F97316" : "var(--solana-text-muted)" }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search workshop..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">Name</th>
              <th className="py-4 px-6 font-medium">Location</th>
              <th className="py-4 px-6 font-medium">Rating</th>
              <th className="py-4 px-6 font-medium">Services</th>
              <th className="py-4 px-6 font-medium">Verified</th>
              <th className="py-4 px-6 font-medium">OEM</th>
              <th className="py-4 px-6 font-medium">KYC Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.map((w) => {
                const metric = wsMetrics.find(m => m.workshopId === w.id);
                return (
                  <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-semibold">{w.name}</td>
                    <td className="py-4 px-6 text-gray-400">{w.city}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="#FACC15" />
                        <span className="font-bold text-yellow-400">{metric?.avgRating ? metric.avgRating.toFixed(1) : w.rating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 mono">{metric?.totalServices || w.totalServices}</td>
                    <td className="py-4 px-6">
                      {w.verified ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-yellow-400" />}
                    </td>
                    <td className="py-4 px-6">
                      {w.oem ? <Shield className="w-4 h-4 text-purple-400" /> : <span className="text-gray-500 text-xs">—</span>}
                    </td>
                    <td className="py-4 px-6">
                      {w.verified ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-400 flex items-center gap-1 w-fit"><BadgeCheck className="w-3 h-3" /> Approved</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500"><Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No workshops match the filter.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
