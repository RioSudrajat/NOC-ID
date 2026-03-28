"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, AlertTriangle, Clock, CheckCircle2, XCircle, Search, Filter, Plus, MoreHorizontal } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

const typeLabels: Record<string, string> = {
  payment: "Payment Dispute",
  service_quality: "Service Quality",
  part_authenticity: "Part Authenticity",
  warranty: "Warranty Claim",
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  open: { color: "#FACC15", bg: "rgba(250,204,21,0.15)", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  investigating: { color: "var(--solana-cyan)", bg: "rgba(0,194,255,0.15)", icon: <Clock className="w-3.5 h-3.5" /> },
  resolved: { color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  escalated: { color: "#EF4444", bg: "rgba(239,68,68,0.15)", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function EnterpriseDisputesPage() {
  const admin = useAdmin();
  const disputes = admin?.disputes || [];
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = disputes.filter(d => {
    if (filter !== "all" && d.status !== filter) return false;
    if (searchQuery && !d.id.toLowerCase().includes(searchQuery.toLowerCase()) && !d.type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openCount = disputes.filter(d => d.status === "open").length;
  const investigatingCount = disputes.filter(d => d.status === "investigating").length;
  const resolvedCount = disputes.filter(d => d.status === "resolved").length;
  const escalatedCount = disputes.filter(d => d.status === "escalated").length;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="page-header mb-0">
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Scale className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Dispute Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Manage and resolve conflicts between users and workshops.</p>
        </div>
        <button className="glow-btn text-sm flex items-center gap-2" style={{ padding: "10px 20px" }}>
          <Plus className="w-4 h-4" /> File New Dispute
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Open", value: openCount, color: "#FACC15", icon: AlertTriangle },
          { label: "Investigating", value: investigatingCount, color: "var(--solana-cyan)", icon: Clock },
          { label: "Resolved", value: resolvedCount, color: "#22C55E", icon: CheckCircle2 },
          { label: "Escalated", value: escalatedCount, color: "#EF4444", icon: XCircle },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl">
            <s.icon className="w-6 h-6 mb-3" style={{ color: s.color }} />
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
          {["all", "open", "investigating", "resolved", "escalated"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all" style={{ background: filter === f ? "rgba(153,69,255,0.2)" : "transparent", color: filter === f ? "#fff" : "var(--solana-text-muted)" }}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search dispute ID..." className="input-field pl-9 text-sm w-64" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(153,69,255,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">Dispute ID</th>
              <th className="py-4 px-6 font-medium">Type</th>
              <th className="py-4 px-6 font-medium">Filed By</th>
              <th className="py-4 px-6 font-medium">Against</th>
              <th className="py-4 px-6 font-medium">Amount</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Filed</th>
              <th className="py-4 px-6 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.length > 0 ? filtered.map((d, i) => {
                const sc = statusConfig[d.status] || statusConfig.open;
                return (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 mono text-xs text-purple-400">{d.id}</td>
                    <td className="py-4 px-6 font-medium text-sm">{typeLabels[d.type] || d.type}</td>
                    <td className="py-4 px-6 mono text-xs text-gray-400">{d.userWallet.slice(0, 8)}...</td>
                    <td className="py-4 px-6 mono text-xs text-gray-400">{d.workshopName}</td>
                    <td className="py-4 px-6 font-bold mono">Rp {d.amountIDR.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40` }}>
                        {sc.icon} {d.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-xs">{d.createdAt.split("T")[0]}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada dispute yang sesuai filter.</p>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
