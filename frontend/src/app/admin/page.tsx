"use client";

import { motion } from "framer-motion";
import { Car, Wrench, Users, Receipt, Scale, Activity, TrendingUp, Shield, CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { useEnterprise } from "@/context/EnterpriseContext";

export default function AdminDashboard() {
  const admin = useAdmin();
  const enterprise = useEnterprise();
  const m = enterprise?.metrics;

  const wallets = admin?.whitelistedWallets || [];
  const disputes = admin?.disputes || [];
  const auditLogs = admin?.auditLogs || [];

  const totalUsers = wallets.filter(w => w.role === "user").length;
  const totalWorkshops = wallets.filter(w => w.role === "workshop").length;
  const totalEnterprises = wallets.filter(w => w.role === "enterprise").length;
  const activeDisputes = disputes.filter(d => d.status === "open" || d.status === "investigating").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Platform Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>NOC ID — Superadmin Overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { icon: Car, label: "Registered Vehicles", value: m?.totalVehicles || 0, color: "var(--solana-purple)" },
          { icon: Wrench, label: "Active Workshops", value: totalWorkshops, color: "var(--solana-green)" },
          { icon: Users, label: "Total Users", value: totalUsers, color: "var(--solana-cyan)" },
          { icon: Receipt, label: "On-Chain TXs", value: m?.totalCompletedServices || 0, color: "#FACC15" },
          { icon: TrendingUp, label: "Platform Revenue", value: `Rp ${((m?.totalRevenue || 0) / 1000).toFixed(0)}K`, color: "#F97316" },
          { icon: Scale, label: "Active Disputes", value: activeDisputes, color: "#EF4444" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 rounded-2xl">
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--solana-text-muted)" }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Entity Distribution */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-6">Entity Distribution</h2>
          <div className="flex items-center gap-8 justify-center py-4">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                {(() => {
                  const total = totalUsers + totalWorkshops + totalEnterprises || 1;
                  const userPct = (totalUsers / total) * 100;
                  const wsPct = (totalWorkshops / total) * 100;
                  const entPct = (totalEnterprises / total) * 100;
                  let offset = 0;
                  const segments = [
                    { pct: userPct, color: "var(--solana-cyan)" },
                    { pct: wsPct, color: "var(--solana-green)" },
                    { pct: entPct, color: "#F97316" },
                  ];
                  return segments.map((seg, i) => {
                    const el = <circle key={i} cx="18" cy="18" r="15.9155" fill="none" stroke={seg.color} strokeWidth="3" strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={-offset} />;
                    offset += seg.pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{wallets.length}</span>
                <span className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>Total</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--solana-cyan)" }} />
                <span className="text-sm">Users: <strong>{totalUsers}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--solana-green)" }} />
                <span className="text-sm">Workshops: <strong>{totalWorkshops}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-sm">Enterprises: <strong>{totalEnterprises}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Platform Events */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Recent Audit Events</h2>
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
            {auditLogs.length > 0 ? auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.15)" }}>
                  {log.action.includes("role") ? <Users className="w-4 h-4 text-orange-400" /> :
                   log.action.includes("kyc") ? <Shield className="w-4 h-4 text-green-400" /> :
                   log.action.includes("dispute") ? <Scale className="w-4 h-4 text-red-400" /> :
                   <Activity className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.action.replace(/_/g, " ")}</p>
                  <p className="text-xs truncate" style={{ color: "var(--solana-text-muted)" }}>{log.details}</p>
                </div>
                <span className="text-[10px] shrink-0 mono" style={{ color: "var(--solana-text-muted)" }}>{log.timestamp.split("T")[0]}</span>
              </div>
            )) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>No audit events yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/admin/roles", label: "Manage Roles", icon: Users, desc: "Wallet whitelist & RBAC", color: "#F97316" },
          { href: "/admin/workshops", label: "KYC Queue", icon: Wrench, desc: "Pending workshop approvals", color: "var(--solana-green)" },
          { href: "/admin/disputes", label: "Disputes", icon: Scale, desc: `${activeDisputes} active cases`, color: "#EF4444" },
          { href: "/admin/audit", label: "Audit Logs", icon: FileText, desc: `${auditLogs.length} entries`, color: "var(--solana-cyan)" },
        ].map((link, i) => (
          <Link key={link.href} href={link.href}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="glass-card-static p-5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-colors cursor-pointer group">
              <link.icon className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform" style={{ color: link.color }} />
              <p className="font-semibold text-sm mb-1">{link.label}</p>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{link.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
