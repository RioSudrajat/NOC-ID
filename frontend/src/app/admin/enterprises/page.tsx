"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Search, CheckCircle2, XCircle, ShieldAlert, MoreHorizontal } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/components/ui/Toast";

export default function AdminEnterprisesPage() {
  const admin = useAdmin();
  const { showToast } = useToast();
  const wallets = admin?.whitelistedWallets || [];
  const [searchQuery, setSearchQuery] = useState("");

  const enterprises = useMemo(() => wallets.filter(w => w.role === "enterprise"), [wallets]);

  const filtered = useMemo(() => {
    if (!searchQuery) return enterprises;
    return enterprises.filter(e => e.entityName.toLowerCase().includes(searchQuery.toLowerCase()) || e.wallet.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [enterprises, searchQuery]);

  const activeCount = enterprises.filter(e => e.status === "active").length;
  const suspendedCount = enterprises.filter(e => e.status === "suspended").length;
  const pendingCount = enterprises.filter(e => e.status === "pending").length;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Building2 className="w-7 h-7" style={{ color: "#F97316" }} />
            Enterprises
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Manage enterprise accounts and access tiers.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Enterprises", value: enterprises.length, color: "#F97316", icon: Building2 },
          { label: "Active", value: activeCount, color: "#22C55E", icon: CheckCircle2 },
          { label: "Suspended", value: suspendedCount, color: "#EF4444", icon: XCircle },
          { label: "Pending", value: pendingCount, color: "#FACC15", icon: ShieldAlert },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or wallet..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">Name</th>
              <th className="py-4 px-6 font-medium">Wallet</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Plan Tier</th>
              <th className="py-4 px-6 font-medium">Registered</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(e => (
              <tr key={e.wallet} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-semibold">{e.entityName || "Unnamed"}</td>
                <td className="py-4 px-6 mono text-xs" style={{ color: "#F97316" }}>{e.wallet}</td>
                <td className="py-4 px-6">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize" style={{ background: e.status === "active" ? "rgba(34,197,94,0.15)" : e.status === "suspended" ? "rgba(239,68,68,0.15)" : "rgba(250,204,21,0.15)", color: e.status === "active" ? "#22C55E" : e.status === "suspended" ? "#EF4444" : "#FACC15" }}>
                    {e.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-300">Enterprise Tier</td>
                <td className="py-4 px-6 text-gray-400 text-xs">{e.registeredAt.split("T")[0]}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {e.status === "active" ? (
                      <button onClick={() => { admin?.suspendWallet(e.wallet); showToast("error", "Suspended", `${e.entityName} suspended.`); }} className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Suspend</button>
                    ) : (
                      <button onClick={() => { admin?.activateWallet(e.wallet); showToast("success", "Activated", `${e.entityName} activated.`); }} className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500"><Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No enterprises found.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
