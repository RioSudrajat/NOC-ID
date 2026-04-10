"use client";

import { motion } from "framer-motion";
import { Car, Search } from "lucide-react";
import type { VehicleData, VehicleSelectStepProps } from "./types";

export default function VehicleSelectStep({
  search, onSearchChange, filteredFleet, selectedVehicle, onSelectVehicle, onNext,
}: VehicleSelectStepProps) {
  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Car className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
          Pilih Kendaraan
        </h2>
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
          <input type="text" className="input-field pl-9 w-full" placeholder="Cari VIN atau model..." value={search} onChange={e => onSearchChange(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          {filteredFleet.map(v => (
            <button
              key={v.vin}
              onClick={() => onSelectVehicle(v)}
              className="flex items-center justify-between p-4 rounded-xl text-left transition-all"
              style={{
                background: selectedVehicle?.vin === v.vin ? "rgba(94, 234, 212,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedVehicle?.vin === v.vin ? "rgba(94, 234, 212,0.5)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                  <Car className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{v.model} {v.year}</p>
                  <p className="mono text-xs" style={{ color: "var(--solana-text-muted)" }}>{v.vin}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{v.color}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "#86EFAC" }}>
                  {v.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={onNext} disabled={!selectedVehicle} className="glow-btn w-full mt-4 disabled:opacity-40">
        Lanjut: Verifikasi Penjualan
      </button>
    </motion.div>
  );
}
