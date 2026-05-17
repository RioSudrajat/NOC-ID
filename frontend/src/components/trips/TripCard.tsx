"use client";

import Link from "next/link";
import { ArrowRight, Fuel, Gauge, MapPin, Timer } from "lucide-react";
import { formatDuration, formatIdr } from "@/lib/tripMetrics";
import type { Trip } from "@/types/trip";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(trip.startedAt));
  const start = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(trip.startedAt));
  const end = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(trip.completedAt));

  return (
    <article className="glass-card p-5 hover:transform-none">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{date}</p>
          <p className="text-xs text-white/45">{start} - {end}</p>
        </div>
        <span className="mono text-xs text-white/55">{formatDuration(trip.metrics.durationSeconds)}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-center">
        <div className="h-24 overflow-hidden rounded-lg border border-white/10 bg-slate-950/60">
          <div className="relative h-full w-full">
            <svg viewBox="0 0 180 96" className="h-full w-full">
              <path d="M12 70 C45 22, 78 84, 112 34 S154 54, 168 22" fill="none" stroke="#5EEAD4" strokeWidth="4" strokeLinecap="round" />
              <circle cx="12" cy="70" r="5" fill="#86EFAC" />
              <circle cx="168" cy="22" r="5" fill="#FCA5A5" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-300" /> {trip.metrics.distanceKm.toFixed(1)} km</span>
          <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-teal-300" /> {Math.round(trip.metrics.avgSpeedKmh)} km/h</span>
          <span className="flex items-center gap-2"><Fuel className="h-4 w-4 text-teal-300" /> {trip.metrics.estimatedFuelLiters.toFixed(2)} L</span>
          <span className="flex items-center gap-2"><Timer className="h-4 w-4 text-teal-300" /> {formatIdr(trip.metrics.fuelCostIdr)}</span>
        </div>
        <Link href={`/dapp/trips/${trip.id}`} className="glow-btn-outline px-4 py-2 text-xs">
          Detail <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
