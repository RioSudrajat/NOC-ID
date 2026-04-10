"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText } from "lucide-react";
import type { TransferCompleteProps } from "./types";

export default function TransferComplete({
  selectedVehicle, saleData, buyerData, txSig, onReset,
}: TransferCompleteProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 rounded-3xl text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(34,197,94,0.15)" }}>
          <CheckCircle2 className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Transfer Successful</h2>
        <p className="text-sm mb-6" style={{ color: "var(--solana-text-muted)" }}>
          Vehicle NFT has been transferred on Solana. The buyer can now view their vehicle in NOC ID dApp.
        </p>

        <div className="glass-card-static rounded-2xl p-6 text-left mb-6 space-y-3">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
            Vehicle Digital Certificate
          </h3>
          {[
            { label: "VIN", value: selectedVehicle?.vin, mono: true },
            { label: "Model", value: `${selectedVehicle?.model} ${selectedVehicle?.year}` },
            { label: "Owner", value: buyerData.name },
            { label: "Wallet", value: buyerData.wallet, mono: true, xs: true },
            { label: "Sale Price", value: `Rp ${Number(saleData.price).toLocaleString("id-ID")}` },
            { label: "Invoice", value: saleData.invoice, mono: true },
            { label: "Tx Signature", value: txSig, mono: true, xs: true, cyan: true },
            { label: "Network Fee", value: "~0.00001 SOL" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span style={{ color: "var(--solana-text-muted)" }}>{row.label}</span>
              <span className={`font-semibold ${row.mono ? "mono" : ""} ${row.xs ? "text-xs" : ""}`} style={row.cyan ? { color: "var(--solana-cyan, #2DD4BF)" } : undefined}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <button onClick={onReset} className="glow-btn w-full">
          Transfer Another Vehicle
        </button>
      </motion.div>
    </div>
  );
}
