"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Battery,
  Navigation,
  Calendar,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function DriverHomePage() {
  const [gpsOn, setGpsOn] = useState(true);

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-[480px] mx-auto p-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-2">
            <Image src="/noc_logo.png" alt="Nemesis" width={40} height={40} />
            <h1 className="text-lg font-bold text-white font-[family-name:var(--font-orbitron)]">
              Nemesis Protocol
            </h1>
          </div>
          <button className="p-2 rounded-full" style={{ background: "rgba(94,234,212,0.1)" }}>
            <Bell size={20} style={{ color: "#5EEAD4" }} />
          </button>
        </div>

        {/* Card 1: GPS Toggle */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Navigation size={20} style={{ color: "#5EEAD4" }} />
            <h2 className="text-lg font-bold text-white">GPS Tracker</h2>
          </div>
          <button
            onClick={() => setGpsOn(!gpsOn)}
            className="w-full py-6 rounded-2xl transition"
            style={{
              background: gpsOn
                ? "linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(94,234,212,0.2) 100%)"
                : "rgba(239,68,68,0.15)",
              border: gpsOn
                ? "2px solid rgba(34,197,94,0.6)"
                : "2px solid rgba(239,68,68,0.6)",
            }}
          >
            <p
              className="text-2xl font-bold font-[family-name:var(--font-orbitron)]"
              style={{ color: gpsOn ? "#5EEAD4" : "#EF4444" }}
            >
              {gpsOn ? "● AKTIF" : "○ NONAKTIF"}
            </p>
          </button>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-400 flex items-center gap-1">
              <Clock size={14} /> Berjalan 5j 23m hari ini
            </span>
            <span className="flex items-center gap-1 text-white">
              <Battery size={14} style={{ color: "#5EEAD4" }} /> 82%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            GPS aktif → kontribusi ke jaringan Nemesis
          </p>
        </div>

        {/* Card 2: Flat Fee */}
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm text-gray-400 uppercase mb-2">Flat Fee Hari Ini</h3>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white">Rp 50.000</p>
            <span className="badge badge-green inline-flex items-center gap-1">
              <CheckCircle2 size={14} /> LUNAS
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Dibayar otomatis dari saldo
          </p>
        </div>

        {/* Card 3: Service Reminder */}
        <div
          className="glass-card p-5 mb-4"
          style={{ borderLeft: "4px solid #F59E0B" }}
        >
          <h3 className="text-sm text-gray-400 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle size={14} style={{ color: "#F59E0B" }} />
            Jadwal Servis
          </h3>
          <p className="text-base text-white mb-3">
            Servis berikutnya ~<strong>300 km</strong> lagi
          </p>
          <Link
            href="/depin/driver/schedule"
            className="glow-btn-outline inline-flex items-center gap-1 text-sm px-4 py-2 w-full justify-center"
          >
            Lihat Jadwal <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card 4: Quick links */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Link
            href="/depin/driver/schedule"
            className="glass-card p-3 text-center flex flex-col items-center gap-1"
          >
            <Calendar size={22} style={{ color: "#5EEAD4" }} />
            <span className="text-xs text-white">Jadwal</span>
          </Link>
          <Link
            href="/depin/driver/docs"
            className="glass-card p-3 text-center flex flex-col items-center gap-1"
          >
            <FileText size={22} style={{ color: "#5EEAD4" }} />
            <span className="text-xs text-white">Dokumen</span>
          </Link>
          <Link
            href="/depin"
            className="glass-card p-3 text-center flex flex-col items-center gap-1"
          >
            <Clock size={22} style={{ color: "#5EEAD4" }} />
            <span className="text-xs text-white">Riwayat</span>
          </Link>
        </div>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto"
        style={{
          background: "var(--solana-dark-2)",
          borderTop: "1px solid rgba(94,234,212,0.25)",
        }}
      >
        <div className="grid grid-cols-3 text-center">
          <Link href="/depin/driver" className="py-3 flex flex-col items-center gap-0.5">
            <Navigation size={20} style={{ color: "#5EEAD4" }} />
            <span className="text-xs" style={{ color: "#5EEAD4" }}>
              Beranda
            </span>
          </Link>
          <Link href="/depin/driver/schedule" className="py-3 flex flex-col items-center gap-0.5">
            <Calendar size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400">Jadwal</span>
          </Link>
          <Link href="/depin/driver/docs" className="py-3 flex flex-col items-center gap-0.5">
            <FileText size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400">Dokumen</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
