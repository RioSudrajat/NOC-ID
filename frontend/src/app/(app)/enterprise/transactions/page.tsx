"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, DollarSign, Fuel, CreditCard, Search, Filter, ChevronDown, ChevronUp, ExternalLink, Hash } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";
import { api, type ApiTxReceipt } from "@/lib/api/client";

type TxType = "payment" | "mint" | "anchor" | "transfer" | "passport";

interface Transaction {
  id: string;
  txSig: string;
  type: TxType;
  from: string;
  to: string;
  amount: number;
  currency: string;
  gasFee: number;
  status: "confirmed" | "pending";
  timestamp: string;
  bookingId?: string;
  serviceType?: string;
}

const typeColors: Record<TxType, string> = {
  payment: "var(--solana-green)",
  mint: "var(--solana-purple)",
  anchor: "var(--solana-cyan)",
  transfer: "#FCD34D",
  passport: "#5EEAD4",
};

function mapReceiptType(raw?: Record<string, unknown> | null): TxType {
  const action = String(raw?.action ?? "");
  if (action.includes("mint")) return "mint";
  if (action.includes("transfer")) return "transfer";
  if (action.includes("passport") || action.includes("metadata")) return "passport";
  if (action.includes("service_log")) return "anchor";
  return "payment";
}

function short(signature: string) {
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
}

export default function EnterpriseTxPage() {
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;
  const completed = m?.completedBookings || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ApiTxReceipt[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.transactions({ take: 100 }).then((response) => {
      if (!cancelled) setReceipts(response.items);
    }).catch(() => {
      if (!cancelled) setReceipts([]);
    });
    return () => { cancelled = true; };
  }, []);

  // Build transactions from completed bookings
  const transactions: Transaction[] = useMemo(() => {
    const completedTxs = completed.map((cb): Transaction => ({
      id: cb.id,
      txSig: cb.txSig,
      type: "payment",
      from: "User Wallet",
      to: cb.workshopName,
      amount: cb.totalIDR,
      currency: "IDR",
      gasFee: cb.gasFee,
      status: "confirmed",
      timestamp: cb.completedAt,
      bookingId: cb.bookingId,
      serviceType: cb.serviceType,
    }));
    const receiptTxs = receipts.map((receipt): Transaction => ({
      id: receipt.id,
      txSig: receipt.signature,
      type: mapReceiptType(receipt.raw),
      from: String(receipt.raw?.feePayer ?? receipt.raw?.signerWallet ?? receipt.raw?.enterpriseAuthorityWallet ?? "Wallet"),
      to: String(receipt.raw?.vehicleId ?? receipt.raw?.serviceLogId ?? receipt.raw?.newOwnerWallet ?? receipt.programId ?? "NOC ID"),
      amount: 0,
      currency: "SOL",
      gasFee: Number(receipt.raw?.feeLamports ?? 0),
      status: receipt.confirmationStatus === "CONFIRMED" ? "confirmed" : "pending",
      timestamp: receipt.createdAt,
      bookingId: typeof receipt.raw?.bookingId === "string" ? receipt.raw.bookingId : undefined,
      serviceType: String(receipt.raw?.action ?? "onchain"),
    }));
    const seen = new Set<string>();
    return [...receiptTxs, ...completedTxs].filter((tx) => {
      if (seen.has(tx.txSig)) return false;
      seen.add(tx.txSig);
      return true;
    });
  }, [completed, receipts]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (searchQuery && !tx.txSig.toLowerCase().includes(searchQuery.toLowerCase()) && !tx.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (typeFilter && tx.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, searchQuery, typeFilter]);

  const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
  const totalGas = transactions.reduce((s, t) => s + t.gasFee, 0);
  const avgGas = transactions.length > 0 ? Math.round(totalGas / transactions.length) : 0;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="page-header mb-0">
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Receipt className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
            Transactions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>On-chain transaction monitoring for enterprise scope.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: DollarSign, label: "Total Volume", value: `Rp ${totalVolume.toLocaleString('id-ID')}`, color: "var(--solana-green)" },
          { icon: Hash, label: "Total Transactions", value: transactions.length.toString(), color: "var(--solana-purple)" },
          { icon: Fuel, label: "Avg Gas Fee", value: `Rp ${avgGas.toLocaleString("id-ID")}`, color: "var(--solana-cyan)" },
          { icon: CreditCard, label: "Payment Method", value: "IDR → Solana", color: "#FCD34D" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl">
            <s.icon className="w-6 h-6 mb-3" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search TX ID or signature..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select className="input-field pl-9 text-sm w-44 appearance-none bg-transparent" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="payment">Payment</option>
            <option value="mint">Mint</option>
            <option value="anchor">Anchor</option>
            <option value="transfer">Transfer</option>
            <option value="passport">Passport Update</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">TX ID</th>
              <th className="py-4 px-6 font-medium">Type</th>
              <th className="py-4 px-6 font-medium">From</th>
              <th className="py-4 px-6 font-medium">To</th>
              <th className="py-4 px-6 font-medium">Amount</th>
              <th className="py-4 px-6 font-medium">Gas Fee</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.length > 0 ? filtered.map((tx) => (
                <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === tx.id ? null : tx.id)}>
                  <td className="py-4 px-6">
                    <a href={`https://explorer.solana.com/tx/${tx.txSig}?cluster=devnet`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mono text-xs text-teal-400 inline-flex items-center gap-1 hover:underline">
                      {short(tx.txSig)} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: `${typeColors[tx.type]}15`, color: typeColors[tx.type], border: `1px solid ${typeColors[tx.type]}40` }}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-xs">{tx.from}</td>
                  <td className="py-4 px-6 text-gray-400 text-xs">{tx.to}</td>
                  <td className="py-4 px-6 font-bold mono">Rp {tx.amount.toLocaleString("id-ID")}</td>
                  <td className="py-4 px-6 text-gray-400 mono text-xs">Rp {tx.gasFee.toLocaleString("id-ID")}</td>
                  <td className="py-4 px-6">
                    <span className="text-xs px-2 py-1 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">confirmed</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {expandedRow === tx.id ? <ChevronUp className="w-4 h-4 text-gray-400 inline" /> : <ChevronDown className="w-4 h-4 text-gray-400 inline" />}
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada transaksi. Selesaikan booking untuk melihat data.</p>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
