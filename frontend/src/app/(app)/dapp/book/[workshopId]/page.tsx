"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft, Star, MapPin, Phone, Clock, CheckCircle2,
  ShieldCheck, Calendar, MessageSquare, Share2, Lock, ChevronDown, ChevronUp,
  Activity, FileText, Brain, Heart,
} from "lucide-react";
import Link from "next/link";
import { workshopsData, useBooking, type BookingForm } from "@/context/BookingContext";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { useAdminStore } from "@/store/useAdminStore";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import { getVehicleDisplayName } from "@/types/vehicle";

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

function RatingRing({ score }: { score: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 5) * circumference;
  const color = score >= 4.5 ? "#86EFAC" : score >= 4.0 ? "#5EEAD4" : score >= 3.0 ? "#FCD34D" : "#5EEAD4";
  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(94, 234, 212,0.1)" strokeWidth="8" />
        <motion.circle
          cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>Rating</p>
      </div>
    </div>
  );
}

export default function WorkshopProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.workshopId as string;
  const ws = workshopsData.find((w) => w.id === workshopId);
  const bookingCtx = useBooking();
  const vehicleCtx = useActiveVehicle();
  const hydrateAdmin = useAdminStore((state) => state.hydrate);
  const allCredentials = useAdminStore((state) => state.credentials);
  const credentials = allCredentials.filter(item => item.workshopId === workshopId && !item.revokedAt);

  useEffect(() => {
    hydrateAdmin();
  }, [hydrateAdmin]);

  const activeVehicleKey = vehicleCtx?.activeVehicle || "bmw_m4";
  const activeVehicleId = vehicleCtx?.activeVehicleId ?? activeVehicleKey;
  const currentVehicle = vehicleCtx?.currentVehicleData || vehicleData.bmw_m4;
  const currentUser = useUserStore((state) => state.currentUser);
  const registryVehicles = useVehicleRegistryStore((state) => state.vehicles);
  const ownedVehicleIds = currentUser?.ownedVehicleIds;
  const userId = currentUser?.userId;
  const visibleVehicles = useMemo(() => {
    return registryVehicles
      .filter((vehicle) => {
        if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.vin) return false;
        if (userId) return vehicle.currentOwnerId === userId || ownedVehicleIds?.includes(vehicle.vehicleId);
        if (vehicle.mintStatus === "transferred" || vehicle.mintStatus === "escrow") return false;
        return vehicle.isDemo;
      })
      .filter((vehicle, index, list) => list.findIndex((item) => item.vin === vehicle.vin) === index);
  }, [ownedVehicleIds, registryVehicles, userId]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [complaint, setComplaint] = useState("");
  const [shareHistory, setShareHistory] = useState(false);
  const [shareDigitalTwin, setShareDigitalTwin] = useState(false);
  const [showShareDetails, setShowShareDetails] = useState(false);
  const [vehicleKey, setVehicleKey] = useState<string>(activeVehicleId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setVehicleKey((prev) => (prev === activeVehicleId ? prev : activeVehicleId));
  }, [activeVehicleId]);

  if (!ws) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p style={{ color: "var(--solana-text-muted)" }}>Bengkel tidak ditemukan</p>
        <Link href="/dapp/book" className="glow-btn-outline px-4 py-2 text-sm mt-4">Kembali</Link>
      </div>
    );
  }

  const maxServiceCount = Math.max(...Object.values(ws.serviceBreakdown));

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !complaint.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const form: BookingForm = {
        date: selectedDate,
        time: selectedTime,
        complaint,
        shareHistory,
        shareDigitalTwin,
        vehicleKey,
      };
      bookingCtx?.submitBooking(ws, form);
      router.push("/dapp/book/status");
    }, 1500);
  };

  const selectedVehicleIdentity = visibleVehicles.find((vehicle) => vehicle.vehicleId === vehicleKey);
  const selectedVehicle = selectedVehicleIdentity
    ? {
        name: getVehicleDisplayName(selectedVehicleIdentity),
        vin: selectedVehicleIdentity.vin,
        health: selectedVehicleIdentity.healthScore,
        mileage: selectedVehicleIdentity.currentMileageKm.toLocaleString("id-ID"),
      }
    : vehicleData[vehicleKey] ?? currentVehicle;
  const canSubmit = selectedDate && selectedTime && complaint.trim().length > 0 && !submitting;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dapp/book" className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: "var(--solana-text-muted)" }}>
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{ws.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5" style={{ color: "var(--solana-text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{ws.address}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Workshop Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile header card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <RatingRing score={ws.rating} />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  {ws.badges.map((badge) => (
                    <span key={badge} className="text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{
                        background: badge === "Pending KYC" ? "rgba(250,204,21,0.1)" : "rgba(94, 234, 212,0.1)",
                        color: badge === "Pending KYC" ? "#FCD34D" : "var(--solana-green)",
                        border: `1px solid ${badge === "Pending KYC" ? "rgba(250,204,21,0.2)" : "rgba(94, 234, 212,0.2)"}`,
                      }}
                    >
                      {badge.includes("Verified") && <CheckCircle2 className="w-3 h-3" />}
                      {badge.includes("OEM") && <ShieldCheck className="w-3 h-3" />}
                      {badge}
                    </span>
                  ))}
                  {credentials.some((credential) => credential.credential === "oem_certified") && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 bg-teal-400/10 text-teal-300 border border-teal-400/20">
                      <ShieldCheck className="w-3 h-3" /> Official Manufacturer Partner
                    </span>
                  )}
                  {credentials.some((credential) => credential.credential === "manufacturer_audit_partner") && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      <CheckCircle2 className="w-3 h-3" /> Trusted Vehicle Auditor
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{ws.totalServices.toLocaleString()}</p>
                    <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>Total Servis</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{ws.totalReviews}</p>
                    <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>Review</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{ws.specialization.split(",").length}</p>
                    <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>Spesialisasi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3.5 h-3.5" style={{ color: "var(--solana-purple)" }} />
                <span style={{ color: "var(--solana-text-muted)" }}>{ws.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5" style={{ color: "var(--solana-purple)" }} />
                <span style={{ color: "var(--solana-text-muted)" }}>Weekday: {ws.operatingHours.weekday}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5" style={{ color: "var(--solana-green)" }} />
                <span style={{ color: "var(--solana-text-muted)" }}>Weekend: {ws.operatingHours.weekend}</span>
              </div>
            </div>
          </motion.div>

          {/* Service Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h2 className="font-semibold mb-4 text-sm">Riwayat Servis Bengkel</h2>
            <div className="space-y-3">
              {Object.entries(ws.serviceBreakdown).map(([service, count]) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-xs w-32 shrink-0" style={{ color: "var(--solana-text-muted)" }}>{service}</span>
                  <div className="flex-1 h-2 rounded-full relative" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ background: "var(--solana-gradient)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxServiceCount) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs mono w-10 text-right" style={{ color: "var(--solana-text-muted)" }}>{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Reviews */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h2 className="font-semibold mb-4 text-sm">Review Pelanggan ({ws.totalReviews})</h2>
            <div className="space-y-4">
              {ws.reviews.map((review, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.08)" }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium">{review.name}</p>
                      {review.vehicleType && (
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--solana-text-muted)" }}>{review.vehicleType}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="w-3 h-3" style={{ color: j < review.rating ? "#FCD34D" : "rgba(94, 234, 212,0.15)", fill: j < review.rating ? "#FCD34D" : "none" }} />
                        ))}
                      </div>
                      {review.onChainVerified && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> On-Chain
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>{review.comment}</p>
                  <p className="text-[10px] mt-2 mono" style={{ color: "rgba(94, 234, 212,0.4)" }}>{review.date}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 sticky top-6">
            <h2 className="font-semibold mb-6 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
              Buat Janji Servis
            </h2>

            {/* Vehicle selector */}
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: "var(--solana-text-muted)" }}>Kendaraan</label>
              <select
                value={vehicleKey}
                onChange={(e) => setVehicleKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 text-sm outline-none cursor-pointer"
                style={{ border: "1px solid rgba(94, 234, 212,0.15)", color: "var(--solana-text)" }}
              >
                {visibleVehicles.map((vehicle) => (
                  <option key={vehicle.vehicleId} value={vehicle.vehicleId} style={{ background: "var(--solana-dark-2)" }}>
                    {getVehicleDisplayName(vehicle)}
                  </option>
                ))}
              </select>
              <p className="text-[10px] mt-1 mono" style={{ color: "var(--solana-text-muted)" }}>VIN: {selectedVehicle.vin}</p>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: "var(--solana-text-muted)" }}>Tanggal</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 text-sm outline-none"
                style={{ border: "1px solid rgba(94, 234, 212,0.15)", color: "var(--solana-text)", colorScheme: "dark" }}
              />
            </div>

            {/* Time slots */}
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: "var(--solana-text-muted)" }}>Waktu</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className="px-2 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      background: selectedTime === t ? "rgba(94, 234, 212,0.15)" : "rgba(255,255,255,0.03)",
                      color: selectedTime === t ? "var(--solana-purple)" : "var(--solana-text-muted)",
                      border: `1px solid ${selectedTime === t ? "rgba(94, 234, 212,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Complaint */}
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: "var(--solana-text-muted)" }}>Keluhan</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Deskripsikan keluhan kendaraan Anda..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 text-sm outline-none resize-none"
                style={{ border: "1px solid rgba(94, 234, 212,0.15)", color: "var(--solana-text)" }}
              />
            </div>

            {/* Share data toggles */}
            <div className="mb-6 space-y-3">
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--solana-text-muted)" }}>
                <Share2 className="w-3.5 h-3.5" />
                Bagikan Data untuk Pre-Analisis
              </p>

              {/* Share History */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${shareHistory ? "rgba(94, 234, 212,0.2)" : "rgba(94, 234, 212,0.1)"}` }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: shareHistory ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
                    <p className="font-medium">Riwayat Kendaraan</p>
                    <p className="text-[10px] mt-0.5">Servis history, AI predictions, health score</p>
                  </div>
                  <button
                    onClick={() => setShareHistory(!shareHistory)}
                    className="w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0"
                    style={{ background: shareHistory ? "var(--solana-green)" : "rgba(94, 234, 212,0.2)" }}
                  >
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: shareHistory ? "22px" : "2px" }} />
                  </button>
                </div>
              </div>

              {/* Share 3D Twin */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${shareDigitalTwin ? "rgba(94, 234, 212,0.2)" : "rgba(94, 234, 212,0.1)"}` }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: shareDigitalTwin ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
                    <p className="font-medium">3D Digital Twin</p>
                    <p className="text-[10px] mt-0.5">Akses model 3D untuk diagnostik mekanik</p>
                  </div>
                  <button
                    onClick={() => setShareDigitalTwin(!shareDigitalTwin)}
                    className="w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0"
                    style={{ background: shareDigitalTwin ? "var(--solana-green)" : "rgba(94, 234, 212,0.2)" }}
                  >
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: shareDigitalTwin ? "22px" : "2px" }} />
                  </button>
                </div>
              </div>

              {(shareHistory || shareDigitalTwin) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl p-3 text-xs space-y-1.5 overflow-hidden"
                  style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.15)" }}
                >
                  <p className="font-medium flex items-center gap-1.5" style={{ color: "var(--solana-green)" }}>
                    <Lock className="w-3 h-3" /> Data yang akan dibagikan:
                  </p>
                  <div className="space-y-1" style={{ color: "var(--solana-text-muted)" }}>
                    {shareHistory && (
                      <>
                        <div className="flex items-center gap-2"><FileText className="w-3 h-3" style={{ color: "var(--solana-purple)" }} /><span>Riwayat Servis ({selectedVehicle.name})</span></div>
                        <div className="flex items-center gap-2"><Brain className="w-3 h-3" style={{ color: "var(--solana-cyan)" }} /><span>Prediksi AI & Health Score: {selectedVehicle.health}%</span></div>
                        <div className="flex items-center gap-2"><Activity className="w-3 h-3" style={{ color: "var(--solana-green)" }} /><span>Mileage: {selectedVehicle.mileage} km</span></div>
                      </>
                    )}
                    {shareDigitalTwin && (
                      <div className="flex items-center gap-2"><Heart className="w-3 h-3" style={{ color: "var(--solana-pink)" }} /><span>3D Digital Twin Model</span></div>
                    )}
                  </div>
                  <p className="text-[10px] pt-1" style={{ color: "rgba(94, 234, 212,0.6)" }}>
                    Data hanya dapat diakses bengkel setelah booking dikonfirmasi dan dicabut otomatis setelah servis selesai.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="glow-btn w-full py-3 text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Mengirim...
                </>
              ) : (
                "Kirim Permintaan Booking"
              )}
            </button>

            {!selectedDate && !selectedTime && !complaint && (
              <p className="text-[10px] text-center mt-3" style={{ color: "var(--solana-text-muted)" }}>
                Pilih tanggal, waktu, dan masukkan keluhan untuk melanjutkan
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
