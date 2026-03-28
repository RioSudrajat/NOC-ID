"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Search, Download, Filter, MoreHorizontal, Check, X } from "lucide-react";
import { useBooking } from "@/context/BookingContext";

const warranties = [
  { vin: "MHKA1BA1JFK000001", model: "Avanza 2025", claim: "Engine warranty — CVT noise", status: "Approved", autoScore: 98, amount: "Rp 4,200,000", date: "2026-03-10" },
  { vin: "MHKA1BA1JFK000042", model: "Rush 2024", claim: "Suspension — front strut leak", status: "Pending", autoScore: 85, amount: "Rp 2,800,000", date: "2026-03-12" },
  { vin: "MHKA1BA1JFK000108", model: "Innova 2025", claim: "AC compressor failure", status: "Pending", autoScore: 42, amount: "Rp 5,100,000", date: "2026-03-14" },
  { vin: "MHKA1BA1JFK000215", model: "Fortuner 2024", claim: "Paint defect — hood bubbling", status: "Rejected", autoScore: 12, amount: "Rp 1,500,000", date: "2026-02-28" },
  { vin: "MHKA1BA1JFK000330", model: "Yaris 2025", claim: "Infotainment system reboot", status: "Approved", autoScore: 95, amount: "Rp 800,000", date: "2026-02-15" },
  { vin: "MHKA1BA1JFK000411", model: "Calya 2024", claim: "Battery warranty replacement", status: "Approved", autoScore: 100, amount: "Rp 1,200,000", date: "2026-01-20" },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  Pending: { icon: <Clock className="w-3.5 h-3.5" />, color: "#FACC15", bg: "rgba(250,204,21,0.15)" },
  Rejected: { icon: <XCircle className="w-3.5 h-3.5" />, color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
};

export default function WarrantyPage() {
  const booking = useBooking();
  const [filter, setFilter] = useState("all");
  const [claimList, setClaimList] = useState(warranties);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);

  const filtered = filter === "all" ? claimList : claimList.filter(w => w.status.toLowerCase() === filter);
  
  const approved = claimList.filter(w => w.status === "Approved").length;
  const pending = claimList.filter(w => w.status === "Pending").length;
  const rejected = claimList.filter(w => w.status === "Rejected").length;

  const handleAction = (idx: number, action: "Approve" | "Reject") => {
    const updated = [...claimList];
    const itemIndex = claimList.findIndex((_, i) => i === idx);
    if(itemIndex > -1) {
      const claim = updated[itemIndex];
      const newStatus = action === "Approve" ? "Approved" : "Rejected";
      updated[itemIndex].status = newStatus;
      setClaimList(updated);
      setSelectedAction(null);

      // Push notification to user
      booking?.addNotification(
        "warranty_update",
        `Warranty Claim ${newStatus}`,
        `Your claim "${claim.claim}" for ${claim.model} (${claim.vin}) has been ${newStatus.toLowerCase()}.`,
        "user"
      );
      // Push notification to workshop
      booking?.addNotification(
        "warranty_update",
        `Warranty Claim ${newStatus}`,
        `Claim "${claim.claim}" for ${claim.model} has been ${newStatus.toLowerCase()} by enterprise.`,
        "workshop"
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="page-header mb-0">
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Shield className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Warranty Claims
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Cross-reference on-chain logs for automated warranty validation.</p>
        </div>
        <button className="glow-btn-outline text-sm flex items-center gap-2 py-2 px-4 shadow-lg shadow-purple-500/10">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Approved Claims", value: approved, color: "#22C55E", icon: CheckCircle2 },
          { label: "Pending Review", value: pending, color: "#FACC15", icon: Clock },
          { label: "Rejected Fraud", value: rejected, color: "#EF4444", icon: XCircle },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl border flex items-center gap-5" style={{ borderColor: `rgba(255,255,255,0.05)` }}>
             <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
               <s.icon className="w-7 h-7" style={{ color: s.color }} />
             </div>
             <div>
               <p className="text-3xl font-bold mb-0.5">{s.value}</p>
               <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
          {["all", "approved", "pending", "rejected"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all" 
              style={{ 
                background: filter === f ? "rgba(153,69,255,0.2)" : "transparent", 
                color: filter === f ? "#fff" : "var(--solana-text-muted)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search VIN or Claim..." className="input-field pl-9 text-sm w-full sm:w-64" />
          </div>
          <button className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Claims table */}
      <div className="glass-card-static overflow-visible rounded-2xl border border-white/5 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 border-b border-white/5">
              <tr className="text-xs uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 font-medium">VIN</th>
                <th className="py-4 px-6 font-medium">Claim Details</th>
                <th className="py-4 px-6 font-medium text-center">AI Validation Score</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filtered.map((w, i) => {
                  const sc = statusConfig[w.status];
                  // map to original index for action handling
                  const originalIndex = claimList.findIndex(c => c.vin === w.vin && c.claim === w.claim);
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      key={`${w.vin}-${i}`} 
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <span className="mono text-xs text-purple-400 block">{w.vin}</span>
                        <span className="text-xs text-gray-500 font-medium font-sans">{w.model}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium block">{w.claim}</span>
                        <span className="mono text-xs text-gray-400">{w.amount}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/5">
                          {w.autoScore >= 80 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500"/> : w.autoScore >= 50 ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500"/> : <XCircle className="w-3.5 h-3.5 text-red-500"/>}
                          <span className="font-bold mono" style={{ color: w.autoScore >= 80 ? "#22C55E" : w.autoScore >= 50 ? "#FACC15" : "#EF4444" }}>{w.autoScore}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40` }}>
                          {sc.icon} {w.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-xs font-medium">{w.date}</td>
                      <td className="py-4 px-6 text-right relative">
                        {w.status === "Pending" ? (
                          <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleAction(originalIndex, "Approve")} className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/30 transition-colors border border-green-500/20" title="Approve Claim">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAction(originalIndex, "Reject")} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/20" title="Reject Claim">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
