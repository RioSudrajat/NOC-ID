"use client";

import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownLeft, Coins, TrendingUp, Lock, Gift } from "lucide-react";

const transactions = [
  { type: "earned", label: "Service Reward", amount: "+25", date: "2026-03-15", src: "Oil Change at Bengkel Hendra" },
  { type: "earned", label: "Service Reward", amount: "+30", date: "2026-03-01", src: "Full Inspection at Bengkel Jaya" },
  { type: "spent", label: "Priority Booking", amount: "-10", date: "2026-02-20", src: "Express lane at Bengkel Hendra" },
  { type: "earned", label: "Referral Bonus", amount: "+50", date: "2026-02-10", src: "Referred user 0x4c8...7d9f" },
  { type: "staked", label: "Staking Deposit", amount: "-500", date: "2026-01-15", src: "90-day staking pool" },
  { type: "earned", label: "Staking Yield", amount: "+12", date: "2026-03-10", src: "Monthly staking reward (APY 8%)" },
  { type: "earned", label: "Service Reward", amount: "+25", date: "2026-01-05", src: "Brake Pad Replacement" },
];

export default function WalletPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Wallet className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          $NOC Wallet
        </h1>
        <p>Manage your NOC tokens, staking, and rewards</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8" style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.15) 0%, rgba(20,241,149,0.08) 100%)", border: "1px solid rgba(153,69,255,0.3)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--solana-text-muted)" }}>Available Balance</span>
          </div>
          <p className="text-5xl font-bold gradient-text">1,248</p>
          <p className="text-sm mono mt-2" style={{ color: "var(--solana-text-muted)" }}>≈ $62.40 USD</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6" style={{ color: "var(--solana-purple)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--solana-text-muted)" }}>Staked</span>
          </div>
          <p className="text-5xl font-bold">500</p>
          <p className="text-sm mt-2" style={{ color: "var(--solana-green)" }}>APY 8% · 45 days left</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--solana-text-muted)" }}>Total Earned</span>
          </div>
          <p className="text-5xl font-bold">1,890</p>
          <p className="text-sm flex items-center gap-1 mt-2" style={{ color: "var(--solana-green)" }}><TrendingUp className="w-4 h-4" /> +142 this month</p>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-12">
        <button className="glow-btn text-base gap-2" style={{ padding: "14px 28px" }}><Lock className="w-5 h-5" /> Stake $NOC</button>
        <button className="glow-btn-outline text-base gap-2" style={{ padding: "14px 28px" }}><Gift className="w-5 h-5" /> Claim Rewards</button>
      </div>

      {/* Transaction history */}
      <h2 className="text-xl font-bold mb-6">Transaction History</h2>
      <div className="glass-card-static overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Type</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-2">
                    {tx.type === "earned" ? <ArrowDownLeft className="w-4 h-4" style={{ color: "var(--solana-green)" }} /> : tx.type === "staked" ? <Lock className="w-4 h-4" style={{ color: "var(--solana-purple)" }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "#F97316" }} />}
                    <span className="text-sm font-medium">{tx.label}</span>
                  </div>
                </td>
                <td><span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{tx.src}</span></td>
                <td><span className="mono font-bold" style={{ color: tx.amount.startsWith("+") ? "var(--solana-green)" : "var(--solana-text-muted)" }}>{tx.amount} $NOC</span></td>
                <td style={{ color: "var(--solana-text-muted)" }}>{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
