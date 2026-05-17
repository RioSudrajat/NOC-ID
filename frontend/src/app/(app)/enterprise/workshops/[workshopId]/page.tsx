"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Star, Shield, MapPin, Phone, CheckCircle2, BadgeCheck, ArrowLeft,
  BarChart3, DollarSign, Package, TrendingUp, UserCheck, AlertTriangle,
  FileCheck, Car, ClipboardList, Ban, ShieldOff, TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { workshopsData } from "@/context/BookingContext";
import { useEnterprise } from "@/context/EnterpriseContext";
import { useToast } from "@/components/ui/Toast";

type TabId = "overview" | "performance" | "kyc" | "assignments";

const MOCK_ALL_WORKSHOPS_AVG = { oemRate: 78, avgRating: 4.3, disputeRate: 2, responseTime: 24 };

const MOCK_KYC_DOCS = [
  { name: "STNK / Izin Usaha", status: "verified", date: "2025-01-10" },
  { name: "SIUP (Surat Izin Usaha Perdagangan)", status: "verified", date: "2025-01-10" },
  { name: "Sertifikat Mekanik Bersertified", status: "verified", date: "2025-02-05" },
  { name: "OEM Authorization Letter", status: "pending", date: null },
];

const MOCK_ASSIGNMENTS = [
  { vin: "MHKA1BA1JFK000001", model: "Toyota BMW M4 2025", type: "Warranty Claim", assignedDate: "2026-03-15", status: "pending" },
  { vin: "JT2BF28K6420S0001", model: "Toyota Supra Veilside", type: "Recall Service", assignedDate: "2026-03-20", status: "in_progress" },
];

export default function WorkshopDetailPage({ params }: { params: Promise<{ workshopId: string }> }) {
  const { workshopId } = use(params);
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [kycStatus, setKycStatus] = useState<"approved" | "pending" | "suspended">("approved");

  const workshop = workshopsData.find(w => w.id === workshopId);
  const wsMetric = m?.workshopMetrics.find(wm => wm.workshopId === workshopId);
  const wsBookings = (m?.completedBookings || []).filter(cb => cb.workshopId === workshopId);

  if (!workshop) {
    return (
      <div className="text-center py-20">
        <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-bold mb-2">Workshop Not Found</h2>
        <Link href="/enterprise/workshops" className="text-sm text-teal-400 hover:underline">Back to Workshops</Link>
      </div>
    );
  }

  const oemRate = wsMetric && (wsMetric.oemPartsUsed + wsMetric.aftermarketPartsUsed) > 0
    ? Math.round((wsMetric.oemPartsUsed / (wsMetric.oemPartsUsed + wsMetric.aftermarketPartsUsed)) * 100)
    : 100;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "overview",     label: "Overview",      icon: BarChart3 },
    { id: "performance",  label: "Performance",   icon: TrendingUp },
    { id: "kyc",          label: "KYC & Approval", icon: UserCheck },
    { id: "assignments",  label: "Assignments",   icon: ClipboardList },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/enterprise/workshops" className="inline-flex items-center gap-2 text-sm mb-6 hover:text-teal-400 transition-colors" style={{ color: "var(--solana-text-muted)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Workshops
      </Link>

      {/* Header */}
      <div className="glass-card p-8 rounded-2xl mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{workshop.name}</h1>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: kycStatus === "approved" ? "rgba(34,197,94,0.12)" : kycStatus === "suspended" ? "rgba(239,68,68,0.12)" : "rgba(250,204,21,0.12)",
                  color: kycStatus === "approved" ? "#86EFAC" : kycStatus === "suspended" ? "#FCA5A5" : "#FCD34D",
                }}
              >
                {kycStatus === "approved" ? "✓ Approved" : kycStatus === "suspended" ? "⊘ Suspended" : "⏳ Pending"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm mb-3" style={{ color: "var(--solana-text-muted)" }}>
              <MapPin className="w-4 h-4" /> {workshop.address}, {workshop.city}
            </div>
            <div className="flex flex-wrap gap-2">
              {workshop.verified && <span className="badge badge-green flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> Verified Signer</span>}
              {workshop.oem && <span className="badge badge-purple flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> OEM Certified</span>}
              <span className="badge" style={{ background: "rgba(20,20,40,0.5)", color: "var(--solana-text-muted)", border: "1px solid rgba(94, 234, 212,0.1)" }}>{workshop.specialization}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Star className="w-5 h-5 text-yellow-400" fill="#FCD34D" />
                <span className="text-2xl font-bold text-yellow-400">{wsMetric?.avgRating ? wsMetric.avgRating.toFixed(1) : workshop.rating}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{workshop.totalReviews} reviews</p>
            </div>
            <a href={`tel:${workshop.phone}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)" }}>
              <Phone className="w-4 h-4" /> {workshop.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: BarChart3, label: "Total Services", value: wsMetric?.totalServices || workshop.totalServices, color: "var(--solana-purple)" },
          { icon: DollarSign, label: "Total Revenue", value: `Rp ${(wsMetric?.totalRevenue || 0).toLocaleString('id-ID')}`, color: "var(--solana-green)" },
          { icon: Package, label: "OEM Parts Used", value: wsMetric?.oemPartsUsed || 0, color: "var(--solana-cyan)" },
          { icon: Star, label: "Avg Rating", value: wsMetric?.avgRating ? wsMetric.avgRating.toFixed(1) : workshop.rating.toString(), color: "#FCD34D" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "rgba(94, 234, 212,0.15)" }}>
        {tabs.map(tab => {
          const Icon = tab.icon as React.ComponentType<{ className?: string }>;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-colors border-b-2"
              style={{
                borderColor: activeTab === tab.id ? "var(--solana-purple)" : "transparent",
                color: activeTab === tab.id ? "var(--solana-purple)" : "var(--solana-text-muted)",
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB: Overview */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-base font-semibold mb-4">Service Breakdown</h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(workshop.serviceBreakdown).map(([type, count], i) => {
                    const maxCount = Math.max(...Object.values(workshop.serviceBreakdown));
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={type} className="flex items-center gap-4">
                        <span className="text-sm w-36 truncate">{type}</span>
                        <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-3 rounded-full" style={{ background: "linear-gradient(90deg, var(--solana-purple), var(--solana-green))" }} />
                        </div>
                        <span className="text-sm mono w-12 text-right" style={{ color: "var(--solana-text-muted)" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-base font-semibold mb-4">Recent Reviews</h3>
                <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
                  {workshop.reviews.map((review, i) => (
                    <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{review.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" fill="#FCD34D" />
                          <span className="text-xs font-bold text-yellow-400">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{review.comment}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-500">{review.date}</span>
                        {review.onChainVerified && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                        {review.vehicleType && <span className="text-[10px] text-teal-400">{review.vehicleType}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card-static rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-base font-semibold">Service History (On-Chain)</h3>
              </div>
              {wsBookings.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 border-b border-white/5">
                    <tr className="text-xs uppercase tracking-wider text-gray-400">
                      <th className="py-3 px-6">Service ID</th>
                      <th className="py-3 px-6">Type</th>
                      <th className="py-3 px-6">Date</th>
                      <th className="py-3 px-6">Amount</th>
                      <th className="py-3 px-6">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {wsBookings.map(cb => (
                      <tr key={cb.id} className="hover:bg-white/5">
                        <td className="py-3 px-6 mono text-xs text-teal-400">{cb.id}</td>
                        <td className="py-3 px-6">{cb.serviceType}</td>
                        <td className="py-3 px-6 text-gray-400">{cb.date}</td>
                        <td className="py-3 px-6 font-bold mono">Rp {cb.totalIDR.toLocaleString("id-ID")}</td>
                        <td className="py-3 px-6">
                          {cb.review
                            ? <div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" fill="#FCD34D" /><span className="text-sm font-bold text-yellow-400">{cb.review.rating}</span></div>
                            : <span className="text-gray-500 text-xs">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada service history on-chain.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: Performance */}
        {activeTab === "performance" && (
          <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OEM Rate vs Network */}
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: "var(--solana-cyan)" }} />
                  OEM Parts Rate
                </h3>
                {[
                  { label: "Bengkel Ini", value: oemRate, color: oemRate >= MOCK_ALL_WORKSHOPS_AVG.oemRate ? "#86EFAC" : "#5EEAD4" },
                  { label: "Rata-rata Network", value: MOCK_ALL_WORKSHOPS_AVG.oemRate, color: "var(--solana-text-muted)" },
                ].map(row => (
                  <div key={row.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--solana-text-muted)" }}>{row.label}</span>
                      <span className="font-bold" style={{ color: row.color }}>{row.value}%</span>
                    </div>
                    <div className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${row.value}%` }} transition={{ duration: 0.8 }} className="h-3 rounded-full" style={{ background: row.color }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs mt-3" style={{ color: "var(--solana-text-muted)" }}>
                  {oemRate >= MOCK_ALL_WORKSHOPS_AVG.oemRate
                    ? <span className="text-teal-400">✓ Di atas rata-rata network</span>
                    : <span className="text-teal-400">⚠ Di bawah rata-rata network</span>}
                </p>
              </div>

              {/* Rating vs Network */}
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Rating vs Network
                </h3>
                {[
                  { label: "Bengkel Ini", value: wsMetric?.avgRating || workshop.rating, max: 5, color: "#FCD34D" },
                  { label: "Rata-rata Network", value: MOCK_ALL_WORKSHOPS_AVG.avgRating, max: 5, color: "var(--solana-text-muted)" },
                ].map(row => (
                  <div key={row.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--solana-text-muted)" }}>{row.label}</span>
                      <span className="font-bold" style={{ color: row.color }}>{Number(row.value).toFixed(1)} / 5</span>
                    </div>
                    <div className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(Number(row.value) / 5) * 100}%` }} transition={{ duration: 0.8 }} className="h-3 rounded-full" style={{ background: row.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dispute Rate */}
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-teal-400" />
                  Dispute Rate
                </h3>
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-teal-400">0%</p>
                  <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>0 dari {wsMetric?.totalServices || 0} services</p>
                  <p className="text-xs mt-3 text-teal-400">✓ No disputes filed</p>
                  <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>Network avg: {MOCK_ALL_WORKSHOPS_AVG.disputeRate}%</p>
                </div>
              </div>

              {/* Response Time */}
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
                  Response & Network Rank
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--solana-text-muted)" }}>Avg Accept Time</span>
                    <span className="font-bold text-teal-400">~4 jam</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--solana-text-muted)" }}>Network Avg</span>
                    <span>{MOCK_ALL_WORKSHOPS_AVG.responseTime} jam</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "var(--solana-text-muted)" }}>Percentile Rank</span>
                    <span className="font-bold" style={{ color: "var(--solana-purple)" }}>Top 15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--solana-text-muted)" }}>Revenue Sharing</span>
                    <span className="font-bold">5% platform fee</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: KYC & Approval */}
        {activeTab === "kyc" && (
          <motion.div key="kyc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status & Actions */}
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
                  Status KYC & Kontrol
                </h3>
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-sm">Status KYC</span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{
                        background: kycStatus === "approved" ? "rgba(34,197,94,0.12)" : kycStatus === "suspended" ? "rgba(239,68,68,0.12)" : "rgba(250,204,21,0.12)",
                        color: kycStatus === "approved" ? "#86EFAC" : kycStatus === "suspended" ? "#FCA5A5" : "#FCD34D",
                      }}
                    >
                      {kycStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-sm">OEM Certification</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${workshop.oem ? "text-teal-300" : "text-gray-500"}`} style={{ background: workshop.oem ? "rgba(94, 234, 212,0.12)" : "rgba(255,255,255,0.05)" }}>
                      {workshop.oem ? "CERTIFIED" : "NOT CERTIFIED"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-sm">Verified Signer</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${workshop.verified ? "text-teal-400" : "text-gray-500"}`} style={{ background: workshop.verified ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)" }}>
                      {workshop.verified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {kycStatus !== "approved" && (
                    <button
                      onClick={() => { setKycStatus("approved"); showToast("success", "Workshop Approved", `${workshop.name} kini berstatus Approved.`); }}
                      className="flex items-center gap-2 w-full p-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#86EFAC", border: "1px solid rgba(34,197,94,0.2)" }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Workshop
                    </button>
                  )}
                  {workshop.oem && (
                    <button
                      onClick={() => showToast("success", "OEM Cert Revoked", "OEM certification telah dicabut.")}
                      className="flex items-center gap-2 w-full p-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.2)" }}
                    >
                      <ShieldOff className="w-4 h-4" /> Revoke OEM Certification
                    </button>
                  )}
                  {kycStatus !== "suspended" && (
                    <button
                      onClick={() => { setKycStatus("suspended"); showToast("success", "Workshop Suspended", `${workshop.name} telah di-suspend.`); }}
                      className="flex items-center gap-2 w-full p-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.15)" }}
                    >
                      <Ban className="w-4 h-4" /> Suspend Workshop
                    </button>
                  )}
                </div>
              </div>

              {/* KYC Documents */}
              <div className="glass-card-static p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" style={{ color: "var(--solana-cyan)" }} />
                  Dokumen KYC
                </h3>
                <div className="flex flex-col gap-3">
                  {MOCK_KYC_DOCS.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: doc.status === "verified" ? "rgba(34,197,94,0.1)" : "rgba(250,204,21,0.1)" }}
                        >
                          {doc.status === "verified"
                            ? <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                            {doc.status === "verified" ? `Verified ${doc.date}` : "Menunggu upload"}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: doc.status === "verified" ? "rgba(34,197,94,0.12)" : "rgba(250,204,21,0.12)",
                          color: doc.status === "verified" ? "#86EFAC" : "#FCD34D",
                        }}
                      >
                        {doc.status === "verified" ? "VERIFIED" : "PENDING"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: Assignments */}
        {activeTab === "assignments" && (
          <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>
                Kendaraan yang di-assign ke bengkel ini untuk pengerjaan recall atau warranty khusus.
              </p>
              <button
                onClick={() => showToast("success", "Assignment Created", "Kendaraan berhasil di-assign ke bengkel ini.")}
                className="glow-btn text-xs px-4 py-2 gap-1.5"
              >
                <Car className="w-3.5 h-3.5" /> Assign Kendaraan
              </button>
            </div>

            <div className="glass-card-static rounded-2xl border border-white/5 overflow-hidden">
              {MOCK_ASSIGNMENTS.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 border-b border-white/5">
                    <tr className="text-xs uppercase tracking-wider text-gray-400">
                      <th className="py-3 px-6">VIN</th>
                      <th className="py-3 px-6">Model</th>
                      <th className="py-3 px-6">Jenis Pekerjaan</th>
                      <th className="py-3 px-6">Tanggal Assign</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {MOCK_ASSIGNMENTS.map((a, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="py-3 px-6 mono text-xs text-teal-400">{a.vin}</td>
                        <td className="py-3 px-6 text-sm font-medium">{a.model}</td>
                        <td className="py-3 px-6">
                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(94, 234, 212,0.12)", color: "var(--solana-purple)" }}>
                            {a.type}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-gray-400">{a.assignedDate}</td>
                        <td className="py-3 px-6">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: a.status === "in_progress" ? "rgba(94, 234, 212,0.1)" : "rgba(250,204,21,0.1)",
                              color: a.status === "in_progress" ? "var(--solana-cyan, #2DD4BF)" : "#FCD34D",
                            }}
                          >
                            {a.status === "in_progress" ? "In Progress" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Belum ada kendaraan yang di-assign ke bengkel ini.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
