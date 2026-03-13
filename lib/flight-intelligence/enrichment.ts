// ─── Metadata Enrichment Service ───
// Placeholder for Phase 4: AeroDataBox integration.
// Enriches FlightOffers with aircraft specs, on-time performance, and live gate status.
//
// Currently returns offers unchanged. When AeroDataBox is connected,
// this will hydrate the `aircraft` and `operatingAirline` fields on each segment.

import type { FlightOffer, FlightSegment } from '@/lib/flight-providers/types'

export interface AircraftSpec {
  type: string           // e.g. "Boeing 787-9 Dreamliner"
  iataCode: string       // e.g. "789"
  manufacturer: string   // "Boeing" | "Airbus" | etc.
  widebody: boolean
  maxPassengers?: number
  rangeKm?: number
}

export interface OnTimePerformance {
  flightNumber: string
  airline: string
  /** Percentage of flights on time (within 15 min) over last 90 days */
  onTimePercent: number
  /** Average delay in minutes (positive = late, negative = early) */
  avgDelayMinutes: number
  /** Number of cancellations in last 90 days */
  cancellations: number
  /** Sample size */
  totalFlights: number
}

export interface GateStatus {
  flightNumber: string
  departureGate?: string
  arrivalGate?: string
  terminal?: string
  status: 'scheduled' | 'boarding' | 'departed' | 'landed' | 'cancelled' | 'delayed'
  estimatedDepartureTime?: string
  estimatedArrivalTime?: string
}

export interface EnrichedSegment extends FlightSegment {
  aircraftSpec?: AircraftSpec
  onTimePerformance?: OnTimePerformance
  gateStatus?: GateStatus
}

export interface EnrichedOffer extends FlightOffer {
  enrichedSegments?: EnrichedSegment[]
  /** Overall on-time score for the itinerary (average across segments) */
  reliabilityScore?: number
}

// ─── Feature Flag ───
const AERODATABOX_ENABLED = !!process.env.AERODATABOX_API_KEY

/**
 * Enrich flight offers with external metadata.
 *
 * Phase 4 implementation will:
 * 1. Extract unique flightNumber+date combos from all segments
 * 2. Batch-fetch aircraft specs from AeroDataBox `/flights/number/{flightNumber}/{date}`
 * 3. Fetch on-time stats from `/health/airline/{iata}/flight/{flightNumber}`
 * 4. Attach data to matching segments
 *
 * Currently: passthrough. Returns offers unchanged.
 */
export async function enrichOffers(offers: FlightOffer[]): Promise<EnrichedOffer[]> {
  if (!AERODATABOX_ENABLED) {
    // No enrichment available — return as-is with type cast
    return offers.map(o => ({ ...o }))
  }

  // Phase 4 TODO: implement AeroDataBox calls here
  // const uniqueFlights = extractUniqueFlights(offers)
  // const specs = await batchFetchAircraftSpecs(uniqueFlights)
  // const perf = await batchFetchOnTimePerformance(uniqueFlights)
  // return attachEnrichmentData(offers, specs, perf)

  return offers.map(o => ({ ...o }))
}

/**
 * Enrich a single segment (used by real-time gate status polling).
 * Phase 4: will call AeroDataBox `/flights/number/{fn}/{date}` endpoint.
 */
export async function enrichSegment(segment: FlightSegment): Promise<EnrichedSegment> {
  if (!AERODATABOX_ENABLED || !segment.flightNumber) {
    return { ...segment }
  }

  // Phase 4 TODO: AeroDataBox real-time lookup
  // const data = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${segment.flightNumber}/${date}`)
  return { ...segment }
}

/**
 * Calculate reliability score for an offer based on its segments' on-time performance.
 * Returns a 0-100 score. Phase 4 will populate this from real data.
 */
export function calculateReliabilityScore(segments: EnrichedSegment[]): number | undefined {
  const scores = segments
    .map(s => s.onTimePerformance?.onTimePercent)
    .filter((s): s is number => s !== undefined)

  if (scores.length === 0) return undefined
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}
