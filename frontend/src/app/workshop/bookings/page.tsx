"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, Loader2, Car,
  MessageSquare, Eye, Box, Wrench, Receipt, Star, FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking, isDataAccessActive, type BookingStatus, type BookingRequest } from "@/context/BookingContext";
import { vehicleData } from "@/context/ActiveVehicleContext";

// Static past bookings for display filler
const pastBookings = [
  { id: "BK-HIST-001", vehicleName: "Honda Beat 2024", complaint: "Suara kasar saat akselerasi", date: "2026-03-10", time: "09:00", status: "COMPLETED" as BookingStatus, rating: 5 },
  { id: "BK-HIST-002", vehicleName: "Toyota Avanza 2023", complaint: "AC tidak dingin", date: "2026-03-05", time: "10:00", status: "COMPLETED" as BookingStatus, rating: 4 },
  { id: "BK-HIST-003", vehicleName: "Suzuki Ertiga 2025", complaint: "Rem berderit", date: "2026-02-28", time: "14:00", status: "REJECTED" as BookingStatus, rating: 0 },
];

const STATUS_BADGE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(250,204,21,0.1)", color: "#FCD34D", label: "Menunggu" },
  ACCEPTED: { bg: "rgba(94, 234, 212,0.1)", color: "#5EEAD4", label: "Diterima" },
  REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#FCA5A5", label: "Ditolak" },
  IN_SERVICE: { bg: "rgba(20,209,255,0.1)", color: "var(--solana-cyan)", label: "Dalam Servis" },
  INVOICE_SENT: { bg: "rgba(94, 234, 212,0.1)", color: "#5EEAD4", label: "Invoice Terkirim" },
  PAID: { bg: "rgba(94, 234, 212,0.1)", color: "#5EEAD4", label: "Dibayar" },
  COMPLETED: { bg: "rgba(94, 234, 212,0.1)", color: "#5EEAD4", label: "Selesai" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE_MAP[status] || STATUS_BADGE_MAP.PENDING;
  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22` }}>
      {s.label}
    </span>
  );
}

export default function WorkshopBookingsPage() {
  const ctx = useBooking();
  const activeBookings = ctx?.activeBookings || [];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Semua");
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);
  const [resubmitId, setResubmitId] = useState<string | null>(null);
  const [resubmitReason, setResubmitReason] = useState("");
  const [resubmitPhotos, setResubmitPhotos] = useState<string[]>([]);

  const rejectedClaims = (ctx?.warrantyClaims || []).filter(c => c.status === "Rejected");

  const tabs = ["Semua", "Menunggu", "Diterima", "Dalam Servis", "Selesai"];

  const getTabStatus = (tab: string): BookingStatus[] => {
    switch (tab) {
      case "Menunggu": return ["PENDING"];
      case "Diterima": return ["ACCEPTED"];
      case "Dalam Servis": return ["IN_SERVICE", "INVOICE_SENT", "PAID", "ANCHORING", "ANCHORED"];
      case "Selesai": return ["COMPLETED", "REJECTED"];
      default: return [];
    }
  };

  const matchesTab = (status: BookingStatus) => {
    if (activeTab === "Semua") return true;
    return getTabStatus(activeTab).includes(status);
  };

  const visibleBookings = activeBookings.filter((b) => matchesTab(b.status));

  // statusBadge hoisted to StatusBadge component above

  const handleSendInvoice = (booking: BookingRequest) => {
    const vehicle = vehicleData[booking.form.vehicleKey];
    if (!vehicle) return;
    // Redirect to maintenance page with booking context
    router.push(`/workshop/maintenance?fromBooking=true&vin=${vehicle.vin}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <CalendarCheck className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Booking Requests
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Kelola permintaan booking dari pelanggan</p>
      </div>

      {/* Rejected warranty claims — resubmission */}
      {rejectedClaims.length > 0 && (
        <div className="glass-card p-5 mb-6 border-l-4" style={{ borderLeftColor: "#FCA5A5" }}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#FCA5A5" }}>
            <XCircle className="w-4 h-4" /> Klaim Garansi Ditolak ({rejectedClaims.length})
          </h3>
          <div className="space-y-3">
            {rejectedClaims.map((c) => (
              <div key={c.id} className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-semibold">{c.vehicleName}</p>
                    <p className="text-[10px] mono text-gray-500">{c.vin}</p>
                  </div>
                  <span className="text-[10px] mono text-gray-500">Rp {c.estimatedAmountIDR.toLocaleString("id-ID")}</span>
                </div>
                {c.rejectionReason && (
                  <p className="text-[11px] mb-2 text-red-300">Alasan: {c.rejectionReason}</p>
                )}
                {resubmitId === c.id ? (
                  <div className="space-y-2">
                    <textarea value={resubmitReason} onChange={(e) => setResubmitReason(e.target.value)} rows={2} placeholder="Tambahkan reasoning detail untuk pengajuan ulang..." className="w-full px-2 py-1.5 rounded-lg bg-white/5 text-[11px] outline-none resize-none" style={{ border: "1px solid rgba(94, 234, 212,0.15)" }} />
                    <div className="flex items-center gap-2">
                      <button onClick={() => setResubmitPhotos(prev => [...prev, `evidence-${prev.length + 1}.jpg`])} className="text-[10px] px-2 py-1 rounded-lg cursor-pointer" style={{ background: "rgba(0,194,255,0.1)", color: "var(--solana-cyan)", border: "1px solid rgba(0,194,255,0.2)" }}>+ Bukti Foto ({resubmitPhotos.length})</button>
                      <button onClick={() => { ctx?.resubmitWarrantyClaim(c.id, { description: `${c.description}\n\n[Resubmit]: ${resubmitReason}`, evidencePhotos: [...c.evidencePhotos, ...resubmitPhotos] }); setResubmitId(null); setResubmitReason(""); setResubmitPhotos([]); }} disabled={!resubmitReason.trim() || resubmitPhotos.length === 0} className="text-[10px] px-3 py-1 rounded-lg cursor-pointer disabled:opacity-40" style={{ background: "var(--solana-purple)", color: "#fff" }}>Ajukan Ulang</button>
                      <button onClick={() => { setResubmitId(null); setResubmitReason(""); setResubmitPhotos([]); }} className="text-[10px] px-2 py-1 rounded-lg cursor-pointer text-gray-400">Batal</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setResubmitId(c.id); setResubmitReason(""); setResubmitPhotos([]); }} className="text-[11px] px-3 py-1 rounded-lg cursor-pointer" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
                    Ajukan Ulang dengan Bukti
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: activeTab === tab ? "rgba(94, 234, 212,0.15)" : "rgba(255,255,255,0.03)",
              color: activeTab === tab ? "var(--solana-purple)" : "var(--solana-text-muted)",
              border: `1px solid ${activeTab === tab ? "rgba(94, 234, 212,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active booking cards — one per vehicle that currently has a session */}
      {visibleBookings.map((booking) => {
        const vehicle = vehicleData[booking.form.vehicleKey];
        const dataActive = isDataAccessActive(booking);
        return (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
            style={{ borderLeft: `4px solid ${booking.status === "PENDING" ? "#FCD34D" : booking.status === "REJECTED" ? "#FCA5A5" : "#5EEAD4"}` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-sm">
                    {booking.type === "walkin" ? "Walk-In" : "Booking Baru"} · {vehicle?.name || booking.form.vehicleKey}
                  </h3>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-[10px] mono" style={{ color: "var(--solana-text-muted)" }}>{booking.id}</p>
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                {new Date(booking.createdAt).toLocaleDateString("id-ID")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5" style={{ color: "var(--solana-purple)" }} />
                <span>{booking.form.date} · {booking.form.time}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Car className="w-3.5 h-3.5" style={{ color: "var(--solana-purple)" }} />
                <span>
                  {vehicle?.name}
                  {/* Only show VIN after accepted + data shared */}
                  {booking.status !== "PENDING" && booking.status !== "REJECTED" && (booking.form.shareHistory || booking.form.shareDigitalTwin || booking.type === "walkin") && (
                    <span className="mono ml-1 text-[10px]" style={{ color: "var(--solana-text-muted)" }}>({vehicle?.vin})</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.08)" }}>
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--solana-text-muted)" }} />
              <p style={{ color: "var(--solana-text-muted)" }}>{booking.form.complaint}</p>
            </div>

            {/* Data access links - only when accepted and data shared */}
            {dataActive && (
              <div className="flex flex-wrap gap-2 mb-4">
                {(booking.form.shareHistory || booking.type === "walkin") && (
                  <Link href={`/workshop/vehicle/${vehicle?.vin}`} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors hover:bg-white/5" style={{ background: "rgba(94, 234, 212,0.05)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                    <Eye className="w-3.5 h-3.5" /> Lihat Riwayat Servis
                  </Link>
                )}
                {booking.form.shareDigitalTwin && (
                  <Link href={`/workshop/viewer?vin=${vehicle?.vin}`} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors hover:bg-white/5" style={{ background: "rgba(20,209,255,0.05)", color: "var(--solana-cyan)", border: "1px solid rgba(20,209,255,0.15)" }}>
                    <Box className="w-3.5 h-3.5" /> Lihat 3D Digital Twin
                  </Link>
                )}
              </div>
            )}

            {/* Actions based on status */}
            {booking.status === "PENDING" && (
              <div className="flex gap-3">
                {rejectConfirmId !== booking.id ? (
                  <>
                    <button onClick={() => ctx?.acceptBooking(booking.form.vehicleKey)} className="glow-btn px-5 py-2 text-xs cursor-pointer flex-1 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terima Booking
                    </button>
                    <button onClick={() => setRejectConfirmId(booking.id)} className="px-5 py-2 text-xs rounded-xl cursor-pointer flex-1 flex items-center justify-center gap-1.5" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </>
                ) : (
                  <div className="w-full p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="text-xs mb-3" style={{ color: "#FCA5A5" }}>Yakin ingin menolak booking ini?</p>
                    <div className="flex gap-2">
                      <button onClick={() => { ctx?.rejectBooking(booking.form.vehicleKey); setRejectConfirmId(null); }} className="px-4 py-1.5 text-xs rounded-lg cursor-pointer" style={{ background: "#FCA5A5", color: "#fff" }}>Ya, Tolak</button>
                      <button onClick={() => setRejectConfirmId(null)} className="px-4 py-1.5 text-xs rounded-lg cursor-pointer" style={{ background: "rgba(255,255,255,0.05)", color: "var(--solana-text-muted)" }}>Batal</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {booking.status === "ACCEPTED" && (
              <button onClick={() => ctx?.startService(booking.form.vehicleKey)} className="glow-btn px-5 py-2 text-xs cursor-pointer flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Mulai Servis
              </button>
            )}

            {booking.status === "IN_SERVICE" && (
              <button onClick={() => handleSendInvoice(booking)} className="glow-btn px-5 py-2 text-xs cursor-pointer flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Buat & Kirim Invoice
              </button>
            )}

            {booking.status === "INVOICE_SENT" && (
              <div className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", color: "#5EEAD4", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menunggu pembayaran dari pelanggan...
              </div>
            )}

            {booking.status === "PAID" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pembayaran diterima. Tandatangani transaksi anchoring untuk mencatat log servis on-chain.
                </div>
                <button onClick={() => ctx?.signAnchoring(booking.form.vehicleKey)} className="glow-btn px-5 py-2.5 text-xs cursor-pointer flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Sign Anchoring Transaction
                </button>
              </div>
            )}

            {booking.status === "ANCHORING" && (
              <div className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Anchoring on-chain... menunggu konfirmasi Solana.
              </div>
            )}

            {booking.status === "ANCHORED" && (
              <div className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Log servis tercatat on-chain. Menunggu review dari pelanggan.
              </div>
            )}

            {booking.status === "COMPLETED" && booking.review && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ color: s <= booking.review!.rating ? "#FCD34D" : "rgba(94, 234, 212,0.15)", fill: s <= booking.review!.rating ? "#FCD34D" : "none" }} />
                    ))}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-green)" }}>On-Chain Verified</span>
                </div>
                {booking.review.comment && (
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{booking.review.comment}</p>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Past bookings (static filler) */}
      <div className="space-y-4">
        {pastBookings
          .filter((pb) => activeTab === "Semua" || getTabStatus(activeTab).includes(pb.status))
          .map((pb, i) => (
            <motion.div
              key={pb.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 opacity-60"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{pb.vehicleName}</h3>
                  <StatusBadge status={pb.status} />
                </div>
                <p className="text-[10px] mono" style={{ color: "var(--solana-text-muted)" }}>{pb.date}</p>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>{pb.complaint}</p>
              {pb.status === "COMPLETED" && pb.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3" style={{ color: s <= pb.rating ? "#FCD34D" : "rgba(94, 234, 212,0.15)", fill: s <= pb.rating ? "#FCD34D" : "none" }} />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
      </div>

      {/* Empty state */}
      {visibleBookings.length === 0 && pastBookings.filter((pb) => activeTab === "Semua" || getTabStatus(activeTab).includes(pb.status)).length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--solana-text-muted)" }}>
          <CalendarCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Belum ada permintaan booking</p>
        </div>
      )}
    </div>
  );
}
