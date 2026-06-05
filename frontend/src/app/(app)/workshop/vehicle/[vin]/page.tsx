"use client";

import { useEffect, useState, use } from "react";
import { AlertCircle, ArrowLeft, Box, Car, Gauge } from "lucide-react";
import Link from "next/link";
import { SharedServiceCard, type ServiceEvent } from "@/components/ui/SharedServiceCard";
import { api, type ApiVehicle } from "@/lib/api/client";
import { mapBackendServiceTimelineEntry } from "@/lib/serviceEvents";

type ResolvedVehicle = ApiVehicle & {
  currentOwner?: { displayName?: string | null; email?: string | null; id?: string | null } | null;
};

function vehicleName(vehicle: ApiVehicle) {
  return `${vehicle.make} ${vehicle.model} ${vehicle.year}`.trim();
}

function ownerName(vehicle: ResolvedVehicle | null) {
  return vehicle?.currentOwner?.displayName || vehicle?.currentOwner?.email || (vehicle?.currentOwnerId ? "NOC User" : "-");
}

export default function WorkshopVehicleProfile({ params }: { params: Promise<{ vin: string }> }) {
  const { vin } = use(params);
  const decodedVin = decodeURIComponent(vin);
  const [vehicle, setVehicle] = useState<ResolvedVehicle | null>(null);
  const [data, setData] = useState<ServiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    void api.resolveVehicle(decodedVin)
      .then(async (response) => {
        if (cancelled) return;
        const resolved = response.vehicle as ResolvedVehicle;
        setVehicle(resolved);
        const timeline = await api.vehicleTimeline(resolved.id);
        if (cancelled) return;
        const events = timeline.items
          .map((entry, index) => mapBackendServiceTimelineEntry(entry, index, {
            health: resolved.healthScore,
            mileage: resolved.currentMileageKm.toLocaleString("id-ID"),
          }))
          .filter((event): event is ServiceEvent => Boolean(event));
        setData(events);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Vehicle profile tidak bisa dimuat.");
          setVehicle(null);
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [decodedVin]);

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

        <Link href={`/workshop/viewer?vin=${encodeURIComponent(vehicle?.vin ?? decodedVin)}`} className="glow-btn-outline px-5 py-2.5 text-sm flex items-center gap-2" style={{ borderColor: "var(--solana-cyan)", color: "var(--solana-cyan)" }}>
          <Box className="w-4 h-4" /> View 3D Digital Twin
        </Link>
      </div>

      {error && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card p-6 md:p-8 mb-8">
        {loading ? (
          <p className="text-sm text-slate-400">Loading vehicle profile...</p>
        ) : vehicle ? (
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1 border-b border-slate-700/50 pb-3">{vehicleName(vehicle)}</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">VIN</p>
                  <p className="font-mono text-sm">{vehicle.vin}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Owner</p>
                  <p className="font-semibold text-white">{ownerName(vehicle)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Health Score</p>
                  <p className="font-semibold text-teal-400">{vehicle.healthScore} / 100</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Mileage</p>
                  <p className="font-mono text-sm">{vehicle.currentMileageKm.toLocaleString("id-ID")} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">License Plate</p>
                  <p className="font-mono text-sm">{vehicle.licensePlate || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Vehicle data unavailable.</p>
        )}
      </div>

      <h3 className="text-xl font-bold mb-6">Service Timeline</h3>

      {data.length ? (
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
      ) : (
        <div className="glass-card p-8 text-center text-sm text-slate-400">
          <Gauge className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          Belum ada service log yang tercatat untuk kendaraan ini.
        </div>
      )}
    </div>
  );
}
