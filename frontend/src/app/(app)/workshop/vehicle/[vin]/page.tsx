"use client";

import { useState, use } from "react";
import { Car, Shield, Droplets, ShieldCheck, Gauge, ArrowLeft, Box } from "lucide-react";
import Link from "next/link";
import { SharedServiceCard, ServiceEvent } from "@/components/ui/SharedServiceCard";
import { vehicleData } from "@/context/ActiveVehicleContext";

const timelineEvents: Record<string, ServiceEvent[]> = {
  WBA43AZ0X0CH00001: [
    { id: 5, status: "ANCHORED", date: "2026-03-01", type: "Suspension Check", category: "Full Service", icon: Gauge, mechanic: "EuroHaus M Performance", workshop: "EuroHaus ID", rating: 4.9, mileage: "12,400 km", parts: [
      { name: "Alignment Calibration Kit", partNumber: "31-12-6-867-848", isOem: true, manufacturer: "BMW AG", priceIDR: 350000 },
    ], serviceCost: 500000, gasFee: 100, costIDR: 850100, costUSDC: 53, costNOC: 85, costStr: "Rp 850,100", txSig: "1B3c...A5f9", healthBefore: 88, healthAfter: 98, notes: "Suspension aligned to factory M specification.", images: [] },
  ],
  HD1ME23145K998212: [
    { id: 7, status: "ANCHORED", date: "2025-12-20", type: "Primary Chain Adj", category: "Full Service", icon: Gauge, mechanic: "Mabua Custom", workshop: "Mabua HD", rating: 5.0, mileage: "8,900 km", parts: [
      { name: "Primary Chaincase Fluid", partNumber: "62600025", isOem: true, manufacturer: "Harley-Davidson Inc", priceIDR: 280000 },
    ], serviceCost: 350000, gasFee: 100, costIDR: 630100, costUSDC: 39, costNOC: 63, costStr: "Rp 630,100", txSig: "X1oP...o99K", healthBefore: 90, healthAfter: 99, notes: "Tension adjusted.", images: [] },
  ]
};

export default function WorkshopVehicleProfile({ params }: { params: Promise<{ vin: string }> }) {
  const { vin } = use(params);
  const currVehicle = Object.values(vehicleData).find(v => v.vin === vin) || vehicleData.bmw_m4;
  const [data] = useState(timelineEvents[vin] || timelineEvents[vehicleData.bmw_m4.vin]);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/workshop/queue" className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="page-header">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Car className="w-7 h-7 text-teal-400" />
            Vehicle Profile
          </h1>
          <p className="text-sm mt-1 text-slate-400">Review past service logs to assist your diagnosis</p>
        </div>
        
        <Link href={`/workshop/viewer?vin=${currVehicle.vin}`} className="glow-btn-outline px-5 py-2.5 text-sm flex items-center gap-2" style={{ borderColor: 'var(--solana-cyan)', color: 'var(--solana-cyan)' }}>
          <Box className="w-4 h-4" /> View 3D Digital Twin
        </Link>
      </div>

      <div className="glass-card p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1 border-b border-slate-700/50 pb-3">{currVehicle.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">VIN</p>
                <p className="font-mono text-sm">{currVehicle.vin}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Owner</p>
                <p className="font-semibold text-white">{currVehicle.owner}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Health Score</p>
                <p className="font-semibold text-teal-400">{currVehicle.health} / 100</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">License Plate</p>
                <p className="font-mono text-sm">{currVehicle.licensePlate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-6">Service Timeline</h3>
      
      <div className="relative mt-8">
        <div className="absolute left-6 top-0 bottom-0 w-[2px] hidden md:block bg-gradient-to-b from-teal-500 to-teal-500/0" />

        <div className="flex flex-col gap-6">
          {data.map((event) => (
            <SharedServiceCard 
              key={event.id}
              event={event}
              userRole="workshop"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
