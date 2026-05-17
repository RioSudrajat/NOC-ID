"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Fuel,
  Gauge,
  History,
  MapPin,
  Pause,
  Play,
  ListChecks,
  Satellite,
  Square,
  Timer,
  UserRound,
} from "lucide-react";
import { ComponentWearBars } from "@/components/trips/ComponentWearBars";
import { TripRecordMap } from "@/components/trips/TripRecordMap";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { formatDuration, haversineKm } from "@/lib/tripMetrics";
import { metricsOrEmpty, selectWearForVehicle, useTripStore } from "@/store/useTripStore";
import type { GasolineMetrics, TripPoint } from "@/types/trip";

function pointFromPosition(position: GeolocationPosition, previous?: TripPoint): TripPoint {
  const timestamp = position.timestamp || Date.now();
  let speedKmh = typeof position.coords.speed === "number" && position.coords.speed > 0
    ? position.coords.speed * 3.6
    : 0;

  if (!speedKmh && previous) {
    const next = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speedKmh: 0,
      timestamp,
    };
    const hours = Math.max(1 / 3600, (timestamp - previous.timestamp) / 3600000);
    speedKmh = haversineKm(previous, next) / hours;
  }

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    altitude: position.coords.altitude ?? undefined,
    speedKmh,
    timestamp,
  };
}

function MetricItem({
  icon: Icon,
  label,
  value,
  accent = "#5EEAD4",
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="min-w-0 py-2">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </div>
      <p className="truncate text-2xl font-black leading-none text-white">{value}</p>
    </div>
  );
}

function CompactMetrics({ metrics }: { metrics: GasolineMetrics }) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Today&apos;s Activity</p>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        <MetricItem icon={MapPin} label="Distance" value={`${metrics.distanceKm.toFixed(1)} km`} accent="#22D3EE" />
        <MetricItem icon={Timer} label="Active" value={formatDuration(metrics.durationSeconds)} accent="#FACC15" />
        <MetricItem icon={Gauge} label="Avg Speed" value={`${Math.round(metrics.avgSpeedKmh)} km/h`} accent="#FB7185" />
        <MetricItem icon={Fuel} label="Fuel" value={`${metrics.estimatedFuelLiters.toFixed(1)} L`} accent="#5EEAD4" />
        <MetricItem icon={Gauge} label="Max" value={`${Math.round(metrics.maxSpeedKmh)} km/h`} accent="#38BDF8" />
        <MetricItem icon={Timer} label="Idle" value={formatDuration(metrics.idleTimeSeconds)} accent="#34D399" />
      </div>
    </section>
  );
}

function LiveMapTopBar({ owner, vehicleName, plate }: { owner: string; vehicleName: string; plate: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B111A]/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-teal-300/25 bg-teal-300/10 text-teal-200">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{owner}</p>
          <p className="text-[10px] text-white/45">{plate} · {vehicleName}</p>
        </div>
        <Link href="/dapp/trips/record" className="ml-3 rounded-full p-2 text-white/45 transition-colors hover:bg-white/5 hover:text-white" aria-label="Open trip records">
          <History className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function TripLiveMapPage() {
  const router = useRouter();
  const ctx = useActiveVehicle();
  const activeVehicle = ctx?.activeVehicle ?? "bmw_m4";
  const vehicle = vehicleData[activeVehicle];
  const recording = useTripStore((state) => state.recording);
  const startRecording = useTripStore((state) => state.startRecording);
  const pauseRecording = useTripStore((state) => state.pauseRecording);
  const resumeRecording = useTripStore((state) => state.resumeRecording);
  const stopRecording = useTripStore((state) => state.stopRecording);
  const wear = useTripStore((state) => selectWearForVehicle(state, activeVehicle));
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [gpsMode, setGpsMode] = useState<"idle" | "locating" | "real" | "error">("idle");
  const watchId = useRef<number | null>(null);
  const liveMetrics = useMemo(() => metricsOrEmpty(recording.liveMetrics), [recording.liveMetrics]);
  const isRecording = recording.status === "recording";
  const activeRoute = recording.route;

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const startGps = () => {
    setGpsEnabled(true);
    setGpsMode("locating");

    if (!("geolocation" in navigator)) {
      setGpsEnabled(false);
      setGpsMode("error");
      window.alert("Browser ini tidak mendukung GPS/geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const firstPoint = pointFromPosition(position);
        setGpsMode("real");
        startRecording(activeVehicle, firstPoint);
        watchId.current = navigator.geolocation.watchPosition(
          (nextPosition) => {
            setGpsMode("real");
            useTripStore.getState().addPoint(pointFromPosition(nextPosition, useTripStore.getState().recording.route.at(-1)));
          },
          () => setGpsMode("error"),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
        );
      },
      (error) => {
        setGpsEnabled(false);
        setGpsMode("error");
        window.alert(error.message || "Gagal mendapatkan posisi GPS.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
  };

  const finishTrip = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    const trip = stopRecording();
    setGpsEnabled(false);
    setGpsMode("idle");
    if (trip) router.push(`/dapp/trips/${trip.id}`);
  };

  const toggleGps = () => {
    if (recording.status === "idle") {
      startGps();
      return;
    }
    if (window.confirm("Stop trip dan simpan record lokal?")) finishTrip();
  };

  return (
    <div className="-m-6 min-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-white/10 md:-m-12 md:mt-0">
      <div className="relative h-[calc(100dvh-7rem)] min-h-[520px]">
        <TripRecordMap route={activeRoute} />
        <LiveMapTopBar owner={vehicle.owner} vehicleName={vehicle.name} plate={vehicle.licensePlate} />

        <Link
          href="/dapp/trips/record"
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-[#0B111A]/90 px-4 py-3 text-xs font-black text-teal-100 shadow-2xl transition-colors hover:bg-teal-300/15"
        >
          <ListChecks className="h-4 w-4" />
          Records
        </Link>

        <button
          onClick={toggleGps}
          className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border px-4 py-3 text-xs font-black shadow-2xl"
          style={{
            background: gpsEnabled ? "rgba(22, 163, 74, 0.92)" : "rgba(239, 68, 68, 0.92)",
            borderColor: gpsEnabled ? "rgba(94, 234, 212, 0.45)" : "rgba(252, 165, 165, 0.45)",
            color: gpsEnabled ? "#D1FAE5" : "#FFE4E6",
          }}
        >
          <Satellite className="h-4 w-4" />
          GPS {gpsEnabled ? "ON" : "OFF"}
          {gpsEnabled ? <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> : null}
        </button>

        {recording.status !== "idle" ? (
          <div className="absolute right-4 top-36 z-10 flex flex-col gap-3">
            <button
              type="button"
              onClick={isRecording ? pauseRecording : resumeRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0B111A]/90 text-white shadow-2xl transition-colors hover:bg-white/10"
              aria-label={isRecording ? "Pause recording" : "Resume recording"}
            >
              {isRecording ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={finishTrip}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-300/20 bg-rose-500/90 text-white shadow-2xl transition-colors hover:bg-rose-400"
              aria-label="Stop recording"
            >
              <Square className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <div className="absolute inset-x-3 bottom-0 z-10 mx-auto flex max-h-[42dvh] max-w-[620px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-[#07101B]/95 px-6 pb-0 pt-3 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setSheetExpanded((expanded) => !expanded)}
            className="mx-auto mb-4 flex h-8 w-24 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/5 hover:text-white"
            aria-expanded={sheetExpanded}
            aria-label={sheetExpanded ? "Collapse trip panel" : "Expand trip panel"}
          >
            <span className="mr-2 h-1 w-12 rounded-full bg-white/25" />
            {sheetExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          <div className={sheetExpanded ? "shrink-0 flex items-center justify-between gap-4 border-b border-white/10 pb-4" : "shrink-0 flex items-center justify-between gap-4 pb-6"}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/25 bg-teal-300/10">
                <Satellite className="h-4 w-4 text-teal-200" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{vehicle.licensePlate} · {vehicle.name}</p>
                <p className="text-xs text-white/45">{vehicle.owner}</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black text-emerald-300">
              {recording.status === "idle" ? gpsMode.toUpperCase() : recording.status.toUpperCase()}
            </span>
          </div>

          {sheetExpanded ? (
            <div className="-mx-6 min-h-0 flex-1 overflow-y-auto py-5 pl-6 pr-2">
              <div className="pr-5">
                <CompactMetrics metrics={liveMetrics} />
                <div className="my-5 h-px bg-white/10" />
                <ComponentWearBars items={wear} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
