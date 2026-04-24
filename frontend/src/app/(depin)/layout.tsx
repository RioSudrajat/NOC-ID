"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { NavItem } from "@/components/layout/AppSidebar";
import { Globe, LayoutDashboard, Trophy, Zap, ArrowLeftRight, Cpu, Users } from "lucide-react";

const NAV_ITEMS: NavItem[] = [
  { href: "/depin", label: "Network", icon: Globe },
  { href: "/depin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/depin/quests", label: "Quests", icon: Trophy },
  { href: "/depin/earn", label: "Earn", icon: Zap },
  { href: "/depin/transactions", label: "Riwayat Poin", icon: ArrowLeftRight },
  { href: "/depin/devices", label: "Devices", icon: Cpu },
  { href: "/depin/referrals", label: "Referrals", icon: Users },
];

export default function DepinLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDriverRoute = pathname?.startsWith("/depin/driver");

  if (isDriverRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--solana-dark)" }}>
      <AppSidebar
        navItems={NAV_ITEMS}
        portalName="Nemesis DePIN"
        portalLabel="DePIN"
        useInlineActiveStyle={true}
        mobileNavCount={4}
      />
      <main className="flex-1 min-w-0 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
