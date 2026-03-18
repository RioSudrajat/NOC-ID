"use client";

import { motion } from "framer-motion";
import { Wrench, Coins, Star, Scan, FileText, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

const recentScans = [
  { vin: "MHKA1BA1JFK000001", model: "Toyota Avanza 2025", owner: "0x7a3...1f4d", time: "2 hours ago", status: "Completed" },
  { vin: "MHKB2CC3JFK012345", model: "Honda Beat 2024", owner: "0x9b1...3e2a", time: "5 hours ago", status: "Completed" },
  { vin: "MHKD4EE5JFK098765", model: "Suzuki Ertiga 2025", owner: "0x4c8...7d9f", time: "Yesterday", status: "Completed" },
];

export default function WorkshopDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Workshop Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Bengkel Hendra Motor · Surabaya</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { icon: Wrench, label: "Services This Month", value: "47", change: "+12%", color: "var(--solana-purple)" },
          { icon: Coins, label: "$NOC Earned", value: "3,248", change: "+8%", color: "var(--solana-green)" },
          { icon: Star, label: "Reputation Score", value: "4.8", change: "+0.1", color: "#FACC15" },
          { icon: TrendingUp, label: "Completion Rate", value: "98.7%", change: "+1.2%", color: "var(--solana-green)" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{stat.label}</p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <span className="text-xs" style={{ color: "var(--solana-green)" }}>{stat.change} from last month</span>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Link href="/workshop/scan" className="glass-card p-8 flex items-center gap-6 group cursor-pointer">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(153,69,255,0.12)" }}>
            <Scan className="w-8 h-8" style={{ color: "var(--solana-purple)" }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1 group-hover:text-white transition-colors">Scan Vehicle</h3>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Scan NFC card or QR code to start service</p>
          </div>
        </Link>
        <Link href="/workshop/maintenance" className="glass-card p-8 flex items-center gap-6 group cursor-pointer">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(20,241,149,0.12)" }}>
            <FileText className="w-8 h-8" style={{ color: "var(--solana-green)" }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1 group-hover:text-white transition-colors">Log Maintenance</h3>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Record service details and submit on-chain</p>
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
