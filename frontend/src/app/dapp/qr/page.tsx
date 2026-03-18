"use client";

import { useState } from "react";
import { Scan, Copy, Download, Clock, Shield, CheckCircle2 } from "lucide-react";

export default function QRPage() {
  const [copied, setCopied] = useState(false);
  const [timeLimit, setTimeLimit] = useState(true);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Scan className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          QR Code
        </h1>
        <p>Share vehicle identity securely with workshops</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* QR Code display */}
        <div className="glass-card-static p-10 flex flex-col items-center text-center">
          {/* Mock QR */}
          <div className="w-64 h-64 rounded-2xl mb-6 flex items-center justify-center relative" style={{ background: "white", padding: 16 }}>
            <div className="w-full h-full" style={{ background: `repeating-conic-gradient(#0E0E1A 0% 25%, transparent 0% 50%) 50% / 20px 20px`, borderRadius: 8 }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <p className="text-xs mono mb-4" style={{ color: "var(--solana-text-muted)" }}>NOC ID #00001 · Toyota Avanza 2025</p>

          {timeLimit && (
            <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: "rgba(20,241,149,0.08)", border: "1px solid rgba(20,241,149,0.2)" }}>
              <Clock className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--solana-green)" }}>Expires in 4:59</span>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button onClick={handleCopy} className="glow-btn-outline flex-1 gap-2 text-sm" style={{ padding: "10px 16px" }}>
              {copied ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
            </button>
            <button className="glow-btn flex-1 gap-2 text-sm" style={{ padding: "10px 16px" }}>
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-8">
          <div className="glass-card-static p-8">
            <h3 className="text-base font-semibold mb-6">QR Settings</h3>
            <div className="flex items-center justify-between mb-4 p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
              <div>
                <p className="text-sm font-medium">Time-limited Code</p>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>QR expires after 5 minutes for security</p>
              </div>
              <button onClick={() => setTimeLimit(!timeLimit)} className="w-12 h-6 rounded-full transition-all relative" style={{ background: timeLimit ? "var(--solana-green)" : "rgba(148,163,184,0.3)" }}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: timeLimit ? 26 : 2 }} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}>
              <div>
                <p className="text-sm font-medium">Include Service History</p>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Let workshop see full maintenance records</p>
              </div>
              <button className="w-12 h-6 rounded-full transition-all relative" style={{ background: "var(--solana-green)" }}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5" style={{ left: 26 }} />
              </button>
            </div>
          </div>

          {/* Vehicle card */}
          <div className="glass-card-static p-8">
            <h3 className="text-base font-semibold mb-6">Vehicle Identity Card</h3>
            <div className="p-5 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.12) 0%, rgba(20,241,149,0.06) 100%)", border: "1px solid rgba(153,69,255,0.2)" }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg font-bold">Toyota Avanza 2025</p>
                  <p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>VIN: MHKA1BA1JFK000001</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>NOC ID</p>
                  <p className="font-semibold mono text-sm">#00001</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health</p>
                  <p className="font-semibold text-sm" style={{ color: "#A3E635" }}>87</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Services</p>
                  <p className="font-semibold text-sm">12</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
