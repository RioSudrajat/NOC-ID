"use client";

import {
  LayoutDashboard,
  Clock,
  Brain,
  CalendarCheck,
  Box,
  ChevronDown,
  CreditCard,
  Car,
} from "lucide-react";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import type { NavItem } from "@/components/layout/AppSidebar";
import {
  ActiveVehicleProvider,
  useActiveVehicle,
  vehicleData,
  VehicleKey,
} from "@/context/ActiveVehicleContext";

const navItems: NavItem[] = [
  { href: "/dapp", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dapp/timeline", label: "Service Timeline", icon: Clock },
  { href: "/dapp/insights", label: "AI Insights", icon: Brain },
  { href: "/dapp/viewer", label: "3D Digital Twin", icon: Box },
  { href: "/dapp/book", label: "Book Service", icon: CalendarCheck },
  { href: "/dapp/identity", label: "Identity Card", icon: CreditCard },
];

function VehicleSelector() {
  const ctx = useActiveVehicle();
  const activeVehicle = ctx?.activeVehicle || "avanza";
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.avanza;
  const setActiveVehicle = ctx?.setActiveVehicle || (() => {});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="glass-card overflow-hidden cursor-pointer hover:bg-white/5 transition-colors"
        style={{ border: "1px solid rgba(94, 234, 212,0.2)" }}
      >
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>
              Active Vehicle
            </p>
            <p className="font-semibold text-sm truncate max-w-[140px]">
              {currentVehicleData.name}
            </p>
            <p className="text-[10px] mono mt-1" style={{ color: "var(--solana-purple)" }}>
              {currentVehicleData.vin.substring(0, 10)}...
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--solana-text-muted)" }}
          />
        </div>
      </div>

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
                    onClick={() => {
                      setActiveVehicle(key);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? "bg-teal-500/10 text-teal-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
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
  );
}

function DAppSidebarAndContent({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={navItems}
      portalName={<><span className="gradient-text">NOC</span> ID</>}
      portalLabel={<><span className="gradient-text">NOC</span> ID</>}
      infoCard={<VehicleSelector />}
      collapsedIcon={
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
          style={{
            borderColor: "rgba(94, 234, 212,0.5)",
            background: "rgba(94, 234, 212,0.1)",
          }}
        >
          <Car className="w-4 h-4 text-teal-400" />
        </div>
      }
      variant="dapp"
      mainLayout="wrapped"
    >
      {children}
    </PortalLayout>
  );
}

export default function DAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveVehicleProvider>
      <DAppSidebarAndContent>{children}</DAppSidebarAndContent>
    </ActiveVehicleProvider>
  );
}
