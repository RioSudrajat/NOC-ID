"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, Download, Users, Shield, Scale, Settings } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

const actionIcons: Record<string, React.ReactNode> = {
  role_change: <Users className="w-4 h-4 text-orange-400" />,
  kyc_approval: <Shield className="w-4 h-4 text-green-400" />,
  kyc_revoke: <Shield className="w-4 h-4 text-red-400" />,
  dispute_resolution: <Scale className="w-4 h-4 text-cyan-400" />,
  config_change: <Settings className="w-4 h-4 text-purple-400" />,
  wallet_whitelist: <Users className="w-4 h-4 text-yellow-400" />,
  wallet_suspend: <Users className="w-4 h-4 text-red-400" />,
  wallet_activate: <Users className="w-4 h-4 text-green-400" />,
  wallet_remove: <Users className="w-4 h-4 text-red-400" />,
};

export default function AdminAuditPage() {
  const admin = useAdmin();
  const auditLogs = admin?.auditLogs || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const actionTypes = useMemo(() => [...new Set(auditLogs.map(l => l.action))], [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter(log => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (searchQuery && !log.action.toLowerCase().includes(searchQuery.toLowerCase()) && !log.details.toLowerCase().includes(searchQuery.toLowerCase()) && !log.targetEntity.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <FileText className="w-7 h-7" style={{ color: "#F97316" }} />
            Audit Logs
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Complete audit trail of all admin actions — {auditLogs.length} entries.</p>
        </div>
        <button className="text-sm flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(249,115,22,0.1)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}>
          <Download className="w-4 h-4" /> Export JSON
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search action, details, or target..." className="input-field pl-9 text-sm w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select className="input-field pl-9 text-sm w-48 bg-transparent" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/20 border-b border-white/5">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="py-4 px-6 font-medium">Timestamp</th>
              <th className="py-4 px-6 font-medium">Admin</th>
              <th className="py-4 px-6 font-medium">Action</th>
              <th className="py-4 px-6 font-medium">Target</th>
              <th className="py-4 px-6 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((log) => (
              <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 mono text-xs text-gray-400">{log.timestamp.replace("T", " ").slice(0, 19)}</td>
                <td className="py-4 px-6 mono text-xs" style={{ color: "#F97316" }}>{log.adminWallet.slice(0, 8)}...</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {actionIcons[log.action] || <FileText className="w-4 h-4 text-gray-400" />}
                    <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-300 text-xs">{log.targetEntity}</td>
                <td className="py-4 px-6 text-gray-400 text-xs max-w-xs truncate">{log.details}</td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No audit log entries match the filter.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
