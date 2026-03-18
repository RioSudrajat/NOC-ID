"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scan,
  FileText,
  Star,
  Shield,
  ChevronLeft,
  BarChart3,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/workshop", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workshop/scan", label: "Scan Vehicle", icon: Scan },
  { href: "/workshop/maintenance", label: "Log Maintenance", icon: FileText },
  { href: "/workshop/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/workshop/reputation", label: "Reputation", icon: Star },
];

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--solana-dark)" }}>
      <aside className="hidden md:flex flex-col w-64 min-h-screen p-5 border-r" style={{ background: "var(--solana-dark-2)", borderColor: "rgba(153,69,255,0.1)" }}>
        <Link href="/" className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg"><span className="gradient-text">NOC</span> ID</span>
        </Link>

        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Workshop Portal</p>
          </div>
          <p className="font-semibold text-sm">Bengkel Hendra Motor</p>
          <p className="text-xs mono mt-1" style={{ color: "var(--solana-purple)" }}>★ 4.8 · Verified</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? "active" : ""}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="sidebar-link mt-4"><ChevronLeft className="w-5 h-5" /> Back to Home</Link>
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
          {navItems.slice(0, 3).map((item) => (
            <Link key={item.href} href={item.href} className="p-2 rounded-lg" style={{ background: pathname === item.href ? "rgba(153,69,255,0.15)" : "transparent", color: pathname === item.href ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto" style={{ maxHeight: "100dvh" }}>{children}</main>
    </div>
  );
}
