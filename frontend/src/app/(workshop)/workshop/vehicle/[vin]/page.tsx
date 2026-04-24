"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Car } from "lucide-react";
import { VehiclePreVisitBrief } from "@/components/rwa/VehiclePreVisitBrief";
import { MOCK_VEHICLES } from "@/data/vehicles";
import { vehicleData } from "@/context/ActiveVehicleContext";

export default function WorkshopVehicleProfile({ params }: { params: Promise<{ vin: string }> }) {
  const { vin } = use(params);

  // Try to find in Nemesis fleet first; fallback to legacy vehicleData
  const nemesisVehicle = MOCK_VEHICLES.find(v => v.vin === vin);
  const legacyVehicle = Object.values(vehicleData).find(v => v.vin === vin);

  if (!nemesisVehicle && !legacyVehicle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link href="/workshop/queue" className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </Link>
        <div className="glass-card p-8 text-center">
          <Car className="w-12 h-12 mx-auto mb-4 text-slate-500" />
          <p>Kendaraan dengan VIN {vin} tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  // If it's a Nemesis fleet vehicle, use the full Pre-Visit Brief
  if (nemesisVehicle) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Link href="/workshop/queue" className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Car className="w-7 h-7 text-teal-400" />
            Vehicle Pre-Visit Brief
          </h1>
          <p className="text-sm mt-1 text-slate-400">Ringkasan kondisi kendaraan sebelum servis</p>
        </div>
        <VehiclePreVisitBrief vehicle={nemesisVehicle} />
      </div>
    );
  }

  // Legacy non-Nemesis vehicle fallback — show basic info card
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/workshop/queue" className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Car className="w-7 h-7 text-teal-400" />
          Vehicle Profile
        </h1>
        <p className="text-sm mt-1 text-slate-400">Legacy vehicle — diluar pool Nemesis</p>
      </div>
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold mb-4">{legacyVehicle!.name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-xs text-slate-400">VIN</p><p className="font-mono text-sm">{legacyVehicle!.vin}</p></div>
          <div><p className="text-xs text-slate-400">Owner</p><p className="font-semibold">{legacyVehicle!.owner}</p></div>
          <div><p className="text-xs text-slate-400">Health</p><p className="text-teal-400 font-semibold">{legacyVehicle!.health}/100</p></div>
          <div><p className="text-xs text-slate-400">Odometer</p><p>{legacyVehicle!.odometer}</p></div>
        </div>
      </div>
    </div>
  );
}
