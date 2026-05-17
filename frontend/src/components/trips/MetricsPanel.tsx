"use client";

import { Activity, CircleDot, Fuel, Gauge, MapPin, Pause, Timer, TrendingDown, Zap } from "lucide-react";
import { formatDuration, formatIdr } from "@/lib/tripMetrics";
import type { GasolineMetrics } from "@/types/trip";

interface MetricsPanelProps {
  metrics: GasolineMetrics;
}

function MetricCell({ icon: Icon, value, label }: { icon: typeof MapPin; value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--solana-green)" }} />
        <span className="truncate text-sm font-bold">{value}</span>
      </div>
      <p className="truncate text-[10px] uppercase tracking-wide text-white/45">{label}</p>
    </div>
  );
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4" style={{ color: "var(--solana-green)" }} />
        <h2 className="text-sm font-bold tracking-wide">TODAY&apos;S ACTIVITY</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricCell icon={MapPin} value={`${metrics.distanceKm.toFixed(1)} km`} label="Distance" />
        <MetricCell icon={Timer} value={formatDuration(metrics.durationSeconds)} label="Active Time" />
        <MetricCell icon={Gauge} value={`${Math.round(metrics.avgSpeedKmh)} km/h`} label="Avg Speed" />
        <MetricCell icon={CircleDot} value={`${Math.round(metrics.maxSpeedKmh)} km/h`} label="Max Speed" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricCell icon={Fuel} value={`${metrics.estimatedFuelLiters.toFixed(2)} L`} label="Fuel Est." />
        <MetricCell icon={Activity} value={`${metrics.fuelEfficiencyKmPerL.toFixed(1)} km/L`} label="Efficiency" />
        <MetricCell icon={TrendingDown} value={`${metrics.co2EstimateKg.toFixed(2)} kg`} label="CO2 Est." />
        <MetricCell icon={Gauge} value={formatIdr(metrics.fuelCostIdr)} label="Fuel Cost" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricCell icon={Pause} value={formatDuration(metrics.idleTimeSeconds)} label="Idle Time" />
        <MetricCell icon={CircleDot} value={`${metrics.stopCount} stop`} label="Stop Count" />
        <MetricCell icon={Zap} value={`${metrics.hardAccelerationCount} accel`} label="Hard Accel" />
        <MetricCell icon={TrendingDown} value={`${metrics.hardBrakingCount} brake`} label="Hard Brake" />
      </div>
    </section>
  );
}
