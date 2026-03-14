// ─── FlightAPI.io Integration ───
// Live flight price data from 700+ airlines.
// Credit-based: each search costs 2 credits.
//
// Credit Management Strategy:
// - Credits are precious (30 free, then $49/mo for 30k)
// - Only use FlightAPI for Tier 2 searches (user explicitly triggers a price check)
// - Never use for browse/discovery (that's TravelPayouts' job)
// - Track remaining credits and auto-disable when exhausted
// - Fall back to Kiwi → TravelPayouts when credits are gone
//
// API: https://api.flightapi.io/onewaytrip/<key>/<from>/<to>/<date>/<adults>/<children>/<infants>/<cabin>/<currency>
// Response: { itineraries, legs, segments, places, carriers, agents }
// Cost: 2 credits per request

const FLIGHTAPI_KEY = process.env.FLIGHTAPI_KEY

// ─── Credit Tracking ───
// In-memory credit tracker. Resets on server restart.
// For production: persist to Supabase or Redis.

interface CreditState {
  remaining: number
  lastUpdated: number
  totalUsed: number
  disabled: boolean   // Auto-disabled when credits hit 0
}

let creditState: CreditState = {
  remaining: parseInt(process.env.FLIGHTAPI_CREDITS || '30', 10),
  lastUpdated: Date.now(),
  totalUsed: 0,
  disabled: false,
}

const CREDITS_PER_REQUEST = 2

/**
 * Check if FlightAPI.io is available and has credits remaining.
 */
export function isFlightApiAvailable(): boolean {
  if (!FLIGHTAPI_KEY) return false
  if (creditState.disabled) return false
  if (creditState.remaining < CREDITS_PER_REQUEST) {
    creditState.disabled = true
    console.log('[FlightAPI] No credits remaining — auto-disabled')
    return false
  }
  return true
}

/**
 * Get current credit status (for admin/debug endpoints).
 */
export function getCreditStatus(): CreditState {
  return { ...creditState }
}

/**
 * Manually set credits (e.g. after purchasing more or checking dashboard).
 */
export function setCredits(credits: number): void {
  creditState.remaining = credits
  creditState.disabled = credits < CREDITS_PER_REQUEST
  creditState.lastUpdated = Date.now()
  console.log(`[FlightAPI] Credits manually set to ${credits}`)
}

/**
 * Re-enable FlightAPI after adding credits.
 */
export function enableFlightApi(credits: number): void {
  setCredits(credits)
  creditState.disabled = false
}

function deductCredits(): void {
  creditState.remaining = Math.max(0, creditState.remaining - CREDITS_PER_REQUEST)
  creditState.totalUsed += CREDITS_PER_REQUEST
  creditState.lastUpdated = Date.now()

  if (creditState.remaining < CREDITS_PER_REQUEST) {
    creditState.disabled = true
    console.log(`[FlightAPI] Credits exhausted (${creditState.totalUsed} total used) — auto-disabled`)
  } else {
    console.log(`[FlightAPI] ${creditState.remaining} credits remaining`)
  }
}

// ─── API Types ───

interface FlightApiItinerary {
  id: string
  leg_ids: string[]
  pricing_options: {
    price: { amount: string; update_status: string }
    agent_ids: string[]
    url?: string
  }[]
}

interface FlightApiLeg {
  id: string
  origin: string          // Place ID
  destination: string     // Place ID
  departure: string       // ISO datetime
  arrival: string         // ISO datetime
  duration: number        // Minutes
  stop_count: number
  carrier_ids: string[]
  segment_ids: string[]
}

interface FlightApiSegment {
  id: string
  origin: string          // Place ID
  destination: string     // Place ID
  departure: string
  arrival: string
  duration: number
  carrier_id: string
  flight_number?: string
}

interface FlightApiPlace {
  id: string
  iata: string
  name: string
  type: string
}

interface FlightApiCarrier {
  id: string
  name: string
  iata?: string
  logo_url?: string
}

interface FlightApiAgent {
  id: string
  name: string
  url?: string
}

interface FlightApiResponse {
  itineraries: Record<string, FlightApiItinerary> | FlightApiItinerary[]
  legs: Record<string, FlightApiLeg> | FlightApiLeg[]
  segments: Record<string, FlightApiSegment> | FlightApiSegment[]
  places: Record<string, FlightApiPlace> | FlightApiPlace[]
  carriers: Record<string, FlightApiCarrier> | FlightApiCarrier[]
  agents: Record<string, FlightApiAgent> | FlightApiAgent[]
}

// ─── Normalization Helpers ───

/** FlightAPI returns either objects or arrays — normalize to array */
function toArray<T extends { id: string }>(data: Record<string, T> | T[] | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return Object.values(data)
}

/** Build a lookup map from an array of objects with IDs */
function toLookup<T extends { id: string }>(data: Record<string, T> | T[] | undefined): Map<string, T> {
  const arr = toArray(data)
  return new Map(arr.map(item => [item.id, item]))
}

// ─── Normalized Result ───

export interface FlightApiResult {
  price: number
  currency: string
  airlines: string[]
  stops: number
  departureTime: string
  arrivalTime: string
  duration: string        // "14h 30m"
  bookingUrl?: string
  agentName?: string
  segments: {
    origin: string
    destination: string
    airline: string
    flightNumber?: string
    departure: string
    arrival: string
    duration: number
  }[]
}

/**
 * Search one-way flights via FlightAPI.io.
 *
 * Costs 2 credits per call. Only call this for Tier 2 (live) searches
 * where the user has explicitly requested live pricing.
 */
export async function searchFlightApi(params: {
  origin: string
  destination: string
  departDate: string      // YYYY-MM-DD
  adults?: number
  cabinClass?: string     // Economy | Business | First | Premium_Economy
  currency?: string
}): Promise<FlightApiResult[]> {
  if (!isFlightApiAvailable()) {
    throw new Error('FlightAPI.io is not available (no key or no credits)')
  }

  const {
    origin,
    destination,
    departDate,
    adults = 1,
    cabinClass = 'Economy',
    currency = 'USD',
  } = params

  const url = `https://api.flightapi.io/onewaytrip/${FLIGHTAPI_KEY}/${origin}/${destination}/${departDate}/${adults}/0/0/${cabinClass}/${currency}`

  console.log(`[FlightAPI] Searching ${origin} → ${destination} on ${departDate} (${creditState.remaining} credits left)`)

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  })

  // Deduct credits regardless of response (API charges on request, not success)
  deductCredits()

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited or out of credits on their side
      creditState.disabled = true
      console.log('[FlightAPI] 429 received — credits likely exhausted on server side')
      throw new Error('FlightAPI.io rate limited or credits exhausted')
    }
    throw new Error(`FlightAPI.io error: ${response.status}`)
  }

  const data: FlightApiResponse = await response.json()

  // Build lookup maps
  const places = toLookup(data.places)
  const carriers = toLookup(data.carriers)
  const legs = toLookup(data.legs)
  const segments = toLookup(data.segments)
  const agents = toLookup(data.agents)
  const itineraries = toArray(data.itineraries)

  // Normalize itineraries
  const results: FlightApiResult[] = []

  for (const itin of itineraries) {
    // Get the best (cheapest) pricing option
    const bestPricing = itin.pricing_options?.[0]
    if (!bestPricing) continue

    const price = parseFloat(bestPricing.price?.amount || '0')
    if (price <= 0) continue

    // Get leg details (one-way = typically 1 leg)
    const leg = itin.leg_ids?.[0] ? legs.get(itin.leg_ids[0]) : null
    if (!leg) continue

    // Resolve airline names
    const airlineNames = leg.carrier_ids
      ?.map(id => carriers.get(id)?.name || carriers.get(id)?.iata || 'Unknown')
      .filter(Boolean) || []

    // Resolve place IATA codes for origin/destination
    const originPlace = places.get(leg.origin)
    const destPlace = places.get(leg.destination)

    // Build segments
    const segmentDetails = (leg.segment_ids || []).map(segId => {
      const seg = segments.get(segId)
      if (!seg) return null
      const segOrigin = places.get(seg.origin)
      const segDest = places.get(seg.destination)
      const carrier = seg.carrier_id ? carriers.get(seg.carrier_id) : null
      return {
        origin: segOrigin?.iata || seg.origin,
        destination: segDest?.iata || seg.destination,
        airline: carrier?.name || carrier?.iata || 'Unknown',
        flightNumber: seg.flight_number,
        departure: seg.departure,
        arrival: seg.arrival,
        duration: seg.duration,
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null)

    // Format duration
    const hours = Math.floor(leg.duration / 60)
    const mins = leg.duration % 60
    const durationStr = `${hours}h${mins > 0 ? ` ${mins}m` : ''}`

    // Resolve booking URL
    const agentId = bestPricing.agent_ids?.[0]
    const agent = agentId ? agents.get(agentId) : null
    const bookingUrl = bestPricing.url || agent?.url

    results.push({
      price,
      currency,
      airlines: [...new Set(airlineNames)],
      stops: leg.stop_count || 0,
      departureTime: leg.departure,
      arrivalTime: leg.arrival,
      duration: durationStr,
      bookingUrl,
      agentName: agent?.name,
      segments: segmentDetails,
    })
  }

  // Sort by price
  results.sort((a, b) => a.price - b.price)

  console.log(`[FlightAPI] Found ${results.length} flights (cheapest: $${results[0]?.price || 'N/A'})`)

  return results
}
