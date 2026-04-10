"use client";

import {
  LayoutDashboard,
  Cpu,
  Map,
  ShieldCheck,
  Users,
  BarChart3,
  AlertOctagon,
  Settings,
  Receipt,
  Scale,
  ArrowRightLeft,
  Box,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import type { NavItem } from "@/components/layout/AppSidebar";
import { ENTERPRISE_NAME, ENTERPRISE_ROLE } from "./_shared";

const navItems: NavItem[] = [
  { href: "/enterprise", label: "Overview", icon: LayoutDashboard },
  { href: "/enterprise/mint", label: "Mint Console", icon: Cpu },
  { href: "/enterprise/transfer", label: "Transfer", icon: ArrowRightLeft },
  { href: "/enterprise/models", label: "3D Models", icon: Box },
  { href: "/enterprise/fleet", label: "Fleet Map", icon: Map },
  { href: "/enterprise/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/enterprise/transactions", label: "Transactions", icon: Receipt },
  { href: "/enterprise/warranties", label: "Warranty", icon: ShieldCheck },
  { href: "/enterprise/workshops", label: "Workshops", icon: Users },
  { href: "/enterprise/recalls", label: "Recalls", icon: AlertOctagon },
  { href: "/enterprise/disputes", label: "Disputes", icon: Scale },
  { href: "/enterprise/settings", label: "API & Settings", icon: Settings },
];

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={navItems}
      portalName={<><span className="gradient-text">NOC</span> ID</>}
      portalLabel={<><span className="gradient-text">NOC</span> Enterprise</>}
      infoCard={
        <div className="glass-card p-4">
          <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>
            Enterprise Portal
          </p>
          <p className="font-semibold text-sm">{ENTERPRISE_NAME}</p>
          <p className="text-xs mono mt-1" style={{ color: "var(--solana-green)" }}>
            {ENTERPRISE_ROLE}
          </p>
        </div>
      }
      collapsedIcon={
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
          style={{ borderColor: "rgba(94, 234, 212,0.5)", background: "rgba(94, 234, 212,0.1)" }}
        >
          <Cpu className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
        </div>
      }
      variant="enterprise"
      mainLayout="flat"
      mobileNavCount={3}
    >
      {children}
    </PortalLayout>
  );
}
