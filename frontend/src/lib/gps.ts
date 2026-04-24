/**
 * GPS utilities for Nemesis Protocol
 * MVP: Uses browser Geolocation API (phone-based)
 */

export interface Coordinates {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: number
}

/**
 * Start watching GPS position via browser Geolocation API
 * Returns watchId — pass to stopGPS() to stop
 */
export function startGPS(
  onPosition: (coords: Coordinates) => void,
  onError?: (error: GeolocationPositionError) => void
): number | null {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.warn('Geolocation not supported')
    return null
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      })
    },
    (error) => {
      console.error('GPS error:', error)
      onError?.(error)
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,      // 10 seconds
      timeout: 15000,
    }
  )

  return watchId
}

/** Stop GPS watching */
export function stopGPS(watchId: number): void {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calcDistanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Simple trip detection:
 * A trip starts when speed > 10 km/h for > 5 minutes
 * For mock/demo, returns true if coords differ enough
 */
export function detectTripStart(
  prevCoords: Coordinates,
  currCoords: Coordinates,
  intervalSeconds = 10
): boolean {
  const distKm = calcDistanceKm(prevCoords, currCoords)
  const speedKmh = (distKm / intervalSeconds) * 3600
  return speedKmh > 10
}

/**
 * Generate a mock Solana-style transaction hash for demo
 */
export function mockOnChainHash(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/**
 * Anonymize a unit ID for public display
 * #NMS-0042 → #NMS-0**
 */
export function anonymizeUnitId(unitId: string): string {
  return unitId.replace(/-(\d{2})(\d{2})$/, '-$1**')
}
