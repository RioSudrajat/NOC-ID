"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, Building2, Wrench, Car, Receipt, Scale, BarChart3, Settings, FileText, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { GlobalCopilotSidebar } from "@/components/ui/GlobalCopilotSidebar";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/roles", label: "Users & Roles", icon: Users },
  { href: "/admin/enterprises", label: "Enterprises", icon: Building2 },
  { href: "/admin/workshops", label: "Workshops", icon: Wrench },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/disputes", label: "Disputes", icon: Scale },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/config", label: "System Config", icon: Settings },
  { href: "/admin/audit", label: "Audit Logs", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--solana-dark)" }}>
      <aside className={`hidden md:flex flex-col min-h-screen p-5 border-r relative transition-all duration-300 ease-in-out shrink-0 ${isLeftCollapsed ? 'w-20 items-center' : 'w-64'}`} style={{ background: "var(--solana-dark-2)", borderColor: "rgba(249,115,22,0.4)", boxShadow: "2px 0 20px rgba(0,0,0,0.4)" }}>
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="absolute -right-3 top-8 rounded-full p-1.5 text-white z-10 transition-transform hover:scale-110 shadow-lg cursor-pointer"
          style={{ background: "#F97316" }}
        >
          {isLeftCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <Link href="/" className={`flex items-center gap-3 mb-8 ${isLeftCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #EF4444)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isLeftCollapsed && <span className="font-bold text-lg whitespace-nowrap overflow-hidden"><span style={{ color: "#F97316" }}>NOC</span> Admin</span>}
        </Link>

        {!isLeftCollapsed ? (
          <div className="p-4 mb-6 rounded-xl border" style={{ background: "rgba(249,115,22,0.05)", borderColor: "rgba(249,115,22,0.2)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Platform Admin</p>
            <p className="font-semibold text-sm">NOC ID Superadmin</p>
            <p className="text-xs mono mt-1" style={{ color: "#F97316" }}>9kPt...xQ2r</p>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full mb-6 flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(249,115,22,0.5)", background: "rgba(249,115,22,0.1)" }}>
            <Shield className="w-4 h-4" style={{ color: "#F97316" }} />
          </div>
        )}

        <nav className="flex flex-col gap-1 flex-1 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center p-3 rounded-xl transition-colors ${isActive ? "bg-orange-500/10 text-orange-400" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"} ${isLeftCollapsed ? 'justify-center' : 'gap-3'}`}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!isLeftCollapsed && <span className="whitespace-nowrap text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className={`mt-4 flex items-center p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors ${isLeftCollapsed ? 'justify-center' : 'gap-3'}`}>
          <ChevronLeft className="w-5 h-5 shrink-0" />
          {!isLeftCollapsed && <span className="whitespace-nowrap text-sm">Back to Home</span>}
        </Link>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4" style={{ background: "rgba(14,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(249,115,22,0.1)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F97316, #EF4444)" }}><Shield className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-sm"><span style={{ color: "#F97316" }}>NOC</span> Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.slice(0, 3).map((item) => (
            <Link key={item.href} href={item.href} className="p-2 rounded-lg" style={{ background: pathname === item.href ? "rgba(249,115,22,0.15)" : "transparent", color: pathname === item.href ? "#F97316" : "var(--solana-text-muted)" }}>
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto" style={{ maxHeight: "100dvh" }}>
        <header className="hidden md:flex justify-end mb-0 -mt-4 pb-4">
          <ConnectWalletButton variant="admin" />
        </header>
        {children}
      </main>

      <GlobalCopilotSidebar />
    </div>
  );
}
