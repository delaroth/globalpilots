/**
 * SerpApi Google Flights Booking Options — on-demand price comparison.
 *
 * Triggered ONLY when a user clicks "Compare Booking Prices" on a specific flight.
 * Takes a booking_token (from a google_flights search result) and returns
 * booking options from multiple OTAs (Expedia, Kayak, airline direct, etc.).
 *
 * Cost: 1 API call per invocation. Not called automatically.
 */

import { getSerpApiUsage } from './serpapi'

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
const BASE_URL = 'https://serpapi.com/search'

// ── Types ─────────────────────────────────────────────────────────────────

export interface BookingOption {
  provider: string          // e.g., "Expedia", "Kayak", "airline direct"
  price: number
  currency: string
  isAirlineDirect: boolean
  fareClass?: string        // e.g., "Economy Light"
  baggageIncluded?: string[]
  bookingUrl: string
  logoUrl?: string
}

export interface BookingOptionsResult {
  options: BookingOption[]
  lowestPrice: number | null
  airlineDirectPrice: number | null
  source: 'serpapi-booking'
  isLive: true
  fetchedAt: number
}

// ── Core API ──────────────────────────────────────────────────────────────

/**
 * Fetch booking options for a specific flight using its booking_token.
 *
 * The booking_token comes from a previous google_flights search result
 * (best_flights[].booking_token or other_flights[].booking_token).
 *
 * Returns an array of booking options from multiple OTAs sorted by price.
 */
export async function getBookingOptions(bookingToken: string): Promise<BookingOptionsResult> {
  if (!SERPAPI_KEY) {
    console.warn('[SerpApi Booking] No API key configured')
    return emptyResult()
  }

  const usage = getSerpApiUsage()
  if (usage.remaining <= 2) {
    console.warn(`[SerpApi Booking] Quota low (${usage.remaining} remaining), skipping`)
    return emptyResult()
  }

  const searchParams = new URLSearchParams({
    engine: 'google_flights',
    api_key: SERPAPI_KEY,
    booking_token: bookingToken,
    currency: 'USD',
    hl: 'en',
  })

  const url = `${BASE_URL}?${searchParams.toString()}`
  console.log(`[SerpApi Booking] Fetching booking options`)

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000), // 12s timeout
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[SerpApi Booking] HTTP ${response.status}: ${text.slice(0, 200)}`)
      throw new Error(`SerpApi HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      console.error(`[SerpApi Booking] API error: ${data.error}`)
      throw new Error(data.error)
    }

    return parseBookingResponse(data)
  } catch (err) {
    console.error('[SerpApi Booking] Failed:', err instanceof Error ? err.message : err)
    return emptyResult()
  }
}

// ── Response Parsing ──────────────────────────────────────────────────────

function parseBookingResponse(data: any): BookingOptionsResult {
  const options: BookingOption[] = []

  // Parse booking_options array — each entry can have a "together" object
  // or separate "departing"/"returning" objects for split tickets
  const rawOptions = data.booking_options || []

  for (const option of rawOptions) {
    // "together" is the most common: single booking for the whole itinerary
    if (option.together) {
      const together = option.together
      const parsed = parseBookingEntry(together, option.separate_tickets === true)
      if (parsed) options.push(parsed)
    }

    // Some results only have departing/returning (separate tickets)
    // We still surface these but mark them appropriately
    if (option.departing && !option.together) {
      const parsed = parseBookingEntry(option.departing, true)
      if (parsed) {
        parsed.provider = `${parsed.provider} (departing)`
        options.push(parsed)
      }
    }
    if (option.returning && !option.together) {
      const parsed = parseBookingEntry(option.returning, true)
      if (parsed) {
        parsed.provider = `${parsed.provider} (returning)`
        options.push(parsed)
      }
    }
  }

  // Sort by price (cheapest first)
  options.sort((a, b) => a.price - b.price)

  const lowestPrice = options.length > 0 ? options[0].price : null
  const airlineDirect = options.find(o => o.isAirlineDirect)
  const airlineDirectPrice = airlineDirect?.price ?? null

  console.log(`[SerpApi Booking] Parsed ${options.length} booking options, cheapest: $${lowestPrice}, airline direct: $${airlineDirectPrice}`)

  return {
    options,
    lowestPrice,
    airlineDirectPrice,
    source: 'serpapi-booking',
    isLive: true,
    fetchedAt: Date.now(),
  }
}

function parseBookingEntry(entry: any, _isSeparateTicket: boolean): BookingOption | null {
  if (!entry || typeof entry.price !== 'number') return null

  const provider = entry.book_with || 'Unknown'
  const isAirlineDirect = entry.airline === true

  // Extract baggage info from baggage_prices array
  const baggageIncluded: string[] = []
  if (entry.baggage_prices && Array.isArray(entry.baggage_prices)) {
    for (const bag of entry.baggage_prices) {
      if (bag.type && bag.price) {
        baggageIncluded.push(`${bag.type}: ${bag.price}`)
      } else if (typeof bag === 'string') {
        baggageIncluded.push(bag)
      }
    }
  }

  // Also check extensions for baggage/fare details
  if (entry.extensions && Array.isArray(entry.extensions)) {
    for (const ext of entry.extensions) {
      if (typeof ext === 'string' && ext.toLowerCase().includes('bag')) {
        baggageIncluded.push(ext)
      }
    }
  }

  // Build booking URL from booking_request
  let bookingUrl = ''
  if (entry.booking_request?.url) {
    bookingUrl = entry.booking_request.url
  }

  // Get logo URL
  let logoUrl: string | undefined
  if (entry.airline_logos && Array.isArray(entry.airline_logos) && entry.airline_logos.length > 0) {
    logoUrl = entry.airline_logos[0]
  }

  return {
    provider,
    price: entry.price,
    currency: 'USD',
    isAirlineDirect,
    fareClass: entry.option_title || undefined,
    baggageIncluded: baggageIncluded.length > 0 ? baggageIncluded : undefined,
    bookingUrl,
    logoUrl,
  }
}

function emptyResult(): BookingOptionsResult {
  return {
    options: [],
    lowestPrice: null,
    airlineDirectPrice: null,
    source: 'serpapi-booking',
    isLive: true,
    fetchedAt: Date.now(),
  }
}
