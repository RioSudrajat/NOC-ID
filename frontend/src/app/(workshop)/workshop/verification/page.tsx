"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ScanLine, Search, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { useState } from "react";

type VerificationStatus = "idle" | "scanning" | "verified" | "fake" | "warning";

export default function WorkshopVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [serialNumber, setSerialNumber] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber) return;
    
    setStatus("scanning");
    setTimeout(() => {
      // Mock logic: starts with V = verified, F = fake, W = warning (recalled)
      if (serialNumber.toUpperCase().startsWith("F")) setStatus("fake");
      else if (serialNumber.toUpperCase().startsWith("W")) setStatus("warning");
      else setStatus("verified");
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="w-8 h-8" style={{ color: "var(--solana-pink)" }} />
          OEM Part Verification
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Scan or enter the part serial number to verify authenticity on-chain before installation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scanner / Input area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col justify-between">
          <div>
            <div className="w-full aspect-video rounded-xl mb-6 flex flex-col items-center justify-center border-2 border-dashed relative overflow-hidden" style={{ borderColor: "rgba(94, 234, 212,0.3)", background: "rgba(14,14,26,0.5)" }}>
              {status === "scanning" ? (
                <>
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-[var(--solana-cyan)] to-transparent absolute top-0 animate-scan" style={{ boxShadow: "0 0 15px var(--solana-cyan)" }} />
                  <ScanLine className="w-12 h-12 mb-3 animate-pulse" style={{ color: "var(--solana-cyan)" }} />
                  <p className="text-sm font-mono glow-text" style={{ color: "var(--solana-cyan)" }}>Verifying against Solana...</p>
                </>
              ) : (
                <>
                  <ScanLine className="w-12 h-12 mb-3" style={{ color: "var(--solana-text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Camera scanner inactive</p>
                  <button className="glow-btn-outline mt-4 px-4 py-2 text-xs">Enable Camera</button>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-full" style={{ background: "rgba(94, 234, 212,0.2)" }} />
              <span className="text-xs shrink-0" style={{ color: "var(--solana-text-muted)" }}>OR ENTER MANUALLY</span>
              <div className="h-px w-full" style={{ background: "rgba(94, 234, 212,0.2)" }} />
            </div>

            <form onSubmit={handleVerify} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
                <input
                  type="text"
                  placeholder="e.g. V-7892-XYZ (Try 'F...' or 'W...')"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-sm font-mono focus:outline-none focus:border-[var(--solana-purple)] transition-colors"
                  style={{ borderColor: "rgba(94, 234, 212,0.2)", color: "white" }}
                />
              </div>
              <button 
                type="submit" 
                disabled={!serialNumber || status === "scanning"}
                className={`glow-btn px-6 py-3 font-semibold ${(!serialNumber || status === "scanning") ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Verify
              </button>
            </form>
          </div>
        </motion.div>

        {/* Result Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col h-full">
          {status === "idle" && (
            <div className="glass-card p-8 flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <ShieldCheck className="w-16 h-16 mb-4" style={{ color: "var(--solana-text-muted)" }} />
              <h3 className="text-lg font-semibold mb-2">Awaiting Verification</h3>
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Scan an OEM part to view its authenticity record and specifications.</p>
            </div>
          )}

          {status === "scanning" && (
            <div className="glass-card p-8 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "rgba(20,209,255,0.2)", borderTopColor: "var(--solana-cyan)" }} />
              <h3 className="text-lg font-semibold mb-2">Querying Ledger...</h3>
              <p className="text-sm mono" style={{ color: "var(--solana-text-muted)" }}>Checking Merkle proofs for {serialNumber}</p>
            </div>
          )}

          {status === "verified" && (
            <div className="glass-card p-8 flex-1 border-2" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8" style={{ color: "var(--solana-green)" }} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "var(--solana-green)" }}>Verified Authentic</h3>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>On-chain record found</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Part Name</span>
                  <span className="font-semibold text-sm">Toyota Genuine Oil Filter</span>
                </div>
                <div className="flex justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Serial Number</span>
                  <span className="mono text-sm">{serialNumber.toUpperCase()}</span>
                </div>
                <div className="flex justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Manufacturer</span>
                  <span className="font-semibold text-sm">PT Toyota Motor Mfg</span>
                </div>
                <div className="flex justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Mint Date</span>
                  <span className="mono text-sm">2026-01-12</span>
                </div>
              </div>

              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Info className="w-5 h-5 shrink-0" style={{ color: "var(--solana-green)" }} />
                <p className="text-xs leading-relaxed text-teal-100">This part is authentic and has not been logged in any other vehicle instance. Safe to install.</p>
              </div>
            </div>
          )}

          {status === "fake" && (
            <div className="glass-card p-8 flex-1 border-2" style={{ borderColor: "rgba(239,68,68,0.5)" }}>
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="w-8 h-8" style={{ color: "#FCA5A5" }} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "#FCA5A5" }}>Counterfeit Warning</h3>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Verification Failed</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl flex items-start gap-3 mb-6" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#FCA5A5" }} />
                <p className="text-xs leading-relaxed text-red-200">The serial number <strong>{serialNumber.toUpperCase()}</strong> does not exist on the NOC ID registry. DO NOT INSTALL this part. Installing counterfeit parts voids warranties and lowers the vehicle's health score.</p>
              </div>

              <button className="w-full py-3 rounded-lg font-semibold text-sm cursor-pointer transition-colors" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                Report Counterfeit Source
              </button>
            </div>
          )}

          {status === "warning" && (
            <div className="glass-card p-8 flex-1 border-2" style={{ borderColor: "rgba(94, 234, 212,0.5)" }}>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-8 h-8" style={{ color: "#5EEAD4" }} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "#5EEAD4" }}>Recalled Part</h3>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Authentic but unsafe</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6 opacity-75">
                <div className="flex justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Part Name</span>
                  <span className="font-semibold text-sm">Takata Airbag Pre-tensioner</span>
                </div>
                <div className="flex justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Serial Number</span>
                  <span className="mono text-sm">{serialNumber.toUpperCase()}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(94, 234, 212,0.15)", border: "1px solid rgba(94, 234, 212,0.3)" }}>
                <Info className="w-5 h-5 shrink-0" style={{ color: "#5EEAD4" }} />
                <p className="text-xs leading-relaxed text-teal-200">This part is authentic but falls under OEM Recall Notice #RCL-2025-04. Return this part to the manufacturer distributor.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
