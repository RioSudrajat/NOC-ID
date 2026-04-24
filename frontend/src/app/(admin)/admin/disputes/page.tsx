"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Scale, AlertTriangle, Clock, CheckCircle2, XCircle, Search, MoreHorizontal } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useBooking } from "@/context/BookingContext";
import { useToast } from "@/components/ui/Toast";

const typeLabels: Record<string, string> = {
  payment: "Payment", service_quality: "Service Quality", part_authenticity: "Part Authenticity", warranty: "Warranty",
};

export default function AdminDisputesPage() {
  const admin = useAdmin();
  const booking = useBooking();
  const { showToast } = useToast();
  const disputes = admin?.disputes || [];
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return disputes.filter(d => {
      if (filter !== "all" && d.status !== filter) return false;
      if (searchQuery && !d.id.includes(searchQuery) && !d.workshopName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [disputes, filter, searchQuery]);

  const handleResolve = (id: string) => {
    const dispute = disputes.find(d => d.id === id);
    admin?.resolveDispute(id, "Resolved by admin");
    showToast("success", "Dispute Resolved", `Dispute ${id} has been resolved.`);
    // Notify user and workshop
    booking?.addNotification("dispute_resolved", "Dispute Resolved", `Your dispute ${id} has been resolved by platform admin.`, "user");
    if (dispute) {
      booking?.addNotification("dispute_resolved", "Dispute Resolved", `Dispute ${id} from ${dispute.workshopName} has been resolved.`, "workshop");
      booking?.addNotification("dispute_resolved", "Dispute Resolved", `Escalated dispute ${id} (${dispute.workshopName}) has been resolved by admin.`, "enterprise");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
          <Scale className="w-7 h-7" style={{ color: "#5EEAD4" }} />
          Escalated Disputes
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Disputes escalated beyond enterprise resolution.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Open", value: disputes.filter(d => d.status === "open").length, color: "#FCD34D", icon: AlertTriangle },
          { label: "Investigating", value: disputes.filter(d => d.status === "investigating").length, color: "var(--solana-cyan)", icon: Clock },
          { label: "Resolved", value: disputes.filter(d => d.status === "resolved").length, color: "#86EFAC", icon: CheckCircle2 },
          { label: "Escalated", value: disputes.filter(d => d.status === "escalated").length, color: "#FCA5A5", icon: XCircle },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
          {["all", "open", "investigating", "resolved", "escalated"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all" style={{ background: filter === f ? "rgba(94, 234, 212,0.2)" : "transparent", color: filter === f ? "#5EEAD4" : "var(--solana-text-muted)" }}>{f}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Type</th>
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6">Workshop</th>
              <th className="py-4 px-6">Amount</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 mono text-xs" style={{ color: "#5EEAD4" }}>{d.id}</td>
                <td className="py-4 px-6">{typeLabels[d.type] || d.type}</td>
                <td className="py-4 px-6 mono text-xs text-gray-400">{d.userWallet.slice(0, 8)}...</td>
                <td className="py-4 px-6 text-gray-300">{d.workshopName}</td>
                <td className="py-4 px-6 font-bold mono">Rp {d.amountIDR.toLocaleString("id-ID")}</td>
                <td className="py-4 px-6">
                  <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: d.status === "resolved" ? "rgba(34,197,94,0.15)" : d.status === "open" ? "rgba(250,204,21,0.15)" : d.status === "escalated" ? "rgba(239,68,68,0.15)" : "rgba(0,194,255,0.15)", color: d.status === "resolved" ? "#86EFAC" : d.status === "open" ? "#FCD34D" : d.status === "escalated" ? "#FCA5A5" : "var(--solana-cyan)" }}>{d.status}</span>
                </td>
                <td className="py-4 px-6 text-right">
                  {d.status !== "resolved" && (
                    <button onClick={() => handleResolve(d.id)} className="px-3 py-1 rounded text-xs bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors">Resolve</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500"><Scale className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No disputes match the filter.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
