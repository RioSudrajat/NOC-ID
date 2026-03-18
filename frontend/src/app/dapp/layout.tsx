"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Brain,
  Wallet,
  Bell,
  Scan,
  Shield,
  Box,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { href: "/dapp", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dapp/timeline", label: "Service Timeline", icon: Clock },
  { href: "/dapp/insights", label: "AI Insights", icon: Brain },
  { href: "/dapp/viewer", label: "3D Digital Twin", icon: Box },
  { href: "/dapp/wallet", label: "$NOC Wallet", icon: Wallet },
  { href: "/dapp/notifications", label: "Notifications", icon: Bell },
  { href: "/dapp/qr", label: "QR Code", icon: Scan },
];

export default function DAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--solana-dark)" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 min-h-screen p-5 border-r"
        style={{ background: "var(--solana-dark-2)", borderColor: "rgba(153,69,255,0.1)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">
            <span className="gradient-text">NOC</span> ID
          </span>
        </Link>

        {/* Vehicle selector */}
        <div className="glass-card p-4 mb-6">
          <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Active Vehicle</p>
          <p className="font-semibold text-sm">Toyota Avanza 2025</p>
          <p className="text-xs mono mt-1" style={{ color: "var(--solana-purple)" }}>NOC #00001</p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Back link */}
        <Link href="/" className="sidebar-link mt-4">
          <ChevronLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4" style={{ background: "rgba(14,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(153,69,255,0.1)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base"><span className="gradient-text">NOC</span> ID</span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-lg transition-colors ${pathname === item.href ? "text-white" : ""}`}
              style={{ background: pathname === item.href ? "rgba(153,69,255,0.15)" : "transparent", color: pathname === item.href ? "var(--solana-green)" : "var(--solana-text-muted)" }}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto" style={{ maxHeight: "100dvh" }}>
        {children}
      </main>
    </div>
  );
}
