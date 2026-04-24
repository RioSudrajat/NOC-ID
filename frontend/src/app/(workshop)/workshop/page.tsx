"use client";

import { motion } from "framer-motion";
import { Wrench, Star, Scan, FileText, TrendingUp, CheckCircle2, Clock, Box, ShieldCheck } from "lucide-react";
import Link from "next/link";

const recentScans = [
  { vin: "MHKA1BA1JFK000001", model: "Toyota Avanza 2025", owner: "0x7a3...1f4d", time: "2 hours ago", status: "Completed" },
  { vin: "MHKB2CC3JFK012345", model: "Honda Beat 2024", owner: "0x9b1...3e2a", time: "5 hours ago", status: "Completed" },
  { vin: "MHKD4EE5JFK098765", model: "Suzuki Ertiga 2025", owner: "0x4c8...7d9f", time: "Yesterday", status: "Completed" },
];

function ReputationScoreRing({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const maxScore = 5.0;
  const offset = circumference - (score / maxScore) * circumference;
  const color = score >= 4.5 ? "#86EFAC" : score >= 4.0 ? "#5EEAD4" : score >= 3.0 ? "#FCD34D" : score >= 2.0 ? "#5EEAD4" : "#FCA5A5";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(94, 234, 212,0.1)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center mt-1">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>Reputation</p>
      </div>
    </div>
  );
}

export default function WorkshopDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Workshop Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Bengkel Hendra Motor · Surabaya</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col items-center justify-center">
          <ReputationScoreRing score={4.8} />
          <p className="mt-3 text-sm font-semibold">Top Rated Workshop</p>
          <span className="badge badge-green mt-2">Verified Mechanic</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(94, 234, 212,0.12)" }}>
                 <Wrench className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Services This Month</p>
                <p className="text-2xl font-bold leading-tight">47</p>
              </div>
            </div>
            
            <div className="mt-5">
              <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--solana-text-muted)" }}>
                <span>Completion Rate</span>
                <span className="mono">98.7%</span>
              </div>
              <div className="w-full h-1.5 rounded-full relative" style={{ background: "rgba(94, 234, 212,0.15)" }}>
                <div className="h-1.5 rounded-full" style={{ width: "98.7%", background: "var(--solana-gradient)" }} />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t flex items-start gap-2" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
             <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--solana-green)" }} />
             <p className="text-[11px] leading-snug" style={{ color: "var(--solana-text-muted)" }}>
               <span style={{ color: "var(--solana-green)" }}>+12% higher</span> services compared to last month.
             </p>
          </div>
        </motion.div>

      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <Link href="/workshop/scan" className="glass-card p-6 flex flex-col items-center gap-4 group cursor-pointer text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(94, 234, 212,0.12)" }}>
            <Scan className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
          </div>
          <div>
            <h3 className="font-semibold mb-1 group-hover:text-white transition-colors">Scan Vehicle</h3>
            <p className="text-xs hidden sm:block" style={{ color: "var(--solana-text-muted)" }}>NFC or QR code</p>
          </div>
        </Link>
        <Link href="/workshop/viewer" className="glass-card p-6 flex flex-col items-center gap-4 group cursor-pointer text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(20,209,255,0.12)" }}>
            <Box className="w-6 h-6" style={{ color: "var(--solana-cyan)" }} />
          </div>
          <div>
            <h3 className="font-semibold mb-1 group-hover:text-white transition-colors">3D Digital Twin</h3>
            <p className="text-xs hidden sm:block" style={{ color: "var(--solana-text-muted)" }}>Mechanic Diagnostics</p>
          </div>
        </Link>
        <Link href="/workshop/verification" className="glass-card p-6 flex flex-col items-center gap-4 group cursor-pointer text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(94, 234, 212,0.12)" }}>
            <ShieldCheck className="w-6 h-6" style={{ color: "var(--solana-pink)" }} />
          </div>
          <div>
            <h3 className="font-semibold mb-1 group-hover:text-white transition-colors">Verify Part</h3>
            <p className="text-xs hidden sm:block" style={{ color: "var(--solana-text-muted)" }}>Check OEM Authencity</p>
          </div>
        </Link>
        <Link href="/workshop/maintenance" className="glass-card p-6 flex flex-col items-center gap-4 group cursor-pointer text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(94, 234, 212,0.12)" }}>
            <FileText className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
          </div>
          <div>
            <h3 className="font-semibold mb-1 group-hover:text-white transition-colors">Log Service</h3>
            <p className="text-xs hidden sm:block" style={{ color: "var(--solana-text-muted)" }}>On-chain submission</p>
          </div>
        </Link>
      </div>

      {/* Recent scans */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
          Recent Scans
        </h2>
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>VIN</th><th>Vehicle</th><th>Owner</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {recentScans.map((s, i) => (
                <tr key={i}>
                  <td className="mono text-sm">{s.vin}</td>
                  <td className="font-medium">{s.model}</td>
                  <td className="mono text-sm" style={{ color: "var(--solana-text-muted)" }}>{s.owner}</td>
                  <td style={{ color: "var(--solana-text-muted)" }}>{s.time}</td>
                  <td><span className="flex items-center gap-1 text-xs" style={{ color: "var(--solana-green)" }}><CheckCircle2 className="w-4 h-4" /> {s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
