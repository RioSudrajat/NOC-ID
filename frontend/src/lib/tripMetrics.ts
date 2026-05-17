import type { GasolineMetrics, TripPoint } from "@/types/trip";
import type { VehicleIdentity } from "@/types/vehicle";

const EARTH_RADIUS_KM = 6371;
const CO2_KG_PER_LITER_GASOLINE = 2.31;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: TripPoint, b: TripPoint) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function calculateDistanceKm(route: TripPoint[]) {
  let total = 0;
  for (let i = 1; i < route.length; i += 1) {
    total += haversineKm(route[i - 1], route[i]);
  }
  return total;
}

export function getSpeedFactor(avgSpeedKmh: number) {
  if (avgSpeedKmh < 30) return 1.4;
  if (avgSpeedKmh < 60) return 1;
  if (avgSpeedKmh < 90) return 0.85;
  return 1.2;
}

function elapsedSeconds(a: TripPoint, b: TripPoint) {
  return Math.max(0, (b.timestamp - a.timestamp) / 1000);
}

type MetricsVehicle = Pick<VehicleIdentity, "baseConsumptionPerKm" | "fuelPricePerLiter">;

export function calculateGasolineMetrics(
  route: TripPoint[],
  vehicle: MetricsVehicle,
): GasolineMetrics {
  if (route.length === 0) {
    return {
      distanceKm: 0,
      durationSeconds: 0,
      avgSpeedKmh: 0,
      maxSpeedKmh: 0,
      estimatedFuelLiters: 0,
      fuelEfficiencyKmPerL: 0,
      co2EstimateKg: 0,
      fuelCostIdr: 0,
      idleTimeSeconds: 0,
      stopCount: 0,
      hardAccelerationCount: 0,
      hardBrakingCount: 0,
      elevationGainM: 0,
    };
  }

  const distanceKm = calculateDistanceKm(route);
  let activeSeconds = 0;
  let idleTimeSeconds = 0;
  let stopCount = 0;
  let hardAccelerationCount = 0;
  let hardBrakingCount = 0;
  let elevationGainM = 0;
  let maxSpeedKmh = 0;

  for (let i = 0; i < route.length; i += 1) {
    const point = route[i];
    maxSpeedKmh = Math.max(maxSpeedKmh, point.speedKmh);

    if (i === 0) continue;
    const prev = route[i - 1];
    const segmentSeconds = elapsedSeconds(prev, point);
    if (point.speedKmh > 2) activeSeconds += segmentSeconds;
    if (point.speedKmh < 2) idleTimeSeconds += segmentSeconds;
    if (prev.speedKmh > 2 && point.speedKmh <= 2) stopCount += 1;

    const secondsForDelta = Math.max(1, segmentSeconds);
    const normalizedDelta = ((point.speedKmh - prev.speedKmh) / secondsForDelta) * 3;
    if (normalizedDelta > 20) hardAccelerationCount += 1;
    if (normalizedDelta < -20) hardBrakingCount += 1;

    if (typeof point.altitude === "number" && typeof prev.altitude === "number") {
      elevationGainM += Math.max(0, point.altitude - prev.altitude);
    }
  }

  const avgSpeedKmh = activeSeconds > 0 ? distanceKm / (activeSeconds / 3600) : 0;
  const estimatedFuelLiters =
    distanceKm * vehicle.baseConsumptionPerKm * getSpeedFactor(avgSpeedKmh);

  return {
    distanceKm,
    durationSeconds: activeSeconds,
    avgSpeedKmh,
    maxSpeedKmh,
    estimatedFuelLiters,
    fuelEfficiencyKmPerL: estimatedFuelLiters > 0 ? distanceKm / estimatedFuelLiters : 0,
    co2EstimateKg: estimatedFuelLiters * CO2_KG_PER_LITER_GASOLINE,
    fuelCostIdr: estimatedFuelLiters * vehicle.fuelPricePerLiter,
    idleTimeSeconds,
    stopCount,
    hardAccelerationCount,
    hardBrakingCount,
    elevationGainM,
  };
}

export function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatIdr(value: number) {
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} jt`;
  if (value >= 1000) return `Rp ${(value / 1000).toFixed(1)}k`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}
