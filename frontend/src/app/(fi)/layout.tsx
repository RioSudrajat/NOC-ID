"use client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { NavItem } from "@/components/layout/AppSidebar";
import { Layers, Wallet, Zap } from "lucide-react";

const NAV_ITEMS: NavItem[] = [
  { href: "/fi", label: "Pools", icon: Layers },
  { href: "/fi/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/fi/stake", label: "Stake $NMS", icon: Zap },
];

export default function FiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--solana-dark)" }}>
      <AppSidebar
        navItems={NAV_ITEMS}
        portalName="Nemesis FI"
        portalLabel="FI"
        useInlineActiveStyle={true}
        mobileNavCount={3}
      />
      <main className="flex-1 min-w-0 pt-16 md:pt-0">{children}</main>
    </div>
  );
}
