"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Search, Download, Filter, MoreHorizontal, Check, X, Box, History, Eye } from "lucide-react";
import Link from "next/link";
import { useBooking } from "@/context/BookingContext";

interface WarrantyRow {
  id: string;
  vin: string;
  model: string;
  claim: string;
  status: "Approved" | "Pending" | "Rejected";
  autoScore: number;
  amount: string;
  date: string;
  submittedByName: string;
  submittedByWorkshopId?: string;
  submittedAt?: string;
  isLive?: boolean;
}

const seedWarranties: WarrantyRow[] = [
  { id: "SEED-1", vin: "MHKA1BA1JFK000042", model: "Rush 2024", claim: "Suspension — front strut leak", status: "Pending", autoScore: 85, amount: "Rp 2,800,000", date: "2026-03-12", submittedByName: "Bengkel Hendra Motor" },
  { id: "SEED-2", vin: "MHKA1BA1JFK000215", model: "Fortuner 2024", claim: "Paint defect — hood bubbling", status: "Rejected", autoScore: 12, amount: "Rp 1,500,000", date: "2026-02-28", submittedByName: "Bengkel Jaya Abadi" },
  { id: "SEED-3", vin: "MHKA1BA1JFK000330", model: "Yaris 2025", claim: "Infotainment system reboot", status: "Approved", autoScore: 95, amount: "Rp 800,000", date: "2026-02-15", submittedByName: "EuroHaus M Performance" },
  { id: "SEED-4", vin: "MHKA1BA1JFK000411", model: "Calya 2024", claim: "Battery warranty replacement", status: "Approved", autoScore: 100, amount: "Rp 1,200,000", date: "2026-01-20", submittedByName: "Ahass Sejahtera Motor" },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#86EFAC", bg: "rgba(34,197,94,0.15)" },
  Pending: { icon: <Clock className="w-3.5 h-3.5" />, color: "#FCD34D", bg: "rgba(250,204,21,0.15)" },
  Rejected: { icon: <XCircle className="w-3.5 h-3.5" />, color: "#FCA5A5", bg: "rgba(239,68,68,0.15)" },
};

export default function WarrantyPage() {
  const booking = useBooking();
  const [filter, setFilter] = useState("all");
  const [seedList, setSeedList] = useState<WarrantyRow[]>(seedWarranties);
  const [reviewRow, setReviewRow] = useState<WarrantyRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMode, setRejectMode] = useState(false);

  // Live claims from workshop-submitted drafts
  const liveClaims: WarrantyRow[] = useMemo(() => {
    return (booking?.warrantyClaims || []).map(c => ({
      id: c.id,
      vin: c.vin,
      model: c.vehicleName,
      claim: `${c.category} — ${c.description.slice(0, 60)}${c.description.length > 60 ? "…" : ""}`,
      status: c.status,
      autoScore: c.aiPreScore,
      amount: `Rp ${c.estimatedAmountIDR.toLocaleString("id-ID")}`,
      date: c.submittedAt.split("T")[0],
      submittedByName: c.submittedByWorkshopName,
      submittedByWorkshopId: c.submittedByWorkshopId,
      submittedAt: c.submittedAt,
      isLive: true,
    }));
  }, [booking?.warrantyClaims]);

  const claimList = useMemo(() => [...liveClaims, ...seedList], [liveClaims, seedList]);
  const filtered = filter === "all" ? claimList : claimList.filter(w => w.status.toLowerCase() === filter);

  const approved = claimList.filter(w => w.status === "Approved").length;
  const pending = claimList.filter(w => w.status === "Pending").length;
  const rejected = claimList.filter(w => w.status === "Rejected").length;

  const liveRecord = (id: string) => booking?.warrantyClaims.find(c => c.id === id);

  const handleApprove = (row: WarrantyRow) => {
    const amountNum = parseInt(row.amount.replace(/[^\d]/g, ""), 10) || 0;
    if (row.isLive) {
      booking?.updateWarrantyClaimStatus(row.id, "Approved", { reimbursementIDR: amountNum });
    } else {
      setSeedList(prev => prev.map(s => s.id === row.id ? { ...s, status: "Approved" } : s));
      booking?.addNotification("warranty_update", "Warranty Claim Approved", `Claim "${row.claim}" approved. Reimbursement: ${row.amount}.`, "workshop");
    }
    setReviewRow(null);
    setRejectMode(false);
    setRejectReason("");
  };

  const handleReject = (row: WarrantyRow) => {
    if (!rejectReason.trim()) return;
    if (row.isLive) {
      booking?.updateWarrantyClaimStatus(row.id, "Rejected", { rejectionReason: rejectReason });
    } else {
      setSeedList(prev => prev.map(s => s.id === row.id ? { ...s, status: "Rejected" } : s));
      booking?.addNotification("warranty_update", "Warranty Claim Rejected", `Claim "${row.claim}" rejected. Reason: ${rejectReason}`, "workshop");
    }
    setReviewRow(null);
    setRejectMode(false);
    setRejectReason("");
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
        <button className="glow-btn-outline text-sm flex items-center gap-2 py-2 px-4 shadow-lg shadow-teal-500/10">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Approved Claims", value: approved, color: "#86EFAC", icon: CheckCircle2 },
          { label: "Pending Review", value: pending, color: "#FCD34D", icon: Clock },
          { label: "Rejected Fraud", value: rejected, color: "#FCA5A5", icon: XCircle },
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
                background: filter === f ? "rgba(94, 234, 212,0.2)" : "transparent", 
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

      {/* Review Modal */}
      <AnimatePresence>
        {reviewRow && (() => {
          const rec = reviewRow.isLive ? liveRecord(reviewRow.id) : undefined;
          const sc = statusConfig[reviewRow.status];
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setReviewRow(null)}>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-teal-400" /> Review Klaim Garansi</h2>
                    <p className="text-xs mono mt-1" style={{ color: "var(--solana-text-muted)" }}>{reviewRow.vin} · {reviewRow.model}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40` }}>
                    {sc.icon} {reviewRow.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Submitted By</p>
                    <p className="text-xs font-semibold">{reviewRow.submittedByName}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Reimbursement</p>
                    <p className="text-xs font-semibold mono text-teal-400">{reviewRow.amount}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">AI Pre-Score</p>
                    <p className="text-xs font-semibold" style={{ color: reviewRow.autoScore >= 80 ? "#86EFAC" : reviewRow.autoScore >= 50 ? "#FCD34D" : "#FCA5A5" }}>{reviewRow.autoScore}%</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Submitted At</p>
                    <p className="text-xs font-semibold">{reviewRow.date}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Klaim</p>
                  <p className="text-xs">{rec?.description || reviewRow.claim}</p>
                </div>

                {rec?.evidencePhotos && rec.evidencePhotos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Bukti Foto ({rec.evidencePhotos.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {rec.evidencePhotos.map((p, i) => (
                        <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-[10px]" style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.15)" }}>📷 {i + 1}</div>
                      ))}
                    </div>
                  </div>
                )}

                {rec?.rejectionReason && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Alasan Penolakan Sebelumnya</p>
                    <p className="text-xs text-red-300">{rec.rejectionReason}</p>
                    {rec.resubmissionCount && rec.resubmissionCount > 0 && (
                      <p className="text-[10px] mt-1 text-gray-500">Resubmission #{rec.resubmissionCount}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <Link href={`/enterprise/fleet?vin=${reviewRow.vin}`} className="flex-1 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5" style={{ background: "rgba(94, 234, 212,0.05)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                    <History className="w-3.5 h-3.5" /> Riwayat Servis
                  </Link>
                  <Link href={`/enterprise/models?vin=${reviewRow.vin}`} className="flex-1 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5" style={{ background: "rgba(94, 234, 212,0.05)", color: "var(--solana-cyan)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                    <Box className="w-3.5 h-3.5" /> Audit 3D Twin
                  </Link>
                </div>

                {reviewRow.status === "Pending" && (
                  <>
                    {!rejectMode ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(reviewRow)} className="flex-1 py-2.5 text-xs rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer" style={{ background: "rgba(34,197,94,0.15)", color: "#86EFAC", border: "1px solid rgba(34,197,94,0.3)" }}>
                          <Check className="w-4 h-4" /> Approve & Bayar Reimbursement
                        </button>
                        <button onClick={() => setRejectMode(true)} className="flex-1 py-2.5 text-xs rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}>
                          <X className="w-4 h-4" /> Tolak Klaim
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-red-400">Alasan penolakan (wajib):</p>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Jelaskan alasan penolakan klaim..." className="w-full px-3 py-2 rounded-xl bg-white/5 text-xs outline-none resize-none" style={{ border: "1px solid rgba(239,68,68,0.2)" }} />
                        <div className="flex gap-2">
                          <button onClick={() => handleReject(reviewRow)} disabled={!rejectReason.trim()} className="flex-1 py-2 text-xs rounded-xl font-semibold cursor-pointer disabled:opacity-40" style={{ background: "#FCA5A5", color: "#fff" }}>Konfirmasi Tolak</button>
                          <button onClick={() => { setRejectMode(false); setRejectReason(""); }} className="px-4 py-2 text-xs rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.05)", color: "var(--solana-text-muted)" }}>Batal</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Claims table */}
      <div className="glass-card-static overflow-visible rounded-2xl border border-white/5 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 border-b border-white/5">
              <tr className="text-xs uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 font-medium">VIN</th>
                <th className="py-4 px-6 font-medium">Claim Details</th>
                <th className="py-4 px-6 font-medium">Submitted By</th>
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
                  return (
                    <motion.tr
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      key={`${w.id}-${i}`}
                      onClick={() => { setReviewRow(w); setRejectMode(false); setRejectReason(""); }}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <span className="mono text-xs text-teal-400 block">{w.vin}</span>
                        <span className="text-xs text-gray-500 font-medium font-sans">{w.model}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium block">{w.claim}</span>
                        <span className="mono text-xs text-gray-400">{w.amount}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2" title={w.submittedByWorkshopId ? `${w.submittedByWorkshopId} · ${w.submittedAt || w.date}` : w.date}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "rgba(94, 234, 212,0.15)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.3)" }}>
                            {w.submittedByName.split(" ").map(x => x[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block">{w.submittedByName}</span>
                            {w.isLive && <span className="text-[10px] text-teal-400">• live</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/5">
                          {w.autoScore >= 80 ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500"/> : w.autoScore >= 50 ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500"/> : <XCircle className="w-3.5 h-3.5 text-red-500"/>}
                          <span className="font-bold mono" style={{ color: w.autoScore >= 80 ? "#86EFAC" : w.autoScore >= 50 ? "#FCD34D" : "#FCA5A5" }}>{w.autoScore}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40` }}>
                          {sc.icon} {w.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-xs font-medium">{w.date}</td>
                      <td className="py-4 px-6 text-right relative">
                        <button onClick={(e) => { e.stopPropagation(); setReviewRow(w); setRejectMode(false); setRejectReason(""); }} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 transition-colors" title="Review Claim">
                          <Eye className="w-4 h-4" />
                        </button>
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
