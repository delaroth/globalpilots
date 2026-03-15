/**
 * SerpApi Google Travel Explore integration.
 *
 * This is the most efficient SerpApi endpoint for destination discovery:
 * 1 API call → 20-50 destinations with prices, best dates, airlines.
 *
 * Caching strategy:
 * - Application-level: 1-hour in-memory cache keyed by origin:month:duration:maxPrice
 * - SerpApi-level: identical queries cached for 1 hour (free, doesn't count as a search)
 * - Multiple features sharing the same origin benefit from a single cached call
 *
 * Used by: Mystery Vacation, Flight Search "Anywhere", Layover Explorer, Multi-City
 */

import { getSerpApiUsage } from './serpapi'

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
const BASE_URL = 'https://serpapi.com/search'

// ── Application-level cache (1 hour, supplements SerpApi's own cache) ────
interface CacheEntry {
  data: ExploreResult
  timestamp: number
}

const exploreCache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCacheKey(params: ExploreParams): string {
  return [
    params.origin,
    params.destination || 'anywhere',
    params.region || '',
    String(params.month ?? 0),
    String(params.travelDuration ?? 2),
    String(params.maxPrice ?? 0),
    String(params.stops ?? 0),
    params.interest || '',
  ].join(':')
}

function getFromCache(key: string): ExploreResult | null {
  const entry = exploreCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    exploreCache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: ExploreResult): void {
  // Limit cache size to prevent memory bloat in serverless
  if (exploreCache.size > 100) {
    const oldest = [...exploreCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    if (oldest) exploreCache.delete(oldest[0])
  }
  exploreCache.set(key, { data, timestamp: Date.now() })
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface ExploreParams {
  origin: string                         // IATA code (e.g., "JFK")
  destination?: string                   // IATA code for specific route, omit for "anywhere"
  region?: string                        // kgmid for region (e.g., "/m/02j9z" for Europe)
  month?: number                         // 0=all (next 6 months), 1-12 for specific month
  travelDuration?: 1 | 2 | 3            // 1=weekend, 2=1 week, 3=2 weeks
  maxPrice?: number                      // Max flight price
  stops?: 0 | 1 | 2 | 3                 // 0=any, 1=nonstop, 2=1 stop, 3=2 stops
  interest?: string                      // Destination interest filter
  type?: 1 | 2                           // 1=round trip, 2=one way
}

export interface ExploreDestination {
  name: string
  country: string
  airportCode: string
  flightPrice: number
  hotelPrice: number | null
  startDate: string                      // Best departure date (YYYY-MM-DD)
  endDate: string                        // Best return date (YYYY-MM-DD)
  airline: string
  airlineCode: string
  stops: number
  flightDuration: number                 // minutes
  thumbnail: string | null
  latitude: number | null
  longitude: number | null
}

export interface ExploreFlightOption {
  departureAirport: { name: string; id: string }
  arrivalAirport: { name: string; id: string }
  duration: number
  price: number
  isCheapest: boolean
  stops: number
  airline: string
  airlineCode: string
}

export interface ExploreResult {
  destinations: ExploreDestination[]
  flights: ExploreFlightOption[]         // Only populated for specific route queries
  startDate: string | null               // Overall best dates from Explore
  endDate: string | null
  source: 'serpapi-explore'
  isLive: true
  fetchedAt: number
}

// ── Region kgmids ─────────────────────────────────────────────────────────

export const REGIONS = {
  anywhere: undefined,                    // Omit arrival for global search
  europe: '/m/02j9z',
  asia: '/m/0j0k',
  southeast_asia: '/m/04w8f',
  north_america: '/m/059j2',
  south_america: '/m/0dg3n1',
  africa: '/m/0dg3n1',
  oceania: '/m/05nrg',
  middle_east: '/m/04hhpf',
  caribbean: '/m/02qkt',
} as const

// ── Interest kgmids ───────────────────────────────────────────────────────

export const INTERESTS = {
  popular: '0',
  outdoors: '/g/11bc58l13w',
  beaches: '/m/0b3yr',
  museums: '/m/09cmq',
  history: '/m/03g3w',
  skiing: '/m/071k0',
} as const

// ── Core API ──────────────────────────────────────────────────────────────

/**
 * Discover destinations from an origin using Google Travel Explore.
 *
 * 1 API call returns 20-50 destinations with:
 * - Flight prices (real-time from Google)
 * - Hotel prices
 * - Best travel dates pre-calculated
 * - Airlines, stops, duration
 *
 * Results are cached for 1 hour (app-level + SerpApi-level).
 */
export async function exploreDestinations(params: ExploreParams): Promise<ExploreResult> {
  const cacheKey = getCacheKey(params)
  const cached = getFromCache(cacheKey)
  if (cached) {
    console.log(`[SerpApi Explore] Cache hit: ${cacheKey}`)
    return cached
  }

  // Check quota
  const usage = getSerpApiUsage()
  if (!SERPAPI_KEY || usage.remaining <= 2) {
    console.log(`[SerpApi Explore] Quota low (${usage.remaining} remaining), returning empty`)
    return emptyResult()
  }

  const searchParams: Record<string, string> = {
    engine: 'google_travel_explore',
    api_key: SERPAPI_KEY,
    currency: 'USD',
    hl: 'en',
    departure_id: params.origin,
    travel_mode: '1', // flights only
  }

  // Destination (anywhere, region, or specific)
  if (params.destination) {
    searchParams.arrival_id = params.destination
  } else if (params.region) {
    searchParams.arrival_area_id = params.region
  }
  // If neither set → "anywhere" (default behavior)

  // Date flexibility
  if (params.month !== undefined) {
    searchParams.month = String(params.month)
  }
  if (params.travelDuration) {
    searchParams.travel_duration = String(params.travelDuration)
  }

  // Filters
  if (params.maxPrice) {
    searchParams.max_price = String(params.maxPrice)
  }
  if (params.stops) {
    searchParams.stops = String(params.stops)
  }
  if (params.interest) {
    searchParams.interest = params.interest
  }
  if (params.type) {
    searchParams.type = String(params.type)
  }

  const url = `${BASE_URL}?${new URLSearchParams(searchParams).toString()}`
  console.log(`[SerpApi Explore] Fetching: ${params.origin} → ${params.destination || 'anywhere'}, month=${params.month ?? 0}`)

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) {
      console.error(`[SerpApi Explore] HTTP ${response.status}`)
      return emptyResult()
    }

    const data = await response.json()

    if (data.error) {
      console.error(`[SerpApi Explore] API error: ${data.error}`)
      return emptyResult()
    }

    const result = parseExploreResponse(data)
    setCache(cacheKey, result)

    console.log(`[SerpApi Explore] Found ${result.destinations.length} destinations, ${result.flights.length} flights`)
    return result
  } catch (err) {
    console.warn(`[SerpApi Explore] Failed:`, err instanceof Error ? err.message : err)
    return emptyResult()
  }
}

function parseExploreResponse(data: any): ExploreResult {
  const destinations: ExploreDestination[] = (data.destinations || []).map((d: any) => ({
    name: d.name || '',
    country: d.country || '',
    airportCode: d.destination_airport?.code || '',
    flightPrice: d.flight_price || 0,
    hotelPrice: d.hotel_price || null,
    startDate: d.start_date || '',
    endDate: d.end_date || '',
    airline: d.airline || '',
    airlineCode: d.airline_code || '',
    stops: d.number_of_stops ?? 0,
    flightDuration: d.flight_duration || 0,
    thumbnail: d.thumbnail || null,
    latitude: d.gps_coordinates?.latitude || null,
    longitude: d.gps_coordinates?.longitude || null,
  }))

  const flights: ExploreFlightOption[] = (data.flights || []).map((f: any) => ({
    departureAirport: {
      name: f.departure_airport?.name || '',
      id: f.departure_airport?.id || '',
    },
    arrivalAirport: {
      name: f.arrival_airport?.name || '',
      id: f.arrival_airport?.id || '',
    },
    duration: f.duration || 0,
    price: f.price || 0,
    isCheapest: f.cheapest_flight || false,
    stops: f.number_of_stops ?? 0,
    airline: f.airline || '',
    airlineCode: f.airline_code || '',
  }))

  return {
    destinations,
    flights,
    startDate: data.start_date || null,
    endDate: data.end_date || null,
    source: 'serpapi-explore',
    isLive: true,
    fetchedAt: Date.now(),
  }
}

function emptyResult(): ExploreResult {
  return {
    destinations: [],
    flights: [],
    startDate: null,
    endDate: null,
    source: 'serpapi-explore',
    isLive: true,
    fetchedAt: Date.now(),
  }
}

// ── Convenience functions for specific use cases ──────────────────────────

/**
 * Find cheapest destinations from an origin (for Mystery Vacation + Anywhere search).
 * 1 API call, cached for 1 hour.
 */
export async function findCheapestDestinations(params: {
  origin: string
  maxPrice?: number
  month?: number
  travelDuration?: 1 | 2 | 3
  region?: string
  interest?: string
}): Promise<ExploreDestination[]> {
  const result = await exploreDestinations({
    origin: params.origin,
    maxPrice: params.maxPrice,
    month: params.month,
    travelDuration: params.travelDuration,
    region: params.region,
    interest: params.interest,
  })
  return result.destinations.sort((a, b) => a.flightPrice - b.flightPrice)
}

/**
 * Get flight options for a specific route (for route comparison).
 * 1 API call, cached for 1 hour.
 */
export async function getRouteFlights(params: {
  origin: string
  destination: string
  month?: number
  travelDuration?: 1 | 2 | 3
}): Promise<ExploreFlightOption[]> {
  const result = await exploreDestinations({
    origin: params.origin,
    destination: params.destination,
    month: params.month,
    travelDuration: params.travelDuration,
  })
  return result.flights.sort((a, b) => a.price - b.price)
}

/**
 * Map a vibe keyword to an Explore interest filter.
 */
export function vibeToInterest(vibes: string[]): string | undefined {
  const vibeMap: Record<string, string> = {
    beach: INTERESTS.beaches,
    beaches: INTERESTS.beaches,
    'sun & sand': INTERESTS.beaches,
    nature: INTERESTS.outdoors,
    outdoors: INTERESTS.outdoors,
    adventure: INTERESTS.outdoors,
    hiking: INTERESTS.outdoors,
    culture: INTERESTS.history,
    history: INTERESTS.history,
    museums: INTERESTS.museums,
    art: INTERESTS.museums,
    skiing: INTERESTS.skiing,
    snow: INTERESTS.skiing,
    winter: INTERESTS.skiing,
  }

  for (const vibe of vibes) {
    const key = vibe.toLowerCase().trim()
    if (vibeMap[key]) return vibeMap[key]
  }
  return undefined
}

/**
 * Convert travel days to Explore duration parameter.
 */
export function daysToTravelDuration(days: number): 1 | 2 | 3 {
  if (days <= 4) return 1  // weekend
  if (days <= 10) return 2 // 1 week
  return 3                  // 2 weeks
}

/**
 * Convert a date string to a month number (1-12), or 0 for "anytime".
 */
export function dateToMonth(dateStr: string | undefined): number {
  if (!dateStr || dateStr === 'flexible' || dateStr === 'anytime') return 0
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return 0
  return d.getMonth() + 1 // 1-indexed
}
