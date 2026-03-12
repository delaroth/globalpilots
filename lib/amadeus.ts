// Amadeus Flight Offers Search — real-time, bookable prices
// Uses OAuth2 client credentials flow

const AMADEUS_HOSTNAME = process.env.AMADEUS_HOSTNAME || 'test.api.amadeus.com'
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET

// Token cache — Amadeus tokens last ~1799 seconds
let cachedToken: { token: string; expiresAt: number } | null = null

export interface AmadeusFlightOffer {
  price: number
  currency: string
  airlines: string[]
  stops: number
  duration: string // ISO 8601 duration (e.g. PT14H30M)
  departureTime: string
  arrivalTime: string
  origin: string
  destination: string
}

export interface AmadeusSearchResult {
  offers: AmadeusFlightOffer[]
  source: 'amadeus-live'
}

/**
 * Get OAuth2 access token (cached)
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error('Amadeus credentials not configured')
  }

  const response = await fetch(`https://${AMADEUS_HOSTNAME}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Amadeus auth failed: ${response.status} ${errorText.slice(0, 200)}`)
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  }

  console.log('[Amadeus] Token acquired, expires in', data.expires_in, 'seconds')
  return cachedToken.token
}

/**
 * Search real-time flight offers
 * Returns actual bookable prices from airlines
 */
export async function searchFlights(params: {
  origin: string       // IATA
  destination: string  // IATA
  departureDate: string // YYYY-MM-DD
  returnDate?: string   // YYYY-MM-DD (optional, one-way if omitted)
  adults?: number       // default 1
  currency?: string     // default USD
  max?: number          // max results, default 5
}): Promise<AmadeusSearchResult> {
  const {
    origin, destination, departureDate,
    returnDate, adults = 1, currency = 'USD', max = 5,
  } = params

  const token = await getToken()

  const searchParams = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults: String(adults),
    currencyCode: currency,
    max: String(max),
    nonStop: 'false',
  })

  if (returnDate) {
    searchParams.set('returnDate', returnDate)
  }

  console.log(`[Amadeus] Searching flights: ${origin} → ${destination} on ${departureDate}`)

  const response = await fetch(
    `https://${AMADEUS_HOSTNAME}/v2/shopping/flight-offers?${searchParams}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Amadeus] Search failed:', response.status, errorText.slice(0, 300))
    throw new Error(`Amadeus search failed: ${response.status}`)
  }

  const data = await response.json()
  const rawOffers = data.data || []

  const offers: AmadeusFlightOffer[] = rawOffers.map((offer: any) => {
    const firstItinerary = offer.itineraries?.[0]
    const segments = firstItinerary?.segments || []
    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]

    return {
      price: parseFloat(offer.price?.total || '0'),
      currency: offer.price?.currency || currency,
      airlines: [...new Set(segments.map((s: any) => s.carrierCode))] as string[],
      stops: segments.length - 1,
      duration: firstItinerary?.duration || '',
      departureTime: firstSegment?.departure?.at || '',
      arrivalTime: lastSegment?.arrival?.at || '',
      origin: firstSegment?.departure?.iataCode || origin,
      destination: lastSegment?.arrival?.iataCode || destination,
    }
  })

  console.log(`[Amadeus] Found ${offers.length} offers, cheapest: $${offers[0]?.price || 'N/A'}`)

  return { offers, source: 'amadeus-live' }
}

/**
 * Get cheapest one-way price for a route
 * Returns just the price number, or null if no results
 */
export async function getCheapestPrice(
  origin: string,
  destination: string,
  date: string
): Promise<number | null> {
  try {
    const result = await searchFlights({
      origin, destination, departureDate: date, max: 1,
    })
    return result.offers.length > 0 ? result.offers[0].price : null
  } catch (err) {
    console.error(`[Amadeus] getCheapestPrice failed for ${origin}→${destination}:`, err)
    return null
  }
}

/**
 * Check if Amadeus is available (credentials configured)
 */
export function isAmadeusAvailable(): boolean {
  return !!(AMADEUS_CLIENT_ID && AMADEUS_CLIENT_SECRET)
}
