"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Wrench, Coins, Shield, CheckCircle2, Trash2 } from "lucide-react";

const initialNotifications = [
  { id: 1, type: "ai_alert", title: "CVT Belt — Risiko Tinggi", message: "Prediksi kegagalan dalam 45 hari. Segera jadwalkan inspeksi.", time: "2 jam lalu", read: false },
  { id: 2, type: "token_reward", title: "+25 $NOC Earned", message: "Reward dari servis Oil Change di Bengkel Hendra Motor.", time: "5 jam lalu", read: false },
  { id: 3, type: "maintenance_due", title: "Servis Berikutnya: Air Filter", message: "Penggantian air filter disarankan dalam 2 minggu.", time: "1 hari lalu", read: true },
  { id: 4, type: "system", title: "NOC ID v2.1 Released", message: "Fitur baru: Interior 3D view dan BMW M4 model.", time: "2 hari lalu", read: true },
  { id: 5, type: "ai_alert", title: "Brake Fluid — Risiko Sedang", message: "Brake fluid flush direkomendasikan dalam 90 hari.", time: "3 hari lalu", read: true },
  { id: 6, type: "token_reward", title: "+30 $NOC Earned", message: "Reward dari Full Inspection di Bengkel Jaya Motor.", time: "1 minggu lalu", read: true },
  { id: 7, type: "maintenance_due", title: "Reminder: Ganti oli 40,000 km", message: "Odometer Anda mendekati 40,000 km. Jadwalkan servis.", time: "2 minggu lalu", read: true },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  ai_alert: { icon: <AlertTriangle className="w-5 h-5" />, color: "#F97316" },
  maintenance_due: { icon: <Wrench className="w-5 h-5" />, color: "var(--solana-cyan)" },
  token_reward: { icon: <Coins className="w-5 h-5" />, color: "var(--solana-green)" },
  system: { icon: <Shield className="w-5 h-5" />, color: "var(--solana-purple)" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<string>("all");

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const deleteNotif = (id: number) => setNotifications(notifications.filter(n => n.id !== id));
  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="flex items-center gap-3">
              <Bell className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
              Notifications
              {unreadCount > 0 && (
                <span className="badge badge-green text-xs">{unreadCount} baru</span>
              )}
            </h1>
            <p>Alerts, rewards, and maintenance reminders</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors" style={{ background: "rgba(153,69,255,0.1)", color: "var(--solana-purple)" }}>
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: "all", label: "All" },
          { key: "ai_alert", label: "AI Alerts" },
          { key: "maintenance_due", label: "Maintenance" },
          { key: "token_reward", label: "Rewards" },
          { key: "system", label: "System" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: filter === f.key ? "rgba(153,69,255,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${filter === f.key ? "var(--solana-purple)" : "rgba(153,69,255,0.15)"}`, color: filter === f.key ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="glass-card-static p-16 text-center">
            <Bell className="w-16 h-16 mx-auto mb-6" style={{ color: "var(--solana-text-muted)", opacity: 0.3 }} />
            <p className="text-lg" style={{ color: "var(--solana-text-muted)" }}>No notifications</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const config = typeConfig[n.type] || typeConfig.system;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card-static p-6 flex items-start gap-5"
                style={{ borderLeft: !n.read ? `4px solid ${config.color}` : `1px solid rgba(153,69,255,0.15)`, opacity: n.read ? 0.7 : 1 }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${config.color}15`, color: config.color }}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">{n.title}</p>
                  <p className="text-sm mt-2" style={{ color: "var(--solana-text-muted)" }}>{n.message}</p>
                  <p className="text-xs mono mt-3" style={{ color: "var(--solana-text-muted)", opacity: 0.7 }}>{n.time}</p>
                </div>
                <button onClick={() => deleteNotif(n.id)} className="p-3 rounded-lg hover:bg-white/5 transition-colors shrink-0">
                  <Trash2 className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
