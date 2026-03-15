import type { FlightProvider, FlightSearchParams, FlightOffer } from './types'

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
const BASE_URL = 'https://serpapi.com/search'

// In-memory usage tracking (resets on cold start)
let monthlyUsage = 0
let usageMonth = new Date().getMonth()
const FREE_LIMIT = 240 // stay under 250 free tier with buffer

interface SerpApiFlight {
  departure_airport: { name: string; id: string; time: string }
  arrival_airport: { name: string; id: string; time: string }
  duration: number
  airplane?: string
  airline: string
  airline_logo?: string
  flight_number?: string
  legroom?: string
  travel_class?: string
}

interface SerpApiResult {
  flights: SerpApiFlight[]
  layovers?: { duration: number; name: string; id: string; overnight?: boolean }[]
  total_duration: number
  price: number
  type?: string
  departure_token?: string
  carbon_emissions?: { this_flight: number }
}

function resetUsageIfNewMonth() {
  const currentMonth = new Date().getMonth()
  if (currentMonth !== usageMonth) {
    monthlyUsage = 0
    usageMonth = currentMonth
  }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function buildBookingUrl(origin: string, destination: string, departDate: string, returnDate?: string): string {
  // Link to Google Flights directly — fully legitimate
  const params = new URLSearchParams({
    hl: 'en',
    gl: 'us',
    curr: 'USD',
  })
  const base = `https://www.google.com/travel/flights`
  const dateStr = returnDate
    ? `&tfs=CBwQAhokEgoyMDI2LTAxLTAxagcIARIDJHtvcn0SBwgBEgMke2Rlc3R9`
    : ''
  // Simple Google Flights search URL
  return `${base}?q=flights+from+${origin}+to+${destination}+on+${departDate}${returnDate ? '+returning+' + returnDate : ''}`
}

async function searchGoogleFlights(params: {
  origin: string
  destination: string
  outboundDate: string
  returnDate?: string
  maxPrice?: number
  adults?: number
}): Promise<{ bestFlights: SerpApiResult[]; otherFlights: SerpApiResult[]; priceInsights?: any }> {
  resetUsageIfNewMonth()

  if (monthlyUsage >= FREE_LIMIT) {
    console.log(`[SerpApi] Monthly limit reached (${monthlyUsage}/${FREE_LIMIT}), skipping`)
    return { bestFlights: [], otherFlights: [] }
  }

  const searchParams = new URLSearchParams({
    engine: 'google_flights',
    api_key: SERPAPI_KEY,
    departure_id: params.origin,
    arrival_id: params.destination,
    outbound_date: params.outboundDate,
    currency: 'USD',
    hl: 'en',
    type: params.returnDate ? '1' : '2', // 1=round trip, 2=one way
    adults: String(params.adults || 1),
    sort_by: '2', // sort by price
  })

  if (params.returnDate) {
    searchParams.set('return_date', params.returnDate)
  }

  if (params.maxPrice) {
    searchParams.set('max_price', String(params.maxPrice))
  }

  const url = `${BASE_URL}?${searchParams.toString()}`
  console.log(`[SerpApi] Searching: ${params.origin} → ${params.destination} on ${params.outboundDate}`)

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  monthlyUsage++
  console.log(`[SerpApi] Monthly usage: ${monthlyUsage}/${FREE_LIMIT}`)

  if (!response.ok) {
    const text = await response.text()
    console.error(`[SerpApi] HTTP ${response.status}: ${text.slice(0, 200)}`)
    throw new Error(`SerpApi HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    console.error(`[SerpApi] API error: ${data.error}`)
    throw new Error(data.error)
  }

  return {
    bestFlights: data.best_flights || [],
    otherFlights: data.other_flights || [],
    priceInsights: data.price_insights,
  }
}

function mapToFlightOffers(results: SerpApiResult[], origin: string, destination: string, departDate: string, returnDate?: string): FlightOffer[] {
  return results.map(result => {
    const firstFlight = result.flights[0]
    const lastFlight = result.flights[result.flights.length - 1]
    const airlines = [...new Set(result.flights.map(f => f.airline))]

    return {
      price: result.price,
      currency: 'USD',
      airlines,
      stops: result.layovers?.length || 0,
      departureTime: firstFlight?.departure_airport?.time || departDate,
      arrivalTime: lastFlight?.arrival_airport?.time || '',
      duration: formatDuration(result.total_duration),
      bookingUrl: buildBookingUrl(origin, destination, departDate, returnDate),
      source: 'serpapi' as any,
      isLive: true,
      confidence: 'live' as const,
      fetchedAt: Date.now(),
      segments: result.flights.map(f => ({
        origin: f.departure_airport?.id || origin,
        destination: f.arrival_airport?.id || destination,
        departureTime: f.departure_airport?.time || '',
        arrivalTime: f.arrival_airport?.time || '',
        airline: f.airline,
        flightNumber: f.flight_number,
        duration: formatDuration(f.duration),
        source: 'serpapi' as any,
        bookingUrl: buildBookingUrl(origin, destination, departDate, returnDate),
        aircraft: f.airplane,
      })),
    }
  })
}

export const serpapiProvider: FlightProvider = {
  name: 'SerpApi Google Flights',

  async isAvailable(): Promise<boolean> {
    resetUsageIfNewMonth()
    return !!SERPAPI_KEY && monthlyUsage < FREE_LIMIT
  },

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const { bestFlights, otherFlights } = await searchGoogleFlights({
      origin: params.origin,
      destination: params.destination,
      outboundDate: params.departDate,
      returnDate: params.returnDate,
      adults: params.adults,
    })

    const allResults = [...bestFlights, ...otherFlights]
    const offers = mapToFlightOffers(
      allResults.slice(0, params.maxResults || 10),
      params.origin,
      params.destination,
      params.departDate,
      params.returnDate
    )

    return offers.sort((a, b) => a.price - b.price)
  },
}

/**
 * Get a real-time price for a specific route from Google Flights.
 * Used by the mystery flow to validate/upgrade TravelPayouts cached prices.
 * Returns null if unavailable or over quota.
 */
export async function getGoogleFlightsPrice(
  origin: string,
  destination: string,
  departDate: string,
  returnDate?: string
): Promise<{
  price: number
  priceLevel?: string
  typicalRange?: [number, number]
  airlines: string[]
  stops: number
  duration: string
} | null> {
  try {
    resetUsageIfNewMonth()
    if (!SERPAPI_KEY || monthlyUsage >= FREE_LIMIT) return null

    const { bestFlights, priceInsights } = await searchGoogleFlights({
      origin,
      destination,
      outboundDate: departDate,
      returnDate,
    })

    if (bestFlights.length === 0) return null

    const cheapest = bestFlights[0]
    const airlines = [...new Set(cheapest.flights.map(f => f.airline))]

    return {
      price: cheapest.price,
      priceLevel: priceInsights?.price_level,
      typicalRange: priceInsights?.typical_price_range,
      airlines,
      stops: cheapest.layovers?.length || 0,
      duration: formatDuration(cheapest.total_duration),
    }
  } catch (err) {
    console.warn('[SerpApi] Price check failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/** Get remaining searches this month */
export function getSerpApiUsage() {
  resetUsageIfNewMonth()
  return { used: monthlyUsage, limit: FREE_LIMIT, remaining: FREE_LIMIT - monthlyUsage }
}
