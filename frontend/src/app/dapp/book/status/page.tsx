"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, Loader2,
  Bell, WifiIcon,
} from "lucide-react";
import Link from "next/link";
import { useBooking, type BookingStatus, type SessionType } from "@/context/BookingContext";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import dynamic from "next/dynamic";
import StatusCards from "@/components/dapp/status/StatusCards";
import ServiceDetailPanel from "@/components/dapp/status/ServiceDetailPanel";

const PaymentModal = dynamic(
  () => import("@/components/ui/PaymentModal").then(m => ({ default: m.PaymentModal })),
  { ssr: false }
);

// Steps for each session type
const bookingSteps: { key: BookingStatus[]; label: string; desc: string }[] = [
  { key: ["PENDING"],       label: "Dikirim",  desc: "Menunggu konfirmasi bengkel" },
  { key: ["ACCEPTED"],      label: "Diterima", desc: "Bengkel mengkonfirmasi" },
  { key: ["IN_SERVICE"],    label: "Servis",   desc: "Kendaraan sedang dikerjakan" },
  { key: ["INVOICE_SENT"],  label: "Invoice",  desc: "Invoice diterima" },
  { key: ["PAID", "ANCHORING"], label: "Anchor", desc: "Bengkel menandatangani log on-chain" },
  { key: ["ANCHORED"],      label: "Review",   desc: "Beri ulasan Anda" },
  { key: ["COMPLETED"],     label: "Selesai",  desc: "Servis selesai & tercatat" },
];

const walkinSteps: { key: BookingStatus[]; label: string; desc: string }[] = [
  { key: ["ACCEPTED"],      label: "Tiba",     desc: "Kendaraan terdaftar di bengkel" },
  { key: ["IN_SERVICE"],    label: "Servis",   desc: "Kendaraan sedang dikerjakan" },
  { key: ["INVOICE_SENT"],  label: "Invoice",  desc: "Invoice diterima" },
  { key: ["PAID", "ANCHORING"], label: "Anchor", desc: "Bengkel menandatangani log on-chain" },
  { key: ["ANCHORED"],      label: "Review",   desc: "Beri ulasan Anda" },
  { key: ["COMPLETED"],     label: "Selesai",  desc: "Servis selesai & tercatat" },
];

function getSteps(type: SessionType) { return type === "walkin" ? walkinSteps : bookingSteps; }
function getStepIndex(status: BookingStatus, type: SessionType): number {
  if (status === "REJECTED") return -1;
  return getSteps(type).findIndex(s => s.key.includes(status));
}

function StatusSidebarPanel({ status, type, workshopName, bookingDate, bookingTime, sessionId }: {
  status: BookingStatus; type: SessionType; workshopName: string; bookingDate: string; bookingTime: string; sessionId: string;
}) {
  const steps = getSteps(type);
  const stepIndex = getStepIndex(status, type);
  const isRejected = status === "REJECTED";
  const isActive = status !== "COMPLETED" && status !== "REJECTED";

  return (
    <div className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 rounded-2xl p-5" style={{ background: "rgba(94, 234, 212,0.04)", border: "1px solid rgba(94, 234, 212,0.12)" }}>
      <div className="flex items-center gap-2 mb-6">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />LIVE
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)" }}>{isRejected ? "DITOLAK" : "SELESAI"}</span>
        )}
        <span className="text-[9px] mono" style={{ color: "var(--solana-text-muted)" }}>{type === "walkin" ? "Walk-In" : "Booking"}</span>
      </div>

      {!isRejected && (
        <div className="flex flex-col gap-0 relative flex-1">
          {steps.map((step, i) => {
            const isDone = i < stepIndex;
            const isCurrent = i === stepIndex;
            const isFuture = i > stepIndex;
            return (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: isDone ? "rgba(94, 234, 212,0.15)" : isCurrent ? "var(--solana-gradient)" : "rgba(94, 234, 212,0.06)", border: `2px solid ${isDone ? "var(--solana-green)" : isCurrent ? "transparent" : "rgba(94, 234, 212,0.15)"}` }}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--solana-green)" }} /> : isCurrent ? (status === "PENDING" ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Loader2 className="w-3.5 h-3.5 text-white" /></motion.div> : <span className="w-2 h-2 rounded-full bg-white" />) : <span className="text-[9px] font-bold" style={{ color: "rgba(94, 234, 212,0.4)" }}>{i + 1}</span>}
                  </div>
                  {i < steps.length - 1 && <div className="w-0.5 flex-1 min-h-[28px]" style={{ background: isDone ? "var(--solana-green)" : "rgba(94, 234, 212,0.1)" }} />}
                </div>
                <div className="pb-6">
                  <p className="text-xs font-semibold leading-tight" style={{ color: isFuture ? "rgba(94, 234, 212,0.3)" : isCurrent ? "white" : "var(--solana-green)" }}>{step.label}</p>
                  {isCurrent && <p className="text-[10px] mt-0.5" style={{ color: "var(--solana-text-muted)" }}>{step.desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isRejected && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <XCircle className="w-10 h-10 mb-3" style={{ color: "#FCA5A5" }} />
          <p className="text-sm font-semibold" style={{ color: "#FCA5A5" }}>Booking Ditolak</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--solana-text-muted)" }}>Data kendaraan tidak dibagikan</p>
        </div>
      )}

      <div className="pt-4 border-t" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
        <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--solana-text-muted)" }}>Bengkel</p>
        <p className="text-xs font-semibold leading-tight">{workshopName}</p>
        {bookingDate && <p className="text-[10px] mt-1 mono" style={{ color: "var(--solana-purple)" }}>{bookingDate} · {bookingTime}</p>}
        <p className="text-[10px] mono mt-2" style={{ color: "rgba(94, 234, 212,0.4)" }}>#{sessionId.slice(-8)}</p>
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  const ctx = useBooking();
  const activeVehicleCtx = useActiveVehicle();
  const activeVehicle = activeVehicleCtx?.activeVehicle || "avanza";
  const booking = ctx?.bookings[activeVehicle] || null;
  const unreadNotifCount = (ctx?.bookingNotifications || []).filter(n => n.targetRole === "user" && !n.read).length;
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Clock className="w-12 h-12 mb-4 opacity-30" />
        <h2 className="text-xl font-bold mb-2">Belum Ada Sesi Servis</h2>
        <p className="text-sm mb-6" style={{ color: "var(--solana-text-muted)" }}>Booking atau tunjukkan QR/NFC ke bengkel untuk memulai</p>
        <div className="flex gap-3">
          <Link href="/dapp/book" className="glow-btn px-6 py-2.5 text-sm">Booking Bengkel</Link>
          <Link href="/dapp/identity" className="px-6 py-2.5 text-sm rounded-xl cursor-pointer" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
            <WifiIcon className="w-4 h-4 inline mr-1.5" />QR / NFC
          </Link>
        </div>
      </div>
    );
  }

  const vehicle = vehicleData[booking.form.vehicleKey];
  const stepIndex = getStepIndex(booking.status, booking.type);
  const isRejected = booking.status === "REJECTED";

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Status Servis</h1>
          <p className="text-xs mono mt-1" style={{ color: "var(--solana-text-muted)" }}>{booking.type === "walkin" ? "Walk-In" : "Booking"} · {booking.id}</p>
        </div>
        <Link href="/dapp/notifications" className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors" style={{ color: "var(--solana-text-muted)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
          <Bell className="w-5 h-5" />
          {unreadNotifCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--solana-purple)", color: "#fff" }}>{unreadNotifCount}</span>}
        </Link>
      </div>

      {/* Mobile stepper */}
      {!isRejected && (
        <div className="lg:hidden glass-card p-4 mb-6 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {getSteps(booking.type).map((step, i) => {
              const isDone = i < stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: isDone ? "rgba(94, 234, 212,0.15)" : isCurrent ? "var(--solana-gradient)" : "rgba(94, 234, 212,0.06)", border: `2px solid ${isDone ? "var(--solana-green)" : isCurrent ? "transparent" : "rgba(94, 234, 212,0.1)"}` }}>
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--solana-green)" }} /> : isCurrent ? <span className="w-2 h-2 rounded-full bg-white" /> : <span className="text-[9px]" style={{ color: "rgba(94, 234, 212,0.3)" }}>{i+1}</span>}
                    </div>
                    <span className="text-[9px] mt-1 font-medium" style={{ color: i <= stepIndex ? "var(--solana-text)" : "rgba(94, 234, 212,0.3)" }}>{step.label}</span>
                  </div>
                  {i < getSteps(booking.type).length - 1 && <div className="w-8 h-0.5 mx-1 -mt-4" style={{ background: isDone ? "var(--solana-green)" : "rgba(94, 234, 212,0.1)" }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        <StatusSidebarPanel status={booking.status} type={booking.type} workshopName={booking.workshop.name} bookingDate={booking.form.date} bookingTime={booking.form.time} sessionId={booking.id} />

        <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <StatusCards
              booking={booking as any}
              activeVehicle={activeVehicle}
              rating={rating}
              reviewComment={reviewComment}
              reviewSubmitted={reviewSubmitted}
              onSetRating={setRating}
              onSetReviewComment={setReviewComment}
              onSubmitReview={() => { if (rating > 0) { ctx?.submitReview(activeVehicle, { rating, comment: reviewComment, onChainVerified: true }); setReviewSubmitted(true); } }}
              onOpenPayment={() => setPaymentOpen(true)}
              onReset={() => ctx?.reset(activeVehicle)}
            />
          </div>
          <ServiceDetailPanel booking={booking as any} vehicleName={vehicle.name} vehicleVin={vehicle.vin} />
        </div>
      </div>

      {booking.invoice && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          serviceDetails={{
            serviceName: booking.invoice.serviceType,
            description: `Servis di ${booking.workshop.name}`,
            amountIDR: booking.invoice.totalIDR,
            amountUSDC: Math.round(booking.invoice.totalIDR / 16000 * 100) / 100,
            amountNOC: Math.round(booking.invoice.totalIDR / 52),
            parts: booking.invoice.parts.map((p) => ({ name: p.name, partNumber: p.partNumber, manufacturer: p.manufacturer, priceIDR: p.price, isOem: p.isOEM })),
            serviceCost: booking.invoice.serviceCost,
          }}
          onPaymentComplete={() => { ctx?.payInvoice(activeVehicle); setPaymentOpen(false); }}
        />
      )}
    </div>
  );
}
