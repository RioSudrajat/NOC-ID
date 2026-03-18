"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Search } from "lucide-react";

const warranties = [
  { vin: "MHKA1BA1JFK000001", model: "Avanza 2025", claim: "Engine warranty — CVT noise", status: "Approved", amount: "Rp 4,200,000", date: "2026-03-10" },
  { vin: "MHKA1BA1JFK000042", model: "Rush 2024", claim: "Suspension — front strut leak", status: "Pending", amount: "Rp 2,800,000", date: "2026-03-12" },
  { vin: "MHKA1BA1JFK000108", model: "Innova 2025", claim: "AC compressor failure", status: "Pending", amount: "Rp 5,100,000", date: "2026-03-14" },
  { vin: "MHKA1BA1JFK000215", model: "Fortuner 2024", claim: "Paint defect — hood bubbling", status: "Rejected", amount: "Rp 1,500,000", date: "2026-02-28" },
  { vin: "MHKA1BA1JFK000330", model: "Yaris 2025", claim: "Infotainment system reboot", status: "Approved", amount: "Rp 800,000", date: "2026-02-15" },
  { vin: "MHKA1BA1JFK000411", model: "Calya 2024", claim: "Battery warranty replacement", status: "Approved", amount: "Rp 1,200,000", date: "2026-01-20" },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Approved: { icon: <CheckCircle2 className="w-4 h-4" />, color: "#22C55E" },
  Pending: { icon: <Clock className="w-4 h-4" />, color: "#FACC15" },
  Rejected: { icon: <XCircle className="w-4 h-4" />, color: "#EF4444" },
};

export default function WarrantyPage() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? warranties : warranties.filter(w => w.status.toLowerCase() === filter);
  
  const approved = warranties.filter(w => w.status === "Approved").length;
  const pending = warranties.filter(w => w.status === "Pending").length;
  const rejected = warranties.filter(w => w.status === "Rejected").length;

  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Shield className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Warranty Claims
        </h1>
        <p>Track and manage warranty claims across your fleet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 lg:gap-8 mb-12">
        {[
          { label: "Approved", value: approved, color: "#22C55E", icon: CheckCircle2 },
          { label: "Pending", value: pending, color: "#FACC15", icon: Clock },
          { label: "Rejected", value: rejected, color: "#EF4444", icon: XCircle },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 lg:p-8 text-center">
            <s.icon className="w-6 h-6 mx-auto mb-3" style={{ color: s.color }} />
            <p className="text-4xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "approved", "pending", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all" style={{ background: filter === f ? "rgba(153,69,255,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${filter === f ? "var(--solana-purple)" : "rgba(153,69,255,0.15)"}`, color: filter === f ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Claims table */}
      <div className="glass-card-static overflow-hidden">
        <table className="data-table">
          <thead><tr><th>VIN</th><th>Model</th><th>Claim</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.map((w, i) => {
              const sc = statusConfig[w.status];
              return (
                <tr key={i}>
                  <td><span className="mono text-xs">{w.vin.slice(0, 11)}...</span></td>
                  <td className="text-sm">{w.model}</td>
                  <td className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{w.claim}</td>
                  <td className="mono text-sm font-semibold">{w.amount}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 badge" style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}40` }}>
                      {sc.icon} {w.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--solana-text-muted)" }}>{w.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
