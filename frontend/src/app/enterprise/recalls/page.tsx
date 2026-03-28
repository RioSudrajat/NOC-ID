"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, Search, Plus, Calendar, CheckCircle2, ShieldAlert, ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useBooking } from "@/context/BookingContext";
import { useToast } from "@/components/ui/Toast";

const initialRecallCampaigns = [
  { id: "RC-2026-001", title: "Avanza CVT Software Update", status: "Active", completion: 68, affected: 15200, date: "2026-02-15" },
  { id: "RC-2025-088", title: "Innova Airbag Sensor Bracket", status: "Active", completion: 82, affected: 8400, date: "2025-11-10" },
  { id: "RC-2025-042", title: "Fortuner Brake Booster Line", status: "Closed", completion: 97, affected: 4200, date: "2025-06-22" },
];

export default function RecallsPage() {
  const booking = useBooking();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("active");
  const [recallCampaigns, setRecallCampaigns] = useState(initialRecallCampaigns);
  const [showModal, setShowModal] = useState(false);
  const [newRecall, setNewRecall] = useState({ title: "", affected: "", severity: "High" });

  const filtered = filter === "all" ? recallCampaigns : recallCampaigns.filter(r => r.status.toLowerCase() === filter);

  const handleIssueRecall = () => {
    if (!newRecall.title) return;
    const id = `RC-${new Date().getFullYear()}-${String(recallCampaigns.length + 1).padStart(3, "0")}`;
    const affectedCount = parseInt(newRecall.affected) || 0;
    setRecallCampaigns(prev => [
      { id, title: newRecall.title, status: "Active", completion: 0, affected: affectedCount, date: new Date().toISOString().split("T")[0] },
      ...prev,
    ]);
    // Push notification to users
    booking?.addNotification(
      "recall_notice",
      "New Recall Campaign Issued",
      `Recall "${newRecall.title}" has been issued affecting ${affectedCount.toLocaleString()} vehicles. Severity: ${newRecall.severity}.`,
      "user"
    );
    // Push notification to workshops
    booking?.addNotification(
      "recall_notice",
      "New Recall Campaign",
      `Recall "${newRecall.title}" issued — ${affectedCount.toLocaleString()} vehicles affected. Please check eligible vehicles.`,
      "workshop"
    );
    showToast("success", "Recall Issued", `Campaign ${id} created and notifications sent.`);
    setNewRecall({ title: "", affected: "", severity: "High" });
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <AlertOctagon className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Recall Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Target specific VIN ranges and track recall compliance on-chain.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glow-btn text-sm flex items-center gap-2" style={{ padding: "10px 20px" }}>
          <Plus className="w-4 h-4" /> Issue New Recall
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card-static p-6 rounded-2xl">
          <p className="text-sm mb-2" style={{ color: "var(--solana-text-muted)" }}>Active Campaigns</p>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
            <span className="text-3xl font-bold">2</span>
          </div>
        </div>
        <div className="glass-card-static p-6 rounded-2xl">
          <p className="text-sm mb-2" style={{ color: "var(--solana-text-muted)" }}>Total Affected Vehicles (Active)</p>
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
            <span className="text-3xl font-bold">23,600</span>
          </div>
        </div>
        <div className="glass-card-static p-6 rounded-2xl">
          <p className="text-sm mb-2" style={{ color: "var(--solana-text-muted)" }}>Global Compliance Rate</p>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
            <span className="text-3xl font-bold text-green-500">74%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2">
          {["all", "active", "closed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all" style={{ background: filter === f ? "rgba(153,69,255,0.15)" : "transparent", color: filter === f ? "var(--solana-purple)" : "var(--solana-text-muted)", border: filter === f ? "1px solid var(--solana-purple)" : "1px solid rgba(255,255,255,0.1)" }}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
          <input type="text" placeholder="Search Campaign ID or Title" className="input-field pl-9 text-sm w-full sm:w-64" />
        </div>
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(153,69,255,0.2)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Completion</th>
              <th>Affected</th>
              <th>Issue Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((c, i) => (
              <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 transition-colors">
                <td className="mono font-medium text-sm text-purple-400">{c.id}</td>
                <td className="font-medium">{c.title}</td>
                <td>
                  <span className="badge" style={{ background: c.status === "Active" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)", color: c.status === "Active" ? "#F97316" : "#22C55E", border: `1px solid ${c.status === "Active" ? "#F97316" : "#22C55E"}40` }}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${c.completion}%`, background: c.completion > 80 ? "var(--solana-green)" : c.completion > 50 ? "#FACC15" : "var(--solana-purple)" }} />
                    </div>
                    <span className="text-sm font-semibold">{c.completion}%</span>
                  </div>
                </td>
                <td className="mono text-sm">{c.affected.toLocaleString("en-US")}</td>
                <td>
                  <span className="flex items-center gap-1 text-sm" style={{ color: "var(--solana-text-muted)" }}>
                    <Calendar className="w-3 h-3" /> {c.date}
                  </span>
                </td>
                <td>
                  <Link href={`/enterprise/recalls/${c.id}`} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-purple-400 inline-block">
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </td>
              </motion.tr>
            )) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  <AlertOctagon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No campaigns found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Issue New Recall Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 rounded-2xl w-full max-w-md border" style={{ borderColor: "rgba(153,69,255,0.3)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Issue New Recall</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: "var(--solana-text-muted)" }}>Campaign Title</label>
                <input type="text" className="input-field text-sm w-full" placeholder="e.g. Avanza CVT Software Update" value={newRecall.title} onChange={e => setNewRecall(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: "var(--solana-text-muted)" }}>Affected Vehicles (est.)</label>
                <input type="number" className="input-field text-sm w-full" placeholder="e.g. 5000" value={newRecall.affected} onChange={e => setNewRecall(p => ({ ...p, affected: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: "var(--solana-text-muted)" }}>Severity</label>
                <select className="input-field text-sm w-full bg-transparent" value={newRecall.severity} onChange={e => setNewRecall(p => ({ ...p, severity: e.target.value }))}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button onClick={handleIssueRecall} className="glow-btn text-sm w-full mt-2" style={{ padding: "12px" }}>
                <Plus className="w-4 h-4 inline mr-2" /> Issue Recall & Notify
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
