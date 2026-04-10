"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Loader2, ShieldCheck,
  Star, Search, Wrench, FileText, Receipt, Bell,
} from "lucide-react";
import Link from "next/link";
import type { BookingStatus } from "@/context/BookingContext";

interface BookingData {
  status: BookingStatus;
  type: "booking" | "walkin";
  workshop: { name: string; address: string };
  form: { date: string; time: string; complaint: string; shareHistory: boolean; shareDigitalTwin: boolean; vehicleKey: string };
  invoice?: {
    serviceType: string;
    parts: { name: string; partNumber: string; manufacturer: string; price: number; isOEM: boolean }[];
    serviceCost: number;
    totalIDR: number;
    mechanicNotes?: string;
  } | null;
  review?: { rating: number; comment?: string; onChainVerified?: boolean } | null;
}

export interface StatusCardsProps {
  booking: BookingData;
  activeVehicle: string;
  rating: number;
  reviewComment: string;
  reviewSubmitted: boolean;
  onSetRating: (r: number) => void;
  onSetReviewComment: (c: string) => void;
  onSubmitReview: () => void;
  onOpenPayment: () => void;
  onReset: () => void;
}

export default function StatusCards({
  booking, activeVehicle, rating, reviewComment, reviewSubmitted,
  onSetRating, onSetReviewComment, onSubmitReview, onOpenPayment, onReset,
}: StatusCardsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* PENDING */}
      {booking.status === "PENDING" && booking.type === "booking" && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "#FCD34D" }}>
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-6 h-6" style={{ color: "#FCD34D" }} />
            </motion.div>
            <div>
              <h3 className="font-semibold">Menunggu Konfirmasi</h3>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Bengkel sedang meninjau permintaan Anda</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--solana-text-muted)" }}>
            Notifikasi akan muncul otomatis saat bengkel mengkonfirmasi atau menolak.
          </p>
          <Link href="/dapp/notifications" className="text-xs flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg" style={{ background: "rgba(250,204,21,0.05)", color: "#FCD34D", border: "1px solid rgba(250,204,21,0.2)" }}>
            <Bell className="w-3.5 h-3.5" /> Lihat Notifikasi
          </Link>
        </div>
      )}

      {/* ACCEPTED */}
      {booking.status === "ACCEPTED" && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "var(--solana-green)" }}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
            <div>
              <h3 className="font-semibold">{booking.type === "walkin" ? "Kendaraan Terdaftar di Bengkel" : "Booking Diterima!"}</h3>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                {booking.type === "walkin" ? "Menunggu mekanik tersedia. Anda akan dipanggil saat giliran tiba." : "Bengkel sedang melakukan pre-analisis kendaraan Anda."}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
            <p className="text-xs" style={{ color: "var(--solana-green)" }}>
              {booking.type === "walkin"
                ? `Data kendaraan Anda telah dibagikan ke ${booking.workshop.name} untuk keperluan servis.`
                : (booking.form.shareHistory || booking.form.shareDigitalTwin)
                ? "Bengkel sedang pre-analisis data kendaraan Anda. Datang sesuai jadwal."
                : `Datang tepat waktu pada ${booking.form.date} pukul ${booking.form.time}`}
            </p>
          </div>
        </div>
      )}

      {/* IN_SERVICE */}
      {booking.status === "IN_SERVICE" && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "var(--solana-cyan)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="w-6 h-6 animate-bounce" style={{ color: "var(--solana-cyan)" }} />
            <div>
              <h3 className="font-semibold">Kendaraan Sedang Diservis</h3>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Mekanik sedang mengerjakan kendaraan Anda</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
            Invoice akan dikirim setelah servis selesai. Harap menunggu di area bengkel.
          </p>
        </div>
      )}

      {/* INVOICE_SENT */}
      {booking.status === "INVOICE_SENT" && booking.invoice && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "#5EEAD4" }}>
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="w-6 h-6" style={{ color: "#5EEAD4" }} />
            <div>
              <h3 className="font-semibold">Invoice Diterima</h3>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{booking.invoice.serviceType} — {booking.workshop.name}</p>
            </div>
          </div>
          <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
            {booking.invoice.parts.map((part, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span style={{ color: "var(--solana-text-muted)" }}>
                  {part.name} {part.isOEM && <span className="text-[9px] px-1 rounded" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-green)" }}>OEM</span>}
                </span>
                <span className="mono">Rp {part.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
              <div className="flex justify-between text-xs"><span style={{ color: "var(--solana-text-muted)" }}>Biaya Servis</span><span className="mono">Rp {booking.invoice.serviceCost.toLocaleString()}</span></div>
            </div>
            <div className="border-t pt-2" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
              <div className="flex justify-between text-sm font-bold"><span>Total</span><span className="gradient-text">Rp {booking.invoice.totalIDR.toLocaleString()}</span></div>
            </div>
          </div>
          {booking.invoice.mechanicNotes && (
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.1)" }}>
              <p className="font-medium mb-1">Catatan Mekanik:</p>
              <p style={{ color: "var(--solana-text-muted)" }}>{booking.invoice.mechanicNotes}</p>
            </div>
          )}
          <button onClick={onOpenPayment} className="glow-btn w-full py-3 text-sm font-semibold cursor-pointer">Bayar Sekarang</button>
        </div>
      )}

      {/* PAID */}
      {booking.status === "PAID" && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "var(--solana-cyan)" }}>
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Loader2 className="w-6 h-6" style={{ color: "var(--solana-cyan)" }} /></motion.div>
            <div><h3 className="font-semibold">Pembayaran Berhasil</h3><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Menunggu bengkel menandatangani transaksi anchoring on-chain.</p></div>
          </div>
          <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(0,194,255,0.05)", border: "1px solid rgba(0,194,255,0.15)", color: "var(--solana-cyan)" }}>
            Bengkel akan menandatangani pembaruan cNFT pada tree enterprise. Setelah selesai, riwayat servis muncul di Service Timeline Anda.
          </div>
        </div>
      )}

      {/* ANCHORING */}
      {booking.status === "ANCHORING" && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "var(--solana-purple)" }}>
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}><Loader2 className="w-6 h-6" style={{ color: "var(--solana-purple)" }} /></motion.div>
            <div><h3 className="font-semibold">Anchoring Log Servis</h3><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Bengkel sedang menandatangani transaksi pada Solana.</p></div>
          </div>
        </div>
      )}

      {/* ANCHORED */}
      {booking.status === "ANCHORED" && !reviewSubmitted && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "var(--solana-purple)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
            <div><h3 className="font-semibold">Anchoring Selesai</h3><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Beri review untuk {booking.workshop.name}</p></div>
          </div>
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => onSetRating(s)} className="cursor-pointer p-0.5">
                  <Star className="w-7 h-7 transition-colors" style={{ color: s <= rating ? "#FCD34D" : "rgba(94, 234, 212,0.2)", fill: s <= rating ? "#FCD34D" : "none" }} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>Komentar (opsional)</p>
            <textarea value={reviewComment} onChange={(e) => onSetReviewComment(e.target.value)} placeholder="Ceritakan pengalaman servis Anda..." rows={3} className="w-full px-3 py-2.5 rounded-xl bg-white/5 text-sm outline-none resize-none" style={{ border: "1px solid rgba(94, 234, 212,0.15)", color: "var(--solana-text)" }} />
          </div>
          <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "var(--solana-green)" }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Review + service record di-anchor ke Solana dalam 1 transaksi (gas fee sudah termasuk)</span>
          </div>
          <button onClick={onSubmitReview} disabled={rating === 0} className="glow-btn w-full py-2.5 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            Kirim Review & Selesaikan
          </button>
        </div>
      )}

      {/* REJECTED */}
      {booking.status === "REJECTED" && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "#FCA5A5" }}>
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-6 h-6" style={{ color: "#FCA5A5" }} />
            <div><h3 className="font-semibold">Booking Ditolak</h3><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Bengkel tidak dapat menerima booking pada waktu yang dipilih</p></div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--solana-text-muted)" }}>Data kendaraan Anda tidak dibagikan kepada bengkel ini.</p>
          <Link href="/dapp/book" className="glow-btn px-4 py-2 text-xs text-center block cursor-pointer" onClick={onReset}>
            <Search className="w-3.5 h-3.5 inline mr-1.5" /> Cari Bengkel Lain
          </Link>
        </div>
      )}

      {/* COMPLETED */}
      {(booking.status === "COMPLETED" || reviewSubmitted) && (
        <div className="glass-card p-6 border-l-4" style={{ borderLeftColor: "var(--solana-green)" }}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
            <div><h3 className="font-semibold">Servis Selesai!</h3><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Riwayat servis tercatat di Service Timeline</p></div>
          </div>
          {booking.review && (
            <div className="p-3 rounded-xl mb-4 flex items-center gap-2" style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--solana-green)" }} />
              <p className="text-xs" style={{ color: "var(--solana-green)" }}>Review ({booking.review.rating}/5) — On-chain anchored</p>
            </div>
          )}
          <div className="flex gap-2">
            <Link href="/dapp/timeline" className="flex-1 py-2 text-xs text-center rounded-xl flex items-center justify-center gap-1.5 cursor-pointer" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
              <FileText className="w-3.5 h-3.5" /> Lihat Timeline
            </Link>
            <Link href="/dapp/book" className="flex-1 glow-btn py-2 text-xs text-center block cursor-pointer" onClick={onReset}>
              Booking Baru
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
