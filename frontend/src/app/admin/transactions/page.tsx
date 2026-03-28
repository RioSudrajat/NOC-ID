"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Receipt, DollarSign, Fuel, Hash, Search, Filter, AlertTriangle } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";

export default function AdminTransactionsPage() {
  const enterprise = useEnterprise();
  const completed = enterprise?.metrics.completedBookings || [];
  const [searchQuery, setSearchQuery] = useState("");

  const transactions = useMemo(() => {
    return completed.map(cb => ({
      id: cb.id,
      txSig: cb.txSig,
      type: "payment" as const,
      from: "User Wallet",
      to: cb.workshopName,
      amount: cb.totalIDR,
      gasFee: cb.gasFee,
      timestamp: cb.completedAt,
    }));
  }, [completed]);

  const filtered = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(tx => tx.txSig.includes(searchQuery) || tx.id.includes(searchQuery) || tx.to.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [transactions, searchQuery]);

  const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
  const totalGas = transactions.reduce((s, t) => s + t.gasFee, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
          <Receipt className="w-7 h-7" style={{ color: "#F97316" }} />
          Platform Transactions
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Platform-wide on-chain activity monitoring.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: "Total Volume", value: `Rp ${(totalVolume / 1_000_000).toFixed(1)}M`, color: "var(--solana-green)" },
          { icon: Hash, label: "Total TXs", value: transactions.length.toString(), color: "#F97316" },
          { icon: Fuel, label: "Total Gas", value: `Rp ${(totalGas / 1000).toFixed(0)}K`, color: "var(--solana-cyan)" },
          { icon: AlertTriangle, label: "Anomalies", value: "0", color: "#EF4444" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search TX ID or workshop..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">TX Sig</th>
              <th className="py-4 px-6 font-medium">Type</th>
              <th className="py-4 px-6 font-medium">From</th>
              <th className="py-4 px-6 font-medium">To</th>
              <th className="py-4 px-6 font-medium">Amount</th>
              <th className="py-4 px-6 font-medium">Gas</th>
              <th className="py-4 px-6 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(tx => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 mono text-xs" style={{ color: "#F97316" }}>{tx.txSig}</td>
                <td className="py-4 px-6"><span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-400">payment</span></td>
                <td className="py-4 px-6 text-gray-400 text-xs">{tx.from}</td>
                <td className="py-4 px-6 text-gray-400 text-xs">{tx.to}</td>
                <td className="py-4 px-6 font-bold mono">Rp {tx.amount.toLocaleString("id-ID")}</td>
                <td className="py-4 px-6 text-gray-400 mono text-xs">Rp {tx.gasFee.toLocaleString("id-ID")}</td>
                <td className="py-4 px-6 text-gray-400 text-xs">{tx.timestamp.split("T")[0]}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500"><Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No transactions yet.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
