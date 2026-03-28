"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { Wrench, Star, Shield, MapPin, Phone, CheckCircle2, BadgeCheck, ArrowLeft, BarChart3, DollarSign, Package } from "lucide-react";
import Link from "next/link";
import { workshopsData } from "@/context/BookingContext";
import { useEnterprise } from "@/context/EnterpriseContext";

export default function WorkshopDetailPage({ params }: { params: Promise<{ workshopId: string }> }) {
  const { workshopId } = use(params);
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;

  const workshop = workshopsData.find(w => w.id === workshopId);
  const wsMetric = m?.workshopMetrics.find(wm => wm.workshopId === workshopId);
  const wsBookings = (m?.completedBookings || []).filter(cb => cb.workshopId === workshopId);

  if (!workshop) {
    return (
      <div className="text-center py-20">
        <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-bold mb-2">Workshop Not Found</h2>
        <Link href="/enterprise/workshops" className="text-sm text-purple-400 hover:underline">Back to Workshops</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/enterprise/workshops" className="inline-flex items-center gap-2 text-sm mb-6 hover:text-purple-400 transition-colors" style={{ color: "var(--solana-text-muted)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Workshops
      </Link>

      {/* Header */}
      <div className="glass-card p-8 rounded-2xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{workshop.name}</h1>
            <div className="flex items-center gap-2 text-sm mb-3" style={{ color: "var(--solana-text-muted)" }}>
              <MapPin className="w-4 h-4" /> {workshop.address}, {workshop.city}
            </div>
            <div className="flex flex-wrap gap-2">
              {workshop.verified && <span className="badge badge-green flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> Verified Signer</span>}
              {workshop.oem && <span className="badge badge-purple flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> OEM Certified</span>}
              <span className="badge" style={{ background: "rgba(20,20,40,0.5)", color: "var(--solana-text-muted)", border: "1px solid rgba(153,69,255,0.1)" }}>{workshop.specialization}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Star className="w-5 h-5 text-yellow-400" fill="#FACC15" />
                <span className="text-2xl font-bold text-yellow-400">{wsMetric?.avgRating ? wsMetric.avgRating.toFixed(1) : workshop.rating}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{workshop.totalReviews} reviews</p>
            </div>
            <a href={`tel:${workshop.phone}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(153,69,255,0.1)", color: "var(--solana-purple)" }}>
              <Phone className="w-4 h-4" /> {workshop.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: BarChart3, label: "Total Services", value: wsMetric?.totalServices || workshop.totalServices, color: "var(--solana-purple)" },
          { icon: DollarSign, label: "Total Revenue", value: `Rp ${((wsMetric?.totalRevenue || 0) / 1000).toFixed(0)}K`, color: "var(--solana-green)" },
          { icon: Package, label: "OEM Parts Used", value: wsMetric?.oemPartsUsed || 0, color: "var(--solana-cyan)" },
          { icon: Star, label: "Avg Rating", value: wsMetric?.avgRating ? wsMetric.avgRating.toFixed(1) : workshop.rating.toString(), color: "#FACC15" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-4">Service Breakdown</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(workshop.serviceBreakdown).map(([type, count], i) => {
              const maxCount = Math.max(...Object.values(workshop.serviceBreakdown));
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={type} className="flex items-center gap-4">
                  <span className="text-sm w-36 truncate">{type}</span>
                  <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
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
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
            {workshop.reviews.map((review, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{review.name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" fill="#FACC15" />
                    <span className="text-xs font-bold text-yellow-400">{review.rating}</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{review.comment}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-500">{review.date}</span>
                  {review.onChainVerified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {review.vehicleType && <span className="text-[10px] text-purple-400">{review.vehicleType}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service History from Completed Bookings */}
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
                  <td className="py-3 px-6 mono text-xs text-purple-400">{cb.id}</td>
                  <td className="py-3 px-6">{cb.serviceType}</td>
                  <td className="py-3 px-6 text-gray-400">{cb.date}</td>
                  <td className="py-3 px-6 font-bold mono">Rp {cb.totalIDR.toLocaleString("id-ID")}</td>
                  <td className="py-3 px-6">
                    {cb.review ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="#FACC15" />
                        <span className="text-sm font-bold text-yellow-400">{cb.review.rating}</span>
                      </div>
                    ) : <span className="text-gray-500 text-xs">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada service history on-chain untuk bengkel ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
