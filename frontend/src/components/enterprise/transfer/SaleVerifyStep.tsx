"use client";

import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import type { SaleVerifyStepProps } from "./types";

export default function SaleVerifyStep({
  selectedVehicle, saleData, onSaleDataChange, onBack, onNext,
}: SaleVerifyStepProps) {
  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" style={{ color: "var(--solana-cyan, #2DD4BF)" }} />
          Verifikasi Data Penjualan
        </h2>
        <p className="text-xs mb-5" style={{ color: "var(--solana-text-muted)" }}>
          Kendaraan: <span className="font-semibold text-white">{selectedVehicle?.model} {selectedVehicle?.year}</span>
          <span className="mono ml-2" style={{ color: "var(--solana-text-muted)" }}>({selectedVehicle?.vin})</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Nomor Invoice</label>
            <input type="text" className="input-field mono" placeholder="INV-2026-XXXXX" value={saleData.invoice} onChange={e => onSaleDataChange(s => ({ ...s, invoice: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Harga Jual (Rp)</label>
            <input type="number" className="input-field mono" placeholder="e.g. 280000000" value={saleData.price} onChange={e => onSaleDataChange(s => ({ ...s, price: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Tanggal Penjualan</label>
            <input type="date" className="input-field" value={saleData.date} onChange={e => onSaleDataChange(s => ({ ...s, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Nama Sales</label>
            <input type="text" className="input-field" placeholder="e.g. Budi Santoso" value={saleData.salesperson} onChange={e => onSaleDataChange(s => ({ ...s, salesperson: e.target.value }))} />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onBack} className="glow-btn-outline flex-1">Kembali</button>
        <button onClick={onNext} disabled={!saleData.invoice || !saleData.price || !saleData.date || !saleData.salesperson} className="glow-btn flex-1 disabled:opacity-40">
          Lanjut: Data Pembeli
        </button>
      </div>
    </motion.div>
  );
}
