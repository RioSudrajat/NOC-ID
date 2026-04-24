"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Shield, ThumbsUp, TrendingUp, Award, MessageSquare } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { vehicleData } from "@/context/ActiveVehicleContext";

interface ReviewItem {
  customer: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  vehicleType?: string;
  serviceType?: string;
  isFromBooking?: boolean;
}

const staticReviews: ReviewItem[] = [
  { customer: "Budi S.", rating: 5, date: "2026-03-14", text: "Pelayanan sangat baik, oli diganti dengan cepat dan rapi. Harga transparan.", verified: true },
  { customer: "Andi W.", rating: 5, date: "2026-03-10", text: "Inspeksi lengkap dan detail. Mekanik menjelaskan semua temuan dengan jelas.", verified: true },
  { customer: "Sari M.", rating: 4, date: "2026-03-05", text: "Servis CVT bagus, tapi antrian agak lama di jam siang.", verified: true },
  { customer: "Rendi K.", rating: 5, date: "2026-02-28", text: "Brake pad replacement cepat dan OEM. Dapat reward $NOC juga!", verified: true },
  { customer: "Diana P.", rating: 4, date: "2026-02-20", text: "Hasil inspeksi akurat. Akan kembali lagi untuk servis berikutnya.", verified: false },
];

const badges = [
  { label: "Verified Workshop", icon: Shield, color: "var(--solana-green)" },
  { label: "OEM Certified", icon: Award, color: "var(--solana-purple)" },
  { label: "Top Rated Q1 2026", icon: Star, color: "#FCD34D" },
];

export default function ReputationPage() {
  const bookingCtx = useBooking();

  // Build new reviews from completed bookings that have reviews
  const bookingReviews = useMemo((): ReviewItem[] => {
    return (bookingCtx?.completedBookings || [])
      .filter(cb => cb.review && cb.review.rating > 0)
      .map(cb => {
        const vData = vehicleData[cb.vehicleKey];
        return {
          customer: "Pelanggan NOC",
          rating: cb.review!.rating,
          date: cb.date,
          text: cb.review!.comment || `Servis ${cb.serviceType} — tidak ada komentar.`,
          verified: cb.review!.onChainVerified,
          vehicleType: vData?.name,
          serviceType: cb.serviceType,
          isFromBooking: true,
        };
      });
  }, [bookingCtx?.completedBookings]);

  // All reviews: booking reviews first (newest), then static
  const allReviews = [...bookingReviews, ...staticReviews];

  // Compute live rating
  const totalReviews = staticReviews.length + 247 + bookingReviews.length;
  const avgRating = bookingReviews.length > 0
    ? ((bookingReviews.reduce((s, r) => s + r.rating, 0) + 4.8 * (staticReviews.length + 247)) / totalReviews).toFixed(1)
    : "4.8";

  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Star className="w-7 h-7" style={{ color: "#FCD34D" }} />
          Reputation
        </h1>
        <p>Your on-chain reputation score and customer reviews</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
        {/* Score ring */}
        <div className="glass-card p-10 flex flex-col items-center text-center" style={{ background: "linear-gradient(135deg, rgba(94, 234, 212,0.1) 0%, rgba(250,204,21,0.06) 100%)" }}>
          <div className="relative w-40 h-40 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(94, 234, 212,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#repGradient)" strokeWidth="8" strokeDasharray={`${(Number(avgRating) / 5) * 264} 264`} strokeLinecap="round" />
              <defs><linearGradient id="repGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D" /><stop offset="100%" stopColor="#86EFAC" /></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{avgRating}</span>
              <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>/ 5.0</span>
            </div>
          </div>
          <p className="font-semibold mb-1">Excellent Reputation</p>
          <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Based on {totalReviews} verified services</p>
          <div className="flex items-center gap-1 mt-3" style={{ color: "var(--solana-green)" }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">+0.2 this month</span>
          </div>
        </div>

        {/* Stats + badges */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-6 lg:gap-8">
            {[
              { label: "Total Reviews", value: String(totalReviews), icon: MessageSquare },
              { label: "Repeat Customers", value: "68%", icon: ThumbsUp },
              { label: "5-Star Rate", value: `${Math.round((allReviews.filter(r => r.rating === 5).length / allReviews.length) * 100)}%`, icon: Star },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 lg:p-8 text-center">
                <s.icon className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--solana-purple)" }} />
                <p className="text-3xl font-bold mb-1">{s.value}</p>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          <div className="glass-card-static p-8">
            <h3 className="text-base font-semibold mb-6">Verified Badges</h3>
            <div className="flex flex-wrap gap-4">
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: `${b.color}12`, border: `1px solid ${b.color}30` }}>
                  <b.icon className="w-4 h-4" style={{ color: b.color }} />
                  <span className="text-sm font-medium" style={{ color: b.color }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <h2 className="text-xl font-semibold mb-6">
        Recent Reviews
        {bookingReviews.length > 0 && (
          <span className="ml-3 text-sm px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
            +{bookingReviews.length} baru via booking
          </span>
        )}
      </h2>
      <div className="flex flex-col gap-6">
        {allReviews.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-static p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--solana-gradient)" }}>
                  {r.customer[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{r.customer}</p>
                    {"isFromBooking" in r && r.isFromBooking && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
                        via Booking
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3 h-3" style={{ color: j < r.rating ? "#FCD34D" : "rgba(148,163,184,0.3)" }} fill={j < r.rating ? "#FCD34D" : "none"} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.verified && <span className="badge badge-green text-xs">On-chain ✓</span>}
                <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{r.date}</span>
              </div>
            </div>
            {"vehicleType" in r && r.vehicleType && (
              <p className="text-[10px] mb-2 mono" style={{ color: "var(--solana-text-muted)" }}>
                🚗 {r.vehicleType} {"serviceType" in r ? `· ${r.serviceType}` : ""}
              </p>
            )}
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{r.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
