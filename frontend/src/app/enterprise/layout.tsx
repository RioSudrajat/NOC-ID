"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Cpu, Map, ShieldCheck, Users, Shield, ChevronLeft, ChevronRight, BarChart3, AlertOctagon, Settings, Receipt, Scale } from "lucide-react";
import { GlobalCopilotSidebar } from "@/components/ui/GlobalCopilotSidebar";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";

const navItems = [
  { href: "/enterprise", label: "Overview", icon: LayoutDashboard },
  { href: "/enterprise/mint", label: "Mint Console", icon: Cpu },
  { href: "/enterprise/fleet", label: "Fleet Map", icon: Map },
  { href: "/enterprise/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/enterprise/transactions", label: "Transactions", icon: Receipt },
  { href: "/enterprise/warranty", label: "Warranty", icon: ShieldCheck },
  { href: "/enterprise/workshops", label: "Workshops", icon: Users },
  { href: "/enterprise/recalls", label: "Recalls", icon: AlertOctagon },
  { href: "/enterprise/disputes", label: "Disputes", icon: Scale },
  { href: "/enterprise/settings", label: "API & Settings", icon: Settings },
];

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
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
            <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Enterprise Portal</p>
            <p className="font-semibold text-sm">PT Astra Manufacturing</p>
            <p className="text-xs mono mt-1" style={{ color: "var(--solana-green)" }}>Genesis Minter</p>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full mb-6 flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(153,69,255,0.5)", background: "rgba(153,69,255,0.1)" }}>
            <Cpu className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
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

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4" style={{ background: "rgba(14,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(153,69,255,0.1)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}><Shield className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-sm"><span className="gradient-text">NOC</span> Enterprise</span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.slice(0, 3).map((item) => (
            <Link key={item.href} href={item.href} className="p-2 rounded-lg" style={{ background: pathname === item.href ? "rgba(153,69,255,0.15)" : "transparent", color: pathname === item.href ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto" style={{ maxHeight: "100dvh" }}>
        <header className="hidden md:flex justify-end mb-0 -mt-4 pb-4">
          <ConnectWalletButton variant="enterprise" />
        </header>
        {children}
      </main>
      
      <GlobalCopilotSidebar />
    </div>
  );
}
