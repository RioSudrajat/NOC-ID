"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Filter, Search, Wrench, Droplets, Settings, ShieldCheck, Gauge } from "lucide-react";

const timelineEvents = [
  { id: 1, date: "2026-02-10", type: "Oil Change", category: "Fluids", icon: Droplets, mechanic: "Pak Hendra", workshop: "Bengkel Hendra Motor", rating: 4.8, mileage: "34,521 km", parts: ["Engine Oil 5W-30 (4L)", "Oil Filter #90915-YZZD4"], cost: "Rp 450,000", txSig: "4xK9...mF7q", healthBefore: 45, healthAfter: 95 },
  { id: 2, date: "2026-01-15", type: "Brake Pad Replacement", category: "Brakes", icon: ShieldCheck, mechanic: "Workshop Maju Jaya", workshop: "PT Maju Jaya Auto", rating: 4.5, mileage: "31,200 km", parts: ["Front Brake Pad Set #04465-BZ010", "Brake Disc Rotor FL #43512-BZ060"], cost: "Rp 1,200,000", txSig: "7hR2...pK4s", healthBefore: 28, healthAfter: 100 },
  { id: 3, date: "2025-11-20", type: "Full Inspection", category: "Inspection", icon: Gauge, mechanic: "Dealer Toyota BSD", workshop: "Toyota Astra Motor BSD", rating: 4.9, mileage: "28,000 km", parts: [], cost: "Rp 0 (Warranty)", txSig: "2mN5...xJ8w", healthBefore: 82, healthAfter: 87 },
  { id: 4, date: "2025-08-15", type: "CVT Fluid Replacement", category: "Transmission", icon: Settings, mechanic: "Pak Hendra", workshop: "Bengkel Hendra Motor", rating: 4.8, mileage: "24,100 km", parts: ["Toyota CVT Fluid FE (4L)"], cost: "Rp 800,000", txSig: "9kL1...bN3r", healthBefore: 60, healthAfter: 92 },
  { id: 5, date: "2025-05-10", type: "Tire Rotation", category: "Tires", icon: Settings, mechanic: "Workshop Maju Jaya", workshop: "PT Maju Jaya Auto", rating: 4.5, mileage: "20,000 km", parts: [], cost: "Rp 100,000", txSig: "3pW7...dQ5t", healthBefore: 70, healthAfter: 85 },
  { id: 6, date: "2025-03-01", type: "Air Filter Replacement", category: "Engine", icon: Wrench, mechanic: "Dealer Toyota BSD", workshop: "Toyota Astra Motor BSD", rating: 4.9, mileage: "16,000 km", parts: ["Air Filter Element #17801-BZ050"], cost: "Rp 150,000", txSig: "6tY4...hM2a", healthBefore: 40, healthAfter: 100 },
];

function getHealthColor(health: number) {
  if (health >= 90) return "#22C55E";
  if (health >= 70) return "#A3E635";
  if (health >= 50) return "#FACC15";
  if (health >= 30) return "#F97316";
  return "#EF4444";
}

export default function TimelinePage() {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Service Timeline</h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Complete on-chain maintenance history</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(20,20,40,0.5)", border: "1px solid rgba(153,69,255,0.2)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} />
            <input type="text" placeholder="Search events..." className="bg-transparent outline-none text-sm" style={{ color: "var(--solana-text)" }} />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)", color: "var(--solana-text-muted)" }}>
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-[2px] hidden md:block" style={{ background: "linear-gradient(180deg, var(--solana-purple), var(--solana-green), transparent)" }} />

        <div className="flex flex-col gap-8">
          {timelineEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex gap-6 lg:gap-8"
            >
              {/* Timeline dot */}
              <div className="hidden md:flex items-start pt-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center z-10 shrink-0" style={{ background: "var(--solana-dark-2)", border: "2px solid var(--solana-purple)" }}>
                  <event.icon className="w-5 h-5" style={{ color: "var(--solana-green)" }} />
                </div>
              </div>

              {/* Card */}
              <div className="glass-card p-8 flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-bold">{event.type}</h3>
                      <span className="badge badge-purple">{event.category}</span>
                    </div>
                    <p className="text-base" style={{ color: "var(--solana-text-muted)" }}>
                      {event.workshop} · {event.mechanic} (★ {event.rating})
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="mono text-base font-semibold mb-1">{event.date}</p>
                    <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{event.mileage}</p>
                  </div>
                </div>

                {/* Health change */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Health:</span>
                  <span className="mono font-bold" style={{ color: getHealthColor(event.healthBefore) }}>{event.healthBefore}</span>
                  <span style={{ color: "var(--solana-text-muted)" }}>→</span>
                  <span className="mono font-bold" style={{ color: getHealthColor(event.healthAfter) }}>{event.healthAfter}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(153,69,255,0.1)" }}>
                    <div className="h-1 rounded-full transition-all" style={{ width: `${event.healthAfter}%`, background: getHealthColor(event.healthAfter) }} />
                  </div>
                </div>

                {/* Parts + TX */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                  <div>
                    {event.parts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.parts.map((p, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded-md" style={{ background: "rgba(20,20,40,0.5)", color: "var(--solana-text-muted)" }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold" style={{ color: "var(--solana-green)" }}>{event.cost}</span>
                    <a href="#" className="flex items-center gap-1 text-xs mono" style={{ color: "var(--solana-purple)" }}>
                      <CheckCircle2 className="w-3 h-3" />
                      tx: {event.txSig}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
