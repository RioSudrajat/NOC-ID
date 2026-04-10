"use client";

import { motion } from "framer-motion";
import { Shield, AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import type { ConfirmStepProps } from "./types";

export default function ConfirmStep({
  selectedVehicle, saleData, buyerData, buyerMode, transferring, onTransfer, onBack,
}: ConfirmStepProps) {
  const rows = [
    { label: "Kendaraan", value: `${selectedVehicle?.model} ${selectedVehicle?.year} — ${selectedVehicle?.color}` },
    { label: "VIN", value: selectedVehicle?.vin, mono: true },
    { label: "Invoice", value: saleData.invoice, mono: true },
    { label: "Harga Jual", value: `Rp ${Number(saleData.price).toLocaleString("id-ID")}` },
    { label: "Tanggal", value: saleData.date },
    { label: "Sales", value: saleData.salesperson },
    ...(buyerMode === "manual" ? [
      { label: "Pembeli", value: buyerData.name },
      { label: "Wallet Tujuan", value: buyerData.wallet, mono: true },
      { label: "NIK", value: buyerData.nik, mono: true },
    ] : [
      { label: "Mode Transfer", value: "QR Showroom (buyer self-claim)" },
    ]),
  ];

  return (
    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: "var(--solana-green)" }} />
          Konfirmasi Transfer
        </h2>
        <div className="space-y-3 mb-6">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{row.label}</span>
              <span className={`text-sm font-semibold max-w-[55%] text-right truncate ${row.mono ? "mono text-xs" : ""}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            Transfer NFT bersifat <strong>irreversible</strong>. Pastikan VIN dan alamat wallet pembeli sudah benar sebelum melanjutkan. Transaksi ini akan tercatat permanen di Solana blockchain.
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onBack} disabled={transferring} className="glow-btn-outline flex-1">Kembali</button>
        <button onClick={onTransfer} disabled={transferring} className="glow-btn flex-1 gap-2 disabled:opacity-60" style={{ background: transferring ? undefined : "linear-gradient(135deg, #86EFAC, #16A34A)" }}>
          {transferring ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses Transfer...</> : <><ArrowRightLeft className="w-4 h-4" /> Konfirmasi & Transfer NFT</>}
        </button>
      </div>
    </motion.div>
  );
}
