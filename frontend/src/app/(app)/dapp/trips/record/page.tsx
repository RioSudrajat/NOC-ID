"use client";

import Link from "next/link";
import { Activity, ChevronDown, Map, Play } from "lucide-react";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import type { VehicleKey } from "@/types/vehicle";
import { formatIdr } from "@/lib/tripMetrics";
import { selectTripsForVehicle, useTripStore } from "@/store/useTripStore";
import { TripCard } from "@/components/trips/TripCard";

export default function TripRecordListPage() {
  const ctx = useActiveVehicle();
  const activeVehicle = ctx?.activeVehicle ?? "bmw_m4";
  const setActiveVehicle = ctx?.setActiveVehicle ?? (() => {});
  const trips = useTripStore((state) => selectTripsForVehicle(state, activeVehicle));
  const totals = trips.reduce(
    (acc, trip) => ({
      distanceKm: acc.distanceKm + trip.metrics.distanceKm,
      fuelLiters: acc.fuelLiters + trip.metrics.estimatedFuelLiters,
      fuelCostIdr: acc.fuelCostIdr + trip.metrics.fuelCostIdr,
    }),
    { distanceKm: 0, fuelLiters: 0, fuelCostIdr: 0 },
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Activity className="h-7 w-7" style={{ color: "var(--solana-green)" }} />
            <h1 className="text-2xl font-bold md:text-3xl">Trip Records</h1>
          </div>
          <p className="text-sm text-white/55">Riwayat perjalanan lokal per kendaraan.</p>
        </div>
        <Link href="/dapp/trips" className="glow-btn gap-2 px-5 py-3 text-sm">
          <Map className="h-4 w-4" /> Live Map
        </Link>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[320px_1fr]">
        <label className="relative block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-white/45">Vehicle Selector</span>
          <select
            value={activeVehicle}
            onChange={(event) => setActiveVehicle(event.target.value as VehicleKey)}
            className="input-field appearance-none pr-10"
          >
            {(Object.keys(vehicleData) as VehicleKey[]).map((key) => (
              <option key={key} value={key}>{vehicleData[key].name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-white/45" />
        </label>
        <div className="glass-card-static grid grid-cols-2 gap-4 rounded-xl p-5 md:grid-cols-4">
          <div>
            <p className="text-xs text-white/45">Bulan ini</p>
            <p className="text-lg font-bold">Mei 2026</p>
          </div>
          <div>
            <p className="text-xs text-white/45">Trips</p>
            <p className="text-lg font-bold">{trips.length}</p>
          </div>
          <div>
            <p className="text-xs text-white/45">Distance</p>
            <p className="text-lg font-bold">{totals.distanceKm.toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-xs text-white/45">Fuel</p>
            <p className="text-lg font-bold">{totals.fuelLiters.toFixed(1)} L · {formatIdr(totals.fuelCostIdr)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        {trips.length === 0 ? (
          <div className="glass-card-static rounded-xl p-10 text-center text-sm text-white/55">
            <Play className="mx-auto mb-3 h-8 w-8 opacity-40" />
            Belum ada trip untuk {vehicleData[activeVehicle].name}.
          </div>
        ) : null}
      </div>
    </div>
  );
}
