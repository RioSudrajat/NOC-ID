"use client";

import {
  LayoutDashboard,
  Clock,
  Brain,
  CalendarCheck,
  Box,
  Route,
  ChevronDown,
  CreditCard,
  Car,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { PortalGuard } from "@/components/guards/PortalGuard";
import type { NavItem } from "@/components/layout/AppSidebar";
import {
  ActiveVehicleProvider,
  useActiveVehicle,
  vehicleData,
} from "@/context/ActiveVehicleContext";
import type { VehicleKey } from "@/types/vehicle";
import { formatMileageKm, getVehicleDisplayName } from "@/types/vehicle";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";

const navItems: NavItem[] = [
  { href: "/dapp", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dapp/timeline", label: "Service Timeline", icon: Clock },
  { href: "/dapp/trips", label: "Trips", icon: Route },
  { href: "/dapp/insights", label: "AI Insights", icon: Brain },
  { href: "/dapp/viewer", label: "3D Digital Twin", icon: Box },
  { href: "/dapp/book", label: "Book Service", icon: CalendarCheck },
  { href: "/dapp/register-vehicle", label: "Register Vehicle", icon: PlusCircle },
  { href: "/dapp/identity", label: "Identity Card", icon: CreditCard },
];

function VehicleSelector() {
  const ctx = useActiveVehicle();
  const activeVehicle = ctx?.activeVehicle || "bmw_m4";
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.bmw_m4;
  const setActiveVehicle = ctx?.setActiveVehicle || (() => {});
  const currentUser = useUserStore((state) => state.currentUser);
  const registryVehicles = useVehicleRegistryStore((state) => state.vehicles);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userId = currentUser?.userId;
  const ownedVehicleIds = currentUser?.ownedVehicleIds;
  const visibleVehicles = useMemo(() => {
    return registryVehicles
      .filter((vehicle) => {
        if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.vin) return false;
        if (userId) return vehicle.currentOwnerId === userId || ownedVehicleIds?.includes(vehicle.vehicleId);
        if (vehicle.mintStatus === "transferred" || vehicle.mintStatus === "escrow") return false;
        return vehicle.isDemo;
      })
      .filter((vehicle, index, list) => list.findIndex((item) => item.vin === vehicle.vin) === index);
  }, [ownedVehicleIds, registryVehicles, userId]);
  
  const activeVehicleId = ctx?.activeVehicleId;
  const safeCurrentVehicle =
    visibleVehicles.find((vehicle) => vehicle.vehicleId === activeVehicleId) ??
    visibleVehicles[0];

  useEffect(() => {
    if (!activeVehicleId || visibleVehicles.some((vehicle) => vehicle.vehicleId === activeVehicleId)) return;
    const nextVehicleId = visibleVehicles[0]?.vehicleId;
    if (nextVehicleId && nextVehicleId !== activeVehicleId) {
        setActiveVehicle(nextVehicleId);
    }
  }, [activeVehicleId, setActiveVehicle, visibleVehicles]);

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
              {safeCurrentVehicle ? getVehicleDisplayName(safeCurrentVehicle) : currentVehicleData.name}
            </p>
            <p className="text-[10px] mono mt-1" style={{ color: "var(--solana-purple)" }}>
              {(safeCurrentVehicle?.vin ?? currentVehicleData.vin).substring(0, 10)}...
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
              {visibleVehicles.map((vehicle) => {
                const key = vehicle.legacyKey as VehicleKey | undefined;
                const isActive = activeVehicleId === vehicle.vehicleId || activeVehicle === key;
                return (
                  <div
                    key={vehicle.vehicleId}
                    onClick={() => {
                      setActiveVehicle(vehicle.vehicleId);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? "bg-teal-500/10 text-teal-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="truncate max-w-[150px]">
                      <p className="truncate">{getVehicleDisplayName(vehicle)}</p>
                      <p className="text-[10px] text-slate-500">{vehicle.vin.slice(0, 10)}... · {formatMileageKm(vehicle.currentMileageKm)} km</p>
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
      useInlineActiveStyle
    >
      {children}
    </PortalLayout>
  );
}

export default function DAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard requiredRole="user">
      <ActiveVehicleProvider>
        <DAppSidebarAndContent>{children}</DAppSidebarAndContent>
      </ActiveVehicleProvider>
    </PortalGuard>
  );
}
