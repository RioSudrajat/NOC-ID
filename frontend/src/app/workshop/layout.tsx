"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Scan,
  FileText,
  Star,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  Box,
  Bell,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
import { GlobalCopilotSidebar } from "@/components/ui/GlobalCopilotSidebar";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";

const navItems = [
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
  const pathname = usePathname();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--solana-dark)" }}>
      <aside className={`hidden md:flex flex-col min-h-screen p-5 border-r relative transition-all duration-300 ease-in-out shrink-0 ${isLeftCollapsed ? 'w-20 items-center' : 'w-64'}`} style={{ background: "var(--solana-dark-2)", borderColor: "rgba(153,69,255,0.4)", boxShadow: "2px 0 20px rgba(0,0,0,0.4)" }}>
        <button 
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="absolute -right-3 top-8 rounded-full p-1.5 text-white z-10 transition-transform hover:scale-110 shadow-lg cursor-pointer"
          style={{ background: "var(--solana-purple)" }}
        >
          {isLeftCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <Link href="/" className={`flex items-center gap-3 mb-8 ${isLeftCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isLeftCollapsed && <span className="font-bold text-lg whitespace-nowrap overflow-hidden transition-opacity"><span className="gradient-text">NOC</span> ID</span>}
        </Link>

        {!isLeftCollapsed ? (
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Workshop Portal</p>
            </div>
            <p className="font-semibold text-sm">Bengkel Hendra Motor</p>
            <p className="text-xs mono mt-1" style={{ color: "var(--solana-purple)" }}>★ 4.8 · Verified</p>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full mb-6 flex items-center justify-center shrink-0 border" style={{ borderColor: "var(--solana-green)", background: "rgba(20,241,149,0.1)" }}>
            <Users className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
          </div>
        )}

        <nav className="flex flex-col gap-2 flex-1 w-full">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link flex items-center p-3 rounded-xl transition-colors ${pathname === item.href ? "active" : ""} ${isLeftCollapsed ? 'justify-center' : 'gap-3'}`}>
              <item.icon className="w-5 h-5 shrink-0" />
              {!isLeftCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <Link href="/" className={`sidebar-link mt-4 flex items-center p-3 rounded-xl ${isLeftCollapsed ? 'justify-center' : 'gap-3'}`}>
          <ChevronLeft className="w-5 h-5 shrink-0" />
          {!isLeftCollapsed && <span className="whitespace-nowrap">Back to Home</span>}
        </Link>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4" style={{ background: "rgba(14,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(153,69,255,0.1)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm"><span className="gradient-text">NOC</span> Workshop</span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href} className="p-2 rounded-lg transition-colors" style={{ background: pathname === item.href ? "rgba(153,69,255,0.15)" : "transparent", color: pathname === item.href ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
              <item.icon className="w-5 h-5 cursor-pointer hover:text-white" />
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col" style={{ maxHeight: "100dvh" }}>
        {/* Desktop Header for Wallet Connect */}
        <header className="hidden md:flex justify-end p-6 pb-0 max-w-7xl mx-auto w-full">
          <ConnectWalletButton variant="workshop" />
        </header>
        <div className="max-w-7xl mx-auto w-full flex-1 p-6 md:p-12 pt-24 md:pt-6">
          {children}
        </div>
      </main>

      <GlobalCopilotSidebar />
    </div>
  );
}
