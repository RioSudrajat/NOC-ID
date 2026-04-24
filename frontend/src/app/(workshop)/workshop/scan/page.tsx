"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Scan, Nfc, QrCode, CheckCircle2, Car, Shield, Clock, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { vehicleData, type VehicleKey } from "@/context/ActiveVehicleContext";

export default function ScanPage() {
  const router = useRouter();
  const bookingCtx = useBooking();
  const [scanMode, setScanMode] = useState<"nfc" | "qr">("nfc");
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  // Simulation vehicle picker — determines which vehicle's NFC/QR the scanner "sees".
  // This lets the same workshop demo independent concurrent sessions for different
  // vehicles without hardcoding a single VIN.
  const [simVehicleKey, setSimVehicleKey] = useState<VehicleKey>("avanza");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simVehicle = vehicleData[simVehicleKey];

  const handleAddToQueue = () => {
    bookingCtx?.createWalkinSession({
      vehicleKey: simVehicleKey,
      vehicleName: simVehicle.name,
      vin: simVehicle.vin,
      workshopName: "Bengkel Hendra Motor",
    });
    router.push("/workshop/queue");
  };

  // Start camera for QR mode
  useEffect(() => {
    if (scanMode === "qr" && !scanned && cameraActive) {
      let stream: MediaStream | null = null;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(() => { /* Camera not available — simulate mode active */ });
      return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
    }
  }, [scanMode, scanned, cameraActive]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Simulate successful scan from uploaded QR image
      setTimeout(() => setScanned(true), 800);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Scan Vehicle</h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Identify vehicle via NFC card or QR code</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setScanMode("nfc"); setScanned(false); setCameraActive(false); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer" style={{ background: scanMode === "nfc" ? "rgba(94, 234, 212,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${scanMode === "nfc" ? "var(--solana-purple)" : "rgba(94, 234, 212,0.2)"}`, color: scanMode === "nfc" ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
          <Nfc className="w-5 h-5" /> NFC Scan
        </button>
        <button onClick={() => { setScanMode("qr"); setScanned(false); setCameraActive(true); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer" style={{ background: scanMode === "qr" ? "rgba(94, 234, 212,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${scanMode === "qr" ? "var(--solana-green)" : "rgba(94, 234, 212,0.2)"}`, color: scanMode === "qr" ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
          <QrCode className="w-5 h-5" /> QR Scan
        </button>
      </div>

      {/* Simulation vehicle picker — only visible while awaiting scan */}
      {!scanned && (
        <div className="mb-8 p-4 rounded-xl border max-w-lg" style={{ background: "rgba(20,20,40,0.5)", borderColor: "rgba(94, 234, 212,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--solana-text-muted)" }}>Simulate Vehicle</label>
          </div>
          <select
            value={simVehicleKey}
            onChange={(e) => { setSimVehicleKey(e.target.value as VehicleKey); setScanned(false); }}
            className="w-full text-sm px-3 py-2 rounded-lg bg-black/30 text-white outline-none cursor-pointer"
            style={{ border: "1px solid rgba(94, 234, 212,0.2)" }}
          >
            {(Object.keys(vehicleData) as VehicleKey[]).map((k) => (
              <option key={k} value={k}>{vehicleData[k].name}</option>
            ))}
          </select>
          <p className="text-[11px] mt-2" style={{ color: "var(--solana-text-muted)" }}>
            Choose which vehicle&apos;s NFC/QR this simulated scan represents. Each vehicle keeps its own independent service queue.
          </p>
        </div>
      )}

      {!scanned ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 md:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto"
        >
          {scanMode === "nfc" ? (
            <>
              {/* NFC Scanner */}
              <div className="relative w-48 h-48 mb-8">
                <div className="absolute inset-0 rounded-2xl" style={{ border: "2px dashed rgba(94, 234, 212,0.3)" }} />
                <div className="absolute inset-0 rounded-2xl animate-pulse-glow" style={{ border: "2px solid var(--solana-purple)", opacity: 0.5 }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Nfc className="w-20 h-20 animate-pulse" style={{ color: "var(--solana-purple)" }} />
                </div>
                <motion.div className="absolute left-2 right-2 h-[2px]" style={{ background: "var(--solana-purple)", boxShadow: "0 0 10px var(--solana-purple)" }} animate={{ top: ["10%", "90%", "10%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hold NFC Card Near Device</h3>
              <p className="text-sm mb-6" style={{ color: "var(--solana-text-muted)" }}>Place the vehicle&apos;s NOC ID NFC card near your device&apos;s NFC reader</p>
              <button onClick={() => setScanned(true)} className="glow-btn flex items-center gap-2 cursor-pointer">
                <Scan className="w-5 h-5" /> Simulate NFC Scan
              </button>
            </>
          ) : (
            <>
              {/* QR Camera */}
              <div className="relative w-64 h-64 mb-6 rounded-2xl overflow-hidden" style={{ background: "#111", border: "2px solid rgba(94, 234, 212,0.3)" }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Overlay scanning frame */}
                <div className="absolute inset-4 rounded-xl" style={{ border: "2px solid rgba(94, 234, 212,0.5)" }} />
                <motion.div className="absolute left-4 right-4 h-[2px]" style={{ background: "var(--solana-green)", boxShadow: "0 0 10px var(--solana-green)" }} animate={{ top: ["15%", "85%", "15%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                {/* Corner marks */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: "var(--solana-green)" }} />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: "var(--solana-green)" }} />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: "var(--solana-green)" }} />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: "var(--solana-green)" }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scanning for QR Code...</h3>
              <p className="text-sm mb-6" style={{ color: "var(--solana-text-muted)" }}>Point the camera at the QR code on the vehicle owner&apos;s DApp</p>
              
              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={() => setScanned(true)} className="glow-btn flex-1 flex items-center justify-center gap-2 cursor-pointer">
                  <Scan className="w-5 h-5" /> Simulate Scan
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="glow-btn-outline flex-1 flex items-center justify-center gap-2 cursor-pointer" style={{ borderColor: "rgba(94, 234, 212,0.3)", color: "var(--solana-green)" }}>
                  <Upload className="w-4 h-4" /> Upload QR
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "#86EFAC" }} />
              <div>
                <p className="font-semibold" style={{ color: "#86EFAC" }}>Vehicle Identity Verified</p>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>On-chain ownership confirmed via Solana</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Vehicle</p><p className="font-semibold flex items-center gap-2"><Car className="w-4 h-4" style={{ color: "var(--solana-purple)" }} /> {simVehicle.name}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>VIN</p><p className="font-semibold mono text-sm">{simVehicle.vin}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>NOC ID</p><p className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: "var(--solana-green)" }} /> #{simVehicleKey.toUpperCase().padEnd(5, "0").slice(0, 5)}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Health Score</p><p className="font-semibold text-xl" style={{ color: "#5EEAD4" }}>{simVehicle.health}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Mileage</p><p className="font-semibold mono">{simVehicle.odometer}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Last Service</p><p className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} /> 2026-02-10</p></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a href={`/workshop/vehicle/${simVehicle.vin}`} className="flex-1 py-4 px-4 rounded-xl text-center font-medium transition-colors hover:bg-white/5" style={{ background: "rgba(20,20,40,0.5)", border: "1px solid rgba(94, 234, 212,0.2)", color: "var(--solana-purple)" }}>View Patient History</a>
              <button onClick={handleAddToQueue} className="glow-btn flex-1 text-center flex justify-center items-center py-4 cursor-pointer">Add to Active Queue</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
