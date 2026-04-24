"use client";

import { useState } from "react";
import { Bell, Coins, FileText, CheckCircle2, Star, Shield, CalendarCheck, Wrench, Receipt, AlertTriangle } from "lucide-react";
import { SharedNotificationCard } from "@/components/ui/SharedNotificationCard";
import { useBooking } from "@/context/BookingContext";

const initialNotifications = [
  { id: 1, type: "reward", title: "Reward Received", message: "You earned 120 NOC for Proof of Maintenance on VIN MHKA...001", time: "2 hours ago", read: false },
  { id: 2, type: "system", title: "Scan Successful", message: "Vehicle Toyota Avanza 2025 verified on-chain.", time: "4 hours ago", read: true },
  { id: 3, type: "review", title: "New Rating", message: "Customer gave you 5 stars for the recent service.", time: "1 day ago", read: true },
  { id: 4, type: "service", title: "Service Logged", message: "Maintenance record successfully anchored to Solana.", time: "1 day ago", read: true },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  reward: { icon: <Coins className="w-5 h-5" />, color: "var(--solana-green)" },
  system: { icon: <CheckCircle2 className="w-5 h-5" />, color: "var(--solana-purple)" },
  review: { icon: <Star className="w-5 h-5" />, color: "#FCD34D" },
  service: { icon: <FileText className="w-5 h-5" />, color: "var(--solana-cyan)" },
  default: { icon: <Shield className="w-5 h-5" />, color: "var(--solana-purple)" },
  // Booking notification types
  booking_pending: { icon: <CalendarCheck className="w-5 h-5" />, color: "#FCD34D" },
  booking_accepted: { icon: <CheckCircle2 className="w-5 h-5" />, color: "var(--solana-green)" },
  booking_rejected: { icon: <AlertTriangle className="w-5 h-5" />, color: "#FCA5A5" },
  booking_service: { icon: <Wrench className="w-5 h-5" />, color: "var(--solana-cyan)" },
  booking_invoice: { icon: <Receipt className="w-5 h-5" />, color: "#5EEAD4" },
  booking_paid: { icon: <CheckCircle2 className="w-5 h-5" />, color: "var(--solana-green)" },
  booking_completed: { icon: <Star className="w-5 h-5" />, color: "var(--solana-purple)" },
};

export default function WorkshopNotificationsPage() {
  const bookingCtx = useBooking();
  const [staticNotifications, setStaticNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<string>("all");

  // Merge static + booking notifications (workshop-side only)
  const workshopBookingNotifs = (bookingCtx?.bookingNotifications || [])
    .filter(n => n.targetRole === "workshop")
    .map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: n.time,
      read: n.read,
    }));

  const allNotifications = [...workshopBookingNotifs, ...staticNotifications];

  const markAllRead = () => {
    setStaticNotifications(staticNotifications.map(n => ({ ...n, read: true })));
    bookingCtx?.markAllNotificationsRead("workshop");
  };

  const deleteNotif = (id: number | string) => {
    if (typeof id === "string" && id.startsWith("BN-")) {
      bookingCtx?.deleteNotification(id);
    } else {
      setStaticNotifications(staticNotifications.filter(n => n.id !== Number(id)));
    }
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const isBookingType = (type: string) => type.startsWith("booking_");

  const filtered = filter === "all"
    ? allNotifications
    : filter === "booking"
    ? allNotifications.filter(n => isBookingType(n.type))
    : allNotifications.filter(n => n.type === filter);

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
            <p>Updates on services, bookings, rewards, and system alerts.</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer hover:bg-white/5" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)" }}>
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: "all", label: "All" },
          { key: "booking", label: "Booking" },
          { key: "reward", label: "Rewards" },
          { key: "service", label: "Services" },
          { key: "review", label: "Reviews" },
          { key: "system", label: "System" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:bg-white/5" style={{ background: filter === f.key ? "rgba(94, 234, 212,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${filter === f.key ? "var(--solana-purple)" : "rgba(94, 234, 212,0.15)"}`, color: filter === f.key ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
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
            const config = typeConfig[n.type] || typeConfig.default;
            return (
              <SharedNotificationCard
                key={n.id}
                id={n.id}
                index={i}
                title={n.title}
                message={n.message}
                time={n.time}
                read={n.read}
                icon={config.icon}
                color={config.color}
                onDelete={deleteNotif}
                onClick={
                  isBookingType(n.type) && typeof n.id === "string"
                    ? () => bookingCtx?.markNotificationRead(n.id as string)
                    : undefined
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}
