"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Scan, Nfc, QrCode, CheckCircle2, Car, Shield, Clock } from "lucide-react";

export default function ScanPage() {
  const [scanMode, setScanMode] = useState<"nfc" | "qr">("nfc");
  const [scanned, setScanned] = useState(false);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Scan Vehicle</h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Identify vehicle via NFC card or QR code</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => { setScanMode("nfc"); setScanned(false); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: scanMode === "nfc" ? "rgba(153,69,255,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${scanMode === "nfc" ? "var(--solana-purple)" : "rgba(153,69,255,0.2)"}`, color: scanMode === "nfc" ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
          <Nfc className="w-5 h-5" /> NFC Scan
        </button>
        <button onClick={() => { setScanMode("qr"); setScanned(false); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: scanMode === "qr" ? "rgba(20,241,149,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${scanMode === "qr" ? "var(--solana-green)" : "rgba(153,69,255,0.2)"}`, color: scanMode === "qr" ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
          <QrCode className="w-5 h-5" /> QR Code
        </button>
      </div>

      {!scanned ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto"
        >
          {/* Scanner animation */}
          <div className="relative w-48 h-48 mb-8">
            <div className="absolute inset-0 rounded-2xl" style={{ border: "2px dashed rgba(153,69,255,0.3)" }} />
            <div className="absolute inset-0 rounded-2xl animate-pulse-glow" style={{ border: `2px solid ${scanMode === "nfc" ? "var(--solana-purple)" : "var(--solana-green)"}`, opacity: 0.5 }} />
            <div className="absolute inset-0 flex items-center justify-center">
              {scanMode === "nfc" ? (
                <Nfc className="w-20 h-20 animate-pulse" style={{ color: "var(--solana-purple)" }} />
              ) : (
                <QrCode className="w-20 h-20 animate-pulse" style={{ color: "var(--solana-green)" }} />
              )}
            </div>
            {/* Scanning line */}
            <motion.div
              className="absolute left-2 right-2 h-[2px]"
              style={{ background: scanMode === "nfc" ? "var(--solana-purple)" : "var(--solana-green)", boxShadow: `0 0 10px ${scanMode === "nfc" ? "var(--solana-purple)" : "var(--solana-green)"}` }}
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <h3 className="text-xl font-semibold mb-2">
            {scanMode === "nfc" ? "Hold NFC Card Near Device" : "Point Camera at QR Code"}
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--solana-text-muted)" }}>
            {scanMode === "nfc" ? "Place the vehicle's NOC ID NFC card near your device's NFC reader" : "Scan the dynamic QR code displayed on the vehicle owner's DApp"}
          </p>

          <button onClick={() => setScanned(true)} className="glow-btn flex items-center gap-2">
            <Scan className="w-5 h-5" /> Simulate Scan
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            {/* Success header */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "#22C55E" }} />
              <div>
                <p className="font-semibold" style={{ color: "#22C55E" }}>Vehicle Identity Verified</p>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>On-chain ownership confirmed via Solana</p>
              </div>
            </div>

            {/* Vehicle info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Vehicle</p>
                <p className="font-semibold flex items-center gap-2"><Car className="w-4 h-4" style={{ color: "var(--solana-purple)" }} /> Toyota Avanza 2025</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>VIN</p>
                <p className="font-semibold mono text-sm">MHKA1BA1JFK000001</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>NOC ID</p>
                <p className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: "var(--solana-green)" }} /> #00001</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Health Score</p>
                <p className="font-semibold text-xl" style={{ color: "#A3E635" }}>87</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Mileage</p>
                <p className="font-semibold mono">34,521 km</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Last Service</p>
                <p className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} /> 2026-02-10</p>
              </div>
            </div>

            <a href="/workshop/maintenance" className="glow-btn w-full text-center block">
              Proceed to Log Maintenance
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
