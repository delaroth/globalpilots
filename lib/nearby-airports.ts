// Nearby airport finder using haversine distance
// Uses airport-coordinates.ts for lat/lon and geolocation.ts majorAirports for the full list

import { getAirportCoords } from '@/data/airport-coordinates'
import { majorAirports } from '@/lib/geolocation'

interface NearbyAirport {
  code: string
  city: string
  country: string
  distanceKm: number
}

/**
 * Calculate the haversine distance between two points on Earth.
 * Returns distance in kilometers.
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Find airports within a given radius of the specified airport.
 * Returns airports sorted by distance (closest first), excluding the input airport.
 */
export function findNearbyAirports(
  iata: string,
  radiusKm: number = 200
): NearbyAirport[] {
  const originCoords = getAirportCoords(iata.toUpperCase())
  if (!originCoords) return []

  const results: NearbyAirport[] = []

  for (const airport of majorAirports) {
    // Skip the input airport itself
    if (airport.code.toUpperCase() === iata.toUpperCase()) continue

    const coords = getAirportCoords(airport.code)
    if (!coords) continue

    const dist = haversineDistance(
      originCoords.lat, originCoords.lon,
      coords.lat, coords.lon
    )

    if (dist <= radiusKm) {
      results.push({
        code: airport.code,
        city: airport.city,
        country: airport.country,
        distanceKm: Math.round(dist),
      })
    }
  }

  // Sort by distance, closest first
  results.sort((a, b) => a.distanceKm - b.distanceKm)

  return results
}
