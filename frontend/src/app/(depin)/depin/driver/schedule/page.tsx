"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

const week = [
  { day: "Jum 25 Apr", time: "07:00-13:00", zone: "Jakarta Selatan", unit: "#NMS-0001" },
  { day: "Sab 26 Apr", time: "14:00-20:00", zone: "Jakarta Pusat", unit: "#NMS-0001" },
  { day: "Min 27 Apr", time: "Libur", zone: "-", unit: "-" },
  { day: "Sen 28 Apr", time: "07:00-13:00", zone: "Jakarta Selatan", unit: "#NMS-0001" },
  { day: "Sel 29 Apr", time: "07:00-13:00", zone: "Jakarta Barat", unit: "#NMS-0001" },
];

export default function DriverSchedulePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-[480px] mx-auto p-4">
        <Link
          href="/depin/driver"
          className="text-sm inline-flex items-center gap-1 mb-4"
          style={{ color: "#5EEAD4" }}
        >
          ← Kembali
        </Link>

        <h1 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-6 flex items-center gap-2">
          <Calendar size={24} style={{ color: "#5EEAD4" }} />
          Jadwal Operasional
        </h1>

        {/* Today card */}
        <div
          className="glass-card p-5 mb-6"
          style={{ border: "1px solid rgba(94,234,212,0.6)" }}
        >
          <p className="text-xs uppercase mb-1" style={{ color: "#5EEAD4" }}>
            Hari Ini
          </p>
          <h3 className="text-lg font-bold text-white mb-3">Kamis, 24 Apr 2026</h3>
          <div className="text-sm space-y-1">
            <p className="text-gray-300">
              <strong>Shift pagi:</strong> 07:00 - 13:00
            </p>
            <p className="text-gray-300 flex items-center gap-1">
              <MapPin size={14} style={{ color: "#5EEAD4" }} /> Zona Jakarta Selatan
            </p>
          </div>
        </div>

        {/* Week list */}
        <h3 className="text-lg font-bold text-white mb-4">Minggu Ini</h3>
        <div className="space-y-3">
          {week.map((w, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-bold text-white">{w.day}</p>
                <p className="text-xs text-gray-400 font-mono">{w.unit}</p>
              </div>
              <p
                className="text-sm"
                style={{ color: w.time === "Libur" ? "#888" : "#5EEAD4" }}
              >
                {w.time}
              </p>
              {w.zone !== "-" && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {w.zone}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
