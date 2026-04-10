"use client";

import { motion } from "framer-motion";
import { User, Wallet, QrCode, Shield, Sparkles } from "lucide-react";
import type { BuyerInfoStepProps } from "./types";

export default function BuyerInfoStep({
  selectedVehicle, saleData, buyerData, onBuyerDataChange, buyerMode, onBuyerModeChange, onSimulateMockBuyer, onBack, onNext,
}: BuyerInfoStepProps) {
  return (
    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" style={{ color: "#FCD34D" }} />
          Data Pembeli & Wallet
        </h2>

        <div className="mb-4">
          <button onClick={onSimulateMockBuyer} className="glow-btn-outline gap-2 text-xs px-3 py-1.5" style={{ borderColor: "rgba(250,204,21,0.4)", color: "#FCD34D" }}>
            <Sparkles className="w-3.5 h-3.5" /> Simulate Mock Buyer
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          <button onClick={() => onBuyerModeChange("manual")} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: buyerMode === "manual" ? "rgba(94, 234, 212,0.2)" : "transparent", color: buyerMode === "manual" ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
            <Wallet className="w-4 h-4" /> Input Manual
          </button>
          <button onClick={() => onBuyerModeChange("qr")} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: buyerMode === "qr" ? "rgba(94, 234, 212,0.2)" : "transparent", color: buyerMode === "qr" ? "var(--solana-cyan, #2DD4BF)" : "var(--solana-text-muted)" }}>
            <QrCode className="w-4 h-4" /> Generate QR Showroom
          </button>
        </div>

        {buyerMode === "manual" ? (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Nama Pembeli</label>
              <input type="text" className="input-field" placeholder="e.g. John Doe" value={buyerData.name} onChange={e => onBuyerDataChange(b => ({ ...b, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Solana Wallet Address</label>
              <input type="text" className="input-field mono" placeholder="e.g. 5YNmS1R5yjLezYF..." value={buyerData.wallet} onChange={e => onBuyerDataChange(b => ({ ...b, wallet: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>Alamat wallet Phantom / Solflare pembeli</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>NIK / ID Pembeli</label>
              <input type="text" className="input-field mono" placeholder="16 digit NIK" maxLength={16} value={buyerData.nik} onChange={e => onBuyerDataChange(b => ({ ...b, nik: e.target.value }))} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 gap-5">
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl p-3 flex items-center justify-center" style={{ background: "white" }}>
                <div className="grid grid-cols-7 gap-0.5 w-full h-full">
                  {Array.from({ length: 49 }).map((_, idx) => {
                    const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
                    const inner = [8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30,31,32,33,36,37,38,39,40];
                    return (
                      <div key={idx} className="rounded-sm" style={{ background: corners.includes(idx) ? "#1a1a2e" : inner.includes(idx) && idx % 3 !== 0 ? "#1a1a2e" : "transparent" }} />
                    );
                  })}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1">Scan untuk Claim NFT</p>
              <p className="text-xs max-w-xs" style={{ color: "var(--solana-text-muted)" }}>
                Tampilkan QR code ini ke pembeli. Mereka scan menggunakan Phantom atau Solflare, connect wallet, lalu approve transfer.
              </p>
            </div>
            <div className="glass-card-static rounded-xl p-3 w-full text-center">
              <p className="mono text-xs" style={{ color: "var(--solana-cyan, #2DD4BF)" }}>
                nocid.app/claim/{selectedVehicle?.vin}?sale={saleData.invoice}
              </p>
            </div>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
              QR expires in <strong className="text-white">30 minutes</strong>. Data pembeli akan otomatis ter-capture saat mereka approve.
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onBack} className="glow-btn-outline flex-1">Kembali</button>
        <button onClick={onNext} disabled={buyerMode === "manual" && (!buyerData.name || !buyerData.wallet)} className="glow-btn flex-1 disabled:opacity-40">
          Lanjut: Konfirmasi
        </button>
      </div>
    </motion.div>
  );
}
