"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Bell,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const dashboardData = {
bmw_m4: {
    recentEvents: [
      { date: "2026-03-01", type: "Suspension Check", mechanic: "EuroHaus M Performance (★ 4.9)", mileage: "12,400 km", status: "Verified" },
      { date: "2025-10-12", type: "Tire Replacement", mechanic: "Bintang Racing (★ 4.7)", mileage: "9,800 km", status: "Verified" },
    ],
    aiAlerts: [
      { part: "Brake Pads (Rear)", health: 60, risk: "Medium", prediction: "Replace within 30 days", color: "#FCD34D" },
    ]
  },
harley: {
    recentEvents: [
      { date: "2025-12-20", type: "Primary Chain Adj", mechanic: "Mabua Custom (★ 5.0)", mileage: "8,900 km", status: "Verified" },
    ],
    aiAlerts: [
      { part: "Battery", health: 50, risk: "Medium", prediction: "Check voltage", color: "#FCD34D" },
    ]
  },
pcx_150: {
    recentEvents: [],
    aiAlerts: [
      { part: "Drive Belt", health: 54, risk: "Medium", prediction: "Inspect CVT belt within 14 days", color: "#FCD34D" },
      { part: "Air Filter Element", health: 58, risk: "Medium", prediction: "Clean or replace at next service", color: "#FCD34D" },
    ]
  },
  supra: {
    recentEvents: [
      { date: "2026-03-15", type: "Turbo Inspection", mechanic: "JDM Garage Jakarta (★ 4.9)", mileage: "8,500 km", status: "Verified" },
      { date: "2026-01-20", type: "Oil Change (Full Synthetic)", mechanic: "JDM Garage Jakarta (★ 4.9)", mileage: "7,200 km", status: "Verified" },
    ],
    aiAlerts: [
      { part: "Radiator", health: 70, risk: "Medium", prediction: "Inspect coolant level within 30 days", color: "#FCD34D" },
      { part: "Brake Disc (RR)", health: 70, risk: "Medium", prediction: "Monitor wear within 60 days", color: "#FCD34D" },
    ]
  }
};

function HealthScoreRing({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "#86EFAC" : score >= 70 ? "#5EEAD4" : score >= 50 ? "#FCD34D" : score >= 30 ? "#5EEAD4" : "#FCA5A5";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(94, 234, 212,0.1)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health</p>
      </div>
    </div>
  );
}





import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { useBooking } from "@/context/BookingContext";
import { api } from "@/lib/api/client";
import { mapBackendServiceTimelineEntry } from "@/lib/serviceEvents";
import { Shield } from "lucide-react";

export default function DAppDashboard() {
  const ctx = useActiveVehicle();
  const bookingCtx = useBooking();
  const hasActiveVehicle = ctx?.hasActiveVehicle ?? false;
  const currentKey = ctx?.activeVehicle || "bmw_m4";
  const activeVehicleId = ctx?.activeVehicleId;
  const isDemoVehicle = ctx?.activeVehicleIdentity.isDemo ?? true;
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.bmw_m4;
  const demoDashboard = isDemoVehicle
    ? (dashboardData[currentKey] || dashboardData.bmw_m4)
    : { recentEvents: [], aiAlerts: [] };
  const [backendRecentEvents, setBackendRecentEvents] = useState<typeof dashboardData.bmw_m4.recentEvents>([]);
  const recentEvents = useMemo(
    () => isDemoVehicle ? demoDashboard.recentEvents : backendRecentEvents,
    [backendRecentEvents, demoDashboard.recentEvents, isDemoVehicle],
  );
  const aiAlerts = demoDashboard.aiAlerts;

  useEffect(() => {
    let cancelled = false;
    if (!activeVehicleId || isDemoVehicle) {
      setBackendRecentEvents([]);
      return () => { cancelled = true; };
    }

    void api.vehicleTimeline(activeVehicleId)
      .then((response) => {
        if (cancelled) return;
        const events = response.items
          .map((entry, index) => mapBackendServiceTimelineEntry(entry, index, { health: currentVehicleData.health, mileage: currentVehicleData.mileage }))
          .filter((event): event is NonNullable<ReturnType<typeof mapBackendServiceTimelineEntry>> => Boolean(event))
          .slice(0, 5)
          .map((event) => ({
            date: event.date,
            type: event.type,
            mechanic: event.mechanic,
            mileage: event.mileage,
            status: event.txSig ? "Verified" : "Recorded",
          }));
        setBackendRecentEvents(events);
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("[dapp-dashboard] service events load skipped", error);
          setBackendRecentEvents([]);
        }
      });

    return () => { cancelled = true; };
  }, [activeVehicleId, currentVehicleData.health, currentVehicleData.mileage, isDemoVehicle]);

  // Warranty data for active vehicle
  const vehicleClaims = (bookingCtx?.warrantyClaims || []).filter(c => c.vin === currentVehicleData.vin);
  const latestClaim = vehicleClaims[0];
  const coverageSummary = `Basic warranty active — expires 2028-06-15`;
  const drivetrainSummary = `Drivetrain — 62,000 km remaining`;

  // Per-vehicle active booking — drives the "Status Servis" button badge.
  const activeBookingForVehicle = bookingCtx?.bookings[activeVehicleId || currentKey] || bookingCtx?.bookings[currentKey] || null;
  const hasActiveBooking = !!activeBookingForVehicle && !["COMPLETED", "REJECTED"].includes(activeBookingForVehicle.status);

  // Unread notifications for the user role — badge on the Bell button.
  const unreadNotifCount = (bookingCtx?.bookingNotifications || [])
    .filter(n => n.targetRole === "user" && !n.read).length;

  if (!hasActiveVehicle) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Vehicle Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Belum ada kendaraan digital di akun ini.</p>
          </div>
          <Link
            href="/dapp/notifications"
            className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: "var(--solana-text-muted)", border: "1px solid rgba(94, 234, 212,0.15)" }}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1" style={{ background: "#FCA5A5", color: "#0E0E1A" }}>
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link href="/enterprise/fleet" className="glass-card p-8 flex items-start justify-between hover:bg-white/[0.04] transition-colors">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold">Beli kendaraan dari dealer</h2>
              <p className="mt-2 text-sm text-slate-400">Dealer/enterprise bisa mint kendaraan baru lalu transfer cNFT ke embedded wallet akun ini.</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-teal-300" />
          </Link>
          <Link href="/dapp/register-vehicle" className="glass-card p-8 flex items-start justify-between hover:bg-white/[0.04] transition-colors">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                <Wrench className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold">Register kendaraan sendiri</h2>
              <p className="mt-2 text-sm text-slate-400">Ajukan audit ke workshop/manufacturer agar identitas digital kendaraan bisa diminting.</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-teal-300" />
          </Link>
        </div>

        <div className="glass-card p-8 text-center text-sm text-slate-400">
          Dashboard, service timeline, AI insight, 3D twin, booking, dan identity card akan aktif setelah kendaraan hasil mint program baru masuk ke akun ini.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            Vehicle Dashboard
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-slate-700/50">
              {currentVehicleData.name}
            </span>
            <span className="text-xs text-slate-500 font-mono ml-2 border-l border-slate-700 pl-3">
              {currentVehicleData.vin}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications button — replaces the old sidebar Notifications tab. */}
          <Link
            href="/dapp/notifications"
            className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: "var(--solana-text-muted)", border: "1px solid rgba(94, 234, 212,0.15)" }}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                style={{ background: "#FCA5A5", color: "#0E0E1A" }}
              >
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </Link>
          <Link href="/dapp/viewer" className="glow-btn text-sm flex items-center gap-2" style={{ padding: "10px 20px" }}>
            View 3D Digital Twin <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link href="/dapp/register-vehicle" className="glass-card p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
          <div>
            <p className="text-sm font-semibold">Daftarkan Kendaraan</p>
            <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>
              Kirim request audit ke workshop credentialed, lalu claim NFT setelah enterprise approve.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-teal-300" />
        </Link>
        <Link href="/dapp/identity" className="glass-card p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
          <div>
            <p className="text-sm font-semibold">Identity & Transfer</p>
            <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>
              Kelola QR/NFC, ownership, transfer, dan klaim vehicle identity.
            </p>
          </div>
          <Shield className="w-5 h-5 text-teal-300" />
        </Link>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col items-center">
          <HealthScoreRing score={currentVehicleData.health} />
          <p className="mt-3 text-sm font-semibold">Overall Health</p>
          <span className="badge badge-green mt-2">Good</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(94, 234, 212,0.12)" }}>
                <Calendar className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Next Service</p>
                <p className="font-semibold">{currentVehicleData.nextService}</p>
              </div>
            </div>
            <p className="text-sm mb-2" style={{ color: "var(--solana-text-muted)" }}>CVT Belt Inspection recommended</p>
            <div className="flex gap-2 mb-4">
              <span className="badge badge-purple" style={{ fontSize: "10px", padding: "2px 6px" }}>CVT Fluid</span>
              <span className="badge badge-green" style={{ fontSize: "10px", padding: "2px 6px" }}>Filter</span>
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-xs mb-3 font-medium flex items-center gap-1" style={{ color: "var(--solana-text-muted)" }}>
              Est. Cost: <span className="mono" style={{ color: "var(--solana-green)" }}>Rp 450k-600k</span>
            </p>
            <Link href="/dapp/book" className="glow-btn w-full text-xs py-2.5 cursor-pointer text-center block">Book Appointment</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(94, 234, 212,0.12)" }}>
                <Clock className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Total Mileage</p>
                <p className="text-2xl font-bold leading-tight">{currentVehicleData.mileage} <span className="text-sm font-normal text-gray-500">km</span></p>
              </div>
            </div>
            
            <div className="mt-5">
              <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--solana-text-muted)" }}>
                <span>Next Major Service Focus</span>
                <span className="mono">40,000 km</span>
              </div>
              <div className="w-full h-1.5 rounded-full relative" style={{ background: "rgba(94, 234, 212,0.15)" }}>
                <div className="h-1.5 rounded-full" style={{ width: "86%", background: "var(--solana-gradient)" }} />
                <div className="absolute top-1/2 -mt-1 -right-1 w-2 h-2 rounded-full border border-black" style={{ background: "var(--solana-pink)" }} />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t flex items-start gap-2" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
             <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--solana-green)" }} />
             <p className="text-[11px] leading-snug" style={{ color: "var(--solana-text-muted)" }}>
               <span style={{ color: "var(--solana-green)" }}>↑ 12% higher</span> usage this week. Avg: 45 km/day.
             </p>
          </div>
        </motion.div>

        {/* Warranty Status card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(250,204,21,0.12)" }}>
                <Shield className="w-5 h-5" style={{ color: "#FCD34D" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Warranty Status</p>
                <p className="font-semibold text-sm">Active Coverage</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-xs" style={{ color: "var(--solana-text-muted)" }}>
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#86EFAC" }} />
                <span>{coverageSummary}</span>
              </div>
              <div className="flex items-start gap-2 text-xs" style={{ color: "var(--solana-text-muted)" }}>
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#86EFAC" }} />
                <span>{drivetrainSummary}</span>
              </div>
            </div>
            {latestClaim ? (
              <div className="p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--solana-text-muted)" }}>Latest Claim</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                    background: latestClaim.status === "Approved" ? "rgba(34,197,94,0.15)" : latestClaim.status === "Pending" ? "rgba(250,204,21,0.15)" : "rgba(239,68,68,0.15)",
                    color: latestClaim.status === "Approved" ? "#86EFAC" : latestClaim.status === "Pending" ? "#FCD34D" : "#FCA5A5",
                  }}>{latestClaim.status}</span>
                </div>
                <p className="text-xs font-medium truncate">{latestClaim.description.slice(0, 50)}{latestClaim.description.length > 50 ? "…" : ""}</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--solana-text-muted)" }}>Submitted by {latestClaim.submittedByWorkshopName}</p>
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--solana-text-muted)" }}>No active warranty claims.</p>
            )}
          </div>
          <Link href="/dapp/notifications" className="mt-4 text-xs flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--solana-purple)" }}>
            View all claims <ArrowUpRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* AI Alerts */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
          AI Predictive Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {aiAlerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 border-l-4"
              style={{ borderLeftColor: alert.color }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{alert.part}</h3>
                <span className="text-2xl font-bold mono" style={{ color: alert.color }}>{alert.health}</span>
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{alert.prediction}</p>
              <div className="mt-3 w-full h-1.5 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${alert.health}%`, background: alert.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent events */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Wrench className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
            Recent Service Events
          </h2>
          <Link href="/dapp/timeline" className="text-sm flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--solana-purple)" }}>
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Mechanic</th>
                <th>Mileage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.length ? recentEvents.map((e, i) => (
                <tr key={i}>
                  <td className="mono text-sm">{e.date}</td>
                  <td className="font-medium">{e.type}</td>
                  <td style={{ color: "var(--solana-text-muted)" }}>{e.mechanic}</td>
                  <td className="mono">{e.mileage}</td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--solana-green)" }}>
                      <CheckCircle2 className="w-4 h-4" /> {e.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm" style={{ color: "var(--solana-text-muted)" }}>
                    Belum ada service event untuk kendaraan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
