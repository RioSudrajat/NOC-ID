"use client";

import {
  LayoutDashboard,
  Scan,
  FileText,
  Star,
  Users,
  Box,
  Bell,
  BarChart3,
  CalendarCheck,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import type { NavItem } from "@/components/layout/AppSidebar";

const navItems: NavItem[] = [
  { href: "/workshop", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workshop/scan", label: "Scan Vehicle", icon: Scan },
  { href: "/workshop/bookings", label: "Status Service", icon: CalendarCheck },
  { href: "/workshop/queue", label: "Active Queue", icon: Users },
  { href: "/workshop/viewer", label: "3D Digital Twin", icon: Box },
  { href: "/workshop/history", label: "Service Ledger", icon: FileText },
  { href: "/workshop/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/workshop/reputation", label: "Reputation", icon: Star },
  { href: "/workshop/notifications", label: "Notifications", icon: Bell },
];

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={navItems}
      portalName={<><span className="gradient-text">NOC</span> ID</>}
      portalLabel={<><span className="gradient-text">NOC</span> Workshop</>}
      infoCard={
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Workshop Portal</p>
          </div>
          <p className="font-semibold text-sm">Bengkel Hendra Motor</p>
          <p className="text-xs mono mt-1" style={{ color: "var(--solana-purple)" }}>
            ★ 4.8 · Verified
          </p>
        </div>
      }
      collapsedIcon={
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
          style={{ borderColor: "var(--solana-green)", background: "rgba(94, 234, 212,0.1)" }}
        >
          <Users className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
        </div>
      }
      variant="workshop"
      mainLayout="wrapped"
    >
      {children}
    </PortalLayout>
  );
}
