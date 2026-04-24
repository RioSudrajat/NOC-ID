"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  Car,
  Receipt,
  Scale,
  BarChart3,
  Settings,
  FileText,
  Shield,
  Megaphone,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import type { NavItem } from "@/components/layout/AppSidebar";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/roles", label: "Roles & Wallets", icon: Users },
  { href: "/admin/operators", label: "Operators", icon: Building2 },
  { href: "/admin/workshops", label: "Workshops", icon: Wrench },
  { href: "/admin/fleet", label: "Fleet", icon: Car },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/disputes", label: "Disputes", icon: Scale },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={navItems}
      portalName={<><span style={{ color: "var(--solana-green)" }}>Nemesis</span> Admin</>}
      portalLabel={<>Admin</>}
      infoCard={
        <div
          className="p-4 rounded-xl border"
          style={{
            background: "rgba(94, 234, 212,0.05)",
            borderColor: "rgba(94, 234, 212,0.2)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>
            Platform Admin
          </p>
          <p className="font-semibold text-sm">Nemesis Admin</p>
          <p className="text-xs mono mt-1" style={{ color: "var(--solana-green)" }}>
            9kPt...xQ2r
          </p>
        </div>
      }
      collapsedIcon={
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
          style={{ borderColor: "rgba(94, 234, 212,0.5)", background: "rgba(94, 234, 212,0.1)" }}
        >
          <Shield className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
        </div>
      }
      variant="admin"
      mainLayout="flat"
      mobileNavCount={3}
      useInlineActiveStyle
    >
      {children}
    </PortalLayout>
  );
}
