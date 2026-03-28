"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Clock,
  Brain,
  CalendarCheck,
  Bell,
  Scan,
  Shield,
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  ArrowRightLeft,
  Car,
  Activity,
} from "lucide-react";
import { GlobalCopilotSidebar } from "@/components/ui/GlobalCopilotSidebar";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";

const navItems = [
  { href: "/dapp", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dapp/timeline", label: "Service Timeline", icon: Clock },
  { href: "/dapp/insights", label: "AI Insights", icon: Brain },
  { href: "/dapp/viewer", label: "3D Digital Twin", icon: Box },
  { href: "/dapp/book", label: "Book Service", icon: CalendarCheck },
  { href: "/dapp/book/status", label: "Status Servis", icon: Activity },
  { href: "/dapp/notifications", label: "Notifications", icon: Bell },
  { href: "/dapp/identity", label: "Identity Card", icon: CreditCard },
  { href: "/dapp/transfer", label: "Vehicle Transfer", icon: ArrowRightLeft },
];

import { ActiveVehicleProvider, useActiveVehicle, vehicleData, VehicleKey } from "@/context/ActiveVehicleContext";
import { CheckCircle2 } from "lucide-react";

function DAppSidebarAndContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const ctx = useActiveVehicle();
  // Safe fallback just in case context doesn't load
  const activeVehicle = ctx?.activeVehicle || "avanza";
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.avanza;
  const setActiveVehicle = ctx?.setActiveVehicle || (() => {});

  return (
    <div className="min-h-screen flex" style={{ background: "var(--solana-dark)" }}>
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col min-h-screen p-5 border-r relative transition-all duration-300 ease-in-out shrink-0 ${isLeftCollapsed ? 'w-20 items-center' : 'w-64'}`}
        style={{ background: "var(--solana-dark-2)", borderColor: "rgba(153,69,255,0.4)", boxShadow: "2px 0 20px rgba(0,0,0,0.4)", zIndex: 40 }}
      >
        <button 
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="absolute -right-3 top-8 rounded-full p-1.5 text-white z-10 transition-transform hover:scale-110 shadow-lg cursor-pointer"
          style={{ background: "var(--solana-purple)" }}
        >
          {isLeftCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <Link href="/" className={`flex items-center gap-3 mb-8 ${isLeftCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isLeftCollapsed && (
            <span className="font-bold text-lg whitespace-nowrap overflow-hidden transition-opacity">
              <span className="gradient-text">NOC</span> ID
            </span>
          )}
        </Link>

        {/* Vehicle selector */}
        {!isLeftCollapsed ? (
          <div className="relative mb-6">
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="glass-card overflow-hidden cursor-pointer hover:bg-white/5 transition-colors" 
              style={{ border: "1px solid rgba(153,69,255,0.2)" }}
            >
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Active Vehicle</p>
                  <p className="font-semibold text-sm truncate max-w-[140px]">{currentVehicleData.name}</p>
                  <p className="text-[10px] mono mt-1" style={{ color: "var(--solana-purple)" }}>{currentVehicleData.vin.substring(0, 10)}...</p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ color: "var(--solana-text-muted)" }} />
              </div>
            </div>

            {/* Dropdown Options */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-full rounded-xl bg-slate-800 border border-slate-600 shadow-2xl z-50">
                  <div className="p-1.5 flex flex-col gap-1">
                    {(Object.keys(vehicleData) as VehicleKey[]).map((key) => {
                      const isActive = activeVehicle === key;
                      return (
                        <div 
                          key={key}
                          onClick={() => { setActiveVehicle(key); setDropdownOpen(false); }}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between cursor-pointer transition-colors ${
                            isActive ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="truncate max-w-[150px]">
                            <p className="truncate">{vehicleData[key].name}</p>
                          </div>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full mb-6 flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(153,69,255,0.5)", background: "rgba(153,69,255,0.1)" }}>
            <Car className="w-4 h-4 text-purple-400" />
          </div>
        )}

        {/* Nav links */}
        <nav className="flex flex-col gap-2 flex-1 w-full">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link flex items-center p-3 rounded-xl transition-colors ${pathname === item.href ? "active" : ""} ${isLeftCollapsed ? 'justify-center' : 'gap-3'}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isLeftCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Back link */}
        <Link href="/" className={`sidebar-link mt-4 flex items-center p-3 rounded-xl ${isLeftCollapsed ? 'justify-center' : 'gap-3'}`}>
          <ChevronLeft className="w-5 h-5 shrink-0" />
          {!isLeftCollapsed && <span className="whitespace-nowrap">Back to Home</span>}
        </Link>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4" style={{ background: "rgba(14,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(153,69,255,0.1)" }}>
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
      <main className="flex-1 overflow-y-auto flex flex-col" style={{ maxHeight: "100dvh" }}>
        {/* Desktop Header for Wallet Connect */}
        <header className="hidden md:flex justify-end p-6 pb-0 max-w-7xl mx-auto w-full">
          <ConnectWalletButton variant="dapp" />
        </header>
        <div className="max-w-7xl mx-auto w-full flex-1 p-6 md:p-12 pt-24 md:pt-6">
          {children}
        </div>
      </main>

      {/* Global Right Sidebar (AI Copilot) */}
      <GlobalCopilotSidebar />
    </div>
  );
}

export default function DAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveVehicleProvider>
      <DAppSidebarAndContent>{children}</DAppSidebarAndContent>
    </ActiveVehicleProvider>
  );
}
