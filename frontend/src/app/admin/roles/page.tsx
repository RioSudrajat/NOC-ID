"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Shield, ShieldAlert, CheckCircle2, XCircle, MoreHorizontal, X } from "lucide-react";
import { useAdmin, type PlatformRole } from "@/context/AdminContext";
import { useToast } from "@/components/ui/Toast";

const roleColors: Record<PlatformRole, string> = {
  superadmin: "#EF4444",
  admin: "#F97316",
  enterprise: "var(--solana-purple)",
  workshop: "var(--solana-green)",
  user: "var(--solana-cyan)",
};

const statusColors: Record<string, { color: string; bg: string }> = {
  active: { color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  suspended: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  pending: { color: "#FACC15", bg: "rgba(250,204,21,0.15)" },
};

export default function AdminRolesPage() {
  const admin = useAdmin();
  const { showToast } = useToast();
  const wallets = admin?.whitelistedWallets || [];

  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const [newRole, setNewRole] = useState<PlatformRole>("user");
  const [newEntity, setNewEntity] = useState("");

  const filtered = wallets.filter(w => {
    if (filter !== "all" && w.role !== filter) return false;
    if (searchQuery && !w.wallet.toLowerCase().includes(searchQuery.toLowerCase()) && !w.entityName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAdd = () => {
    if (!newWallet.trim()) return;
    admin?.addWallet(newWallet.trim(), newRole, newEntity.trim() || undefined);
    showToast("success", "Wallet Added", `${newWallet.slice(0, 8)}... added as ${newRole}`);
    setNewWallet(""); setNewEntity(""); setNewRole("user"); setShowAddModal(false);
  };

  const handleSuspend = (wallet: string) => {
    admin?.suspendWallet(wallet);
    showToast("error", "Wallet Suspended", `${wallet.slice(0, 8)}... has been suspended.`);
  };

  const handleActivate = (wallet: string) => {
    admin?.activateWallet(wallet);
    showToast("success", "Wallet Activated", `${wallet.slice(0, 8)}... has been activated.`);
  };

  const handleRemove = (wallet: string) => {
    admin?.removeWallet(wallet);
    showToast("error", "Wallet Removed", `${wallet.slice(0, 8)}... removed from whitelist.`);
  };

  const handleRoleChange = (wallet: string, role: PlatformRole) => {
    admin?.updateRole(wallet, role);
    showToast("success", "Role Updated", `${wallet.slice(0, 8)}... is now ${role}.`);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Users className="w-7 h-7" style={{ color: "#F97316" }} />
            Users & Roles
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Wallet-based Role & Access Management</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="text-sm flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors" style={{ background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}>
          <Plus className="w-4 h-4" /> Add Wallet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {(["superadmin", "admin", "enterprise", "workshop", "user"] as PlatformRole[]).map(role => (
          <motion.div key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl text-center">
            <Shield className="w-5 h-5 mx-auto mb-2" style={{ color: roleColors[role] }} />
            <p className="text-2xl font-bold">{wallets.filter(w => w.role === role).length}</p>
            <p className="text-[11px] capitalize" style={{ color: "var(--solana-text-muted)" }}>{role}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {["all", "superadmin", "admin", "enterprise", "workshop", "user"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap" style={{ background: filter === f ? "rgba(249,115,22,0.2)" : "transparent", color: filter === f ? "#F97316" : "var(--solana-text-muted)" }}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search wallet or entity..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">Wallet Address</th>
              <th className="py-4 px-6 font-medium">Role</th>
              <th className="py-4 px-6 font-medium">Entity Name</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Registered</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.map(w => {
                const sc = statusColors[w.status] || statusColors.active;
                return (
                  <motion.tr key={w.wallet} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 mono text-xs" style={{ color: "#F97316" }}>{w.wallet}</td>
                    <td className="py-4 px-6">
                      <select value={w.role} onChange={e => handleRoleChange(w.wallet, e.target.value as PlatformRole)} className="bg-transparent text-xs px-2 py-1 rounded-lg font-semibold capitalize cursor-pointer" style={{ color: roleColors[w.role], border: `1px solid ${roleColors[w.role]}40` }}>
                        {(["user", "workshop", "enterprise", "admin", "superadmin"] as PlatformRole[]).map(r => (
                          <option key={r} value={r} className="bg-gray-900">{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6 font-medium">{w.entityName || "—"}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize" style={{ background: sc.bg, color: sc.color }}>{w.status}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-xs">{w.registeredAt.split("T")[0]}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {w.status === "active" ? (
                          <button onClick={() => handleSuspend(w.wallet)} className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Suspend</button>
                        ) : (
                          <button onClick={() => handleActivate(w.wallet)} className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Activate</button>
                        )}
                        <button onClick={() => handleRemove(w.wallet)} className="px-2 py-1 rounded text-xs bg-white/5 text-gray-400 hover:bg-white/10 transition-colors">Remove</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No wallets match the filter.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-8 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Add Wallet</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--solana-text-muted)" }}>Wallet Address</label>
                  <input type="text" value={newWallet} onChange={e => setNewWallet(e.target.value)} placeholder="Enter Solana wallet address..." className="input-field w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--solana-text-muted)" }}>Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as PlatformRole)} className="input-field w-full text-sm bg-transparent">
                    {(["user", "workshop", "enterprise", "admin"] as PlatformRole[]).map(r => (
                      <option key={r} value={r} className="bg-gray-900 capitalize">{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--solana-text-muted)" }}>Entity Name (optional)</label>
                  <input type="text" value={newEntity} onChange={e => setNewEntity(e.target.value)} placeholder="e.g. PT Astra Manufacturing" className="input-field w-full text-sm" />
                </div>
                <button onClick={handleAdd} className="mt-2 w-full py-3 rounded-xl font-semibold text-sm text-white transition-colors" style={{ background: "#F97316" }}>
                  Add to Whitelist
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
