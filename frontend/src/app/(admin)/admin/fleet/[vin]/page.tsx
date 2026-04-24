"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Car, Shield, MapPin, User, Hash } from "lucide-react";
import { useEnterprise } from "@/context/EnterpriseContext";
import { getHealthColor, getHealthStatus } from "@/lib/health";

export default function VehicleDetailPage({ params }: { params: Promise<{ vin: string }> }) {
  const { vin } = use(params);
  const enterprise = useEnterprise();
  const vehicles = enterprise?.metrics.vehicles || [];

  const vehicle = useMemo(() => vehicles.find(v => v.vin === vin) || null, [vehicles, vin]);

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Car className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-gray-400 mb-4">Vehicle not found.</p>
        <Link href="/admin/fleet" className="text-sm underline" style={{ color: "#5EEAD4" }}>Back to Fleet</Link>
      </div>
    );
  }

  const hColor = getHealthColor(vehicle.health);
  const hStatus = getHealthStatus(vehicle.health);

  return (
    <div>
      <Link href="/admin/fleet" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "#5EEAD4" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Fleet
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <Car className="w-7 h-7" style={{ color: "#5EEAD4" }} />
        <div>
          <h1 className="font-bold text-2xl">{vehicle.name}</h1>
          <p className="mono text-xs text-gray-400 mt-1">{vehicle.vin}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <Shield className="w-5 h-5 mb-2" style={{ color: hColor }} />
          <p className="text-2xl font-bold" style={{ color: hColor }}>{vehicle.health}</p>
          <p className="text-xs text-gray-400">{hStatus}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <MapPin className="w-5 h-5 mb-2" style={{ color: "#5EEAD4" }} />
          <p className="text-lg font-bold">{vehicle.region}</p>
          <p className="text-xs text-gray-400">Region</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Hash className="w-5 h-5 mb-2" style={{ color: "#5EEAD4" }} />
          <p className="text-lg font-bold">{vehicle.status}</p>
          <p className="text-xs text-gray-400">Status</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Car className="w-5 h-5 mb-2" style={{ color: "#5EEAD4" }} />
          <p className="text-lg font-bold">{vehicle.odometer.toLocaleString("id-ID")} km</p>
          <p className="text-xs text-gray-400">Odometer</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Owner</h3>
        <p className="mono text-sm text-gray-300">{vehicle.owner}</p>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold mb-4">Health Score</h3>
        <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: "rgba(20,20,40,0.5)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${vehicle.health}%`, background: hColor }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0</span>
          <span className="font-bold" style={{ color: hColor }}>{vehicle.health}%</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
