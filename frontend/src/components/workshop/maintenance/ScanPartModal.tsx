"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, ScanLine } from "lucide-react";

export interface ScanPartModalProps {
  open: boolean;
  scanning: boolean;
  onClose: () => void;
  onScan: () => void;
}

export default function ScanPartModal({ open, scanning, onClose, onScan }: ScanPartModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open && !scanning) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
        .catch(() => {/* Camera unavailable — simulate mode */});
    }
    return () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
  }, [open, scanning]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-8 max-w-md w-full flex flex-col items-center text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"><X className="w-5 h-5 text-white" /></button>
            <Camera className="w-8 h-8 mb-3" style={{ color: "var(--solana-cyan)" }} />
            <h3 className="text-lg font-bold mb-1">Scan Part Barcode</h3>
            <p className="text-xs mb-6" style={{ color: "var(--solana-text-muted)" }}>Point your camera at the part&apos;s barcode or QR to auto-verify from OEM NFT catalog</p>
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6" style={{ background: "#111", border: "2px solid rgba(94, 234, 212,0.3)" }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-6 rounded-xl" style={{ border: "2px solid rgba(94, 234, 212,0.4)" }} />
              <motion.div className="absolute left-6 right-6 h-[2px]" style={{ background: "var(--solana-cyan)", boxShadow: "0 0 10px rgba(94, 234, 212,0.8)" }} animate={{ top: ["20%", "80%", "20%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: "var(--solana-cyan)" }} />
              <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: "var(--solana-cyan)" }} />
              <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: "var(--solana-cyan)" }} />
              <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: "var(--solana-cyan)" }} />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <div className="flex items-center gap-3" style={{ color: "var(--solana-cyan)" }}><Loader2 className="w-6 h-6 animate-spin" /> Verifying on-chain...</div>
                </div>
              )}
            </div>
            <button onClick={onScan} disabled={scanning} className="glow-btn w-full gap-2 cursor-pointer disabled:opacity-50" style={{ padding: "14px 32px", background: "var(--solana-cyan)", color: "#0E0E1A" }}>
              {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><ScanLine className="w-5 h-5" /> Simulate Scan</>}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
