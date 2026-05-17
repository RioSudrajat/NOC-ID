"use client";

import Link from "next/link";
import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ComponentWearBars } from "@/components/trips/ComponentWearBars";
import { MetricsPanel } from "@/components/trips/MetricsPanel";
import { TripDetailMap } from "@/components/trips/TripDetailMap";
import { useTripStore } from "@/store/useTripStore";

function SpeedChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((speed, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 44 - (speed / max) * 38;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <div className="glass-card-static rounded-xl p-5">
      <h2 className="mb-4 text-sm font-bold tracking-wide">SPEED OVER TIME</h2>
      <svg viewBox="0 0 100 48" className="h-44 w-full overflow-visible">
        <line x1="0" y1="44" x2="100" y2="44" stroke="rgba(255,255,255,0.12)" />
        <line x1="0" y1="6" x2="0" y2="44" stroke="rgba(255,255,255,0.12)" />
        <polyline points={points} fill="none" stroke="#5EEAD4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function TripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const tripsByVehicle = useTripStore((state) => state.trips);
  const hydrated = useTripStore((state) => state.hydrated);
  const trip = useMemo(
    () => Object.values(tripsByVehicle).flatMap((items) => items ?? []).find((item) => item.id === params.tripId),
    [params.tripId, tripsByVehicle],
  );

  if (!hydrated) {
    return (
      <div className="glass-card-static rounded-xl p-10 text-center text-sm text-white/55">
        Loading trip detail...
      </div>
    );
  }

  if (!trip) notFound();

  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(trip.startedAt));
  const start = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(trip.startedAt));
  const end = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(trip.completedAt));

  return (
    <div>
      <div className="mb-6">
        <Link href="/dapp/trips" className="mb-4 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold md:text-3xl">Trip Detail</h1>
        <p className="mt-2 text-sm text-white/55">
          {date} · {trip.vehicleName} · {trip.ownerName} · {trip.licensePlate}
        </p>
      </div>

      <div className="mb-6 h-[360px] overflow-hidden rounded-2xl border border-white/10">
        <TripDetailMap route={trip.route} />
      </div>
      <p className="mb-6 text-sm text-white/55">{start} - {end} | GPS route recorded from this trip</p>

      <div className="glass-card-static mb-6 rounded-xl p-5">
        <MetricsPanel metrics={trip.metrics} />
      </div>

      <SpeedChart values={trip.route.map((point) => point.speedKmh)} />

      <div className="glass-card-static mt-6 rounded-xl p-5">
        <ComponentWearBars items={trip.componentWearAfter} showDelta />
      </div>
    </div>
  );
}
