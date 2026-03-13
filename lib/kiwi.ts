// Kiwi Tequila API v2 integration
// Primary flight search provider — covers low-cost carriers Amadeus misses
// Activate by setting KIWI_API_KEY env var

const KIWI_BASE = 'https://api.tequila.kiwi.com'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// ── Normalized output format ──────────────────────────────────
export interface NormalizedFlight {
  price: number
  currency: string
  airlines: string[]
  stops: number
  departureTime: string
  arrivalTime: string
  duration: number          // minutes
  deepLink: string
}

// ── Raw Kiwi types (internal) ─────────────────────────────────
export interface KiwiFlightResult {
  id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  countryTo: { code: string; name: string }
  price: number
  currency: string
  departureDate: string
  returnDate?: string
  airlines: string[]
  stops: number
  duration: number
  deepLink: string
  route: { flyFrom: string; flyTo: string; price: number }[]
}

export interface KiwiLayoverResult {
  direct: KiwiFlightResult | null
  viaHub: {
    hub: string
    hubCity: string
    leg1: KiwiFlightResult
    leg2: KiwiFlightResult
    totalPrice: number
    savings: number | null
    savingsPercent: number | null
  }[]
}

// ── Helpers ───────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.KIWI_API_KEY || '',
  }
}

/** Check whether the Kiwi API key is configured */
export function isKiwiAvailable(): boolean {
  return !!process.env.KIWI_API_KEY
}

/** Convert YYYY-MM-DD to dd/mm/yyyy (Kiwi date format) */
function toKiwiDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Simple retry wrapper for rate-limit (429) and transient errors */
async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.status === 429 && attempt < retries) {
        // Rate limited — back off and retry
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        console.warn(`[Kiwi] Rate limited (429), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      return res
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        console.warn(`[Kiwi] Fetch error, retrying in ${delay}ms:`, lastError.message)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError ?? new Error('Kiwi fetch failed after retries')
}

/** Parse a single Kiwi flight data object into our internal KiwiFlightResult */
function parseKiwiFlight(f: any, currency: string): KiwiFlightResult {
  const route = f.route || []
  return {
    id: f.id,
    flyFrom: f.flyFrom,
    flyTo: f.flyTo,
    cityFrom: f.cityFrom,
    cityTo: f.cityTo,
    countryTo: f.countryTo,
    price: f.price,
    currency: f.currency || currency,
    departureDate: f.local_departure,
    returnDate: f.local_arrival,
    airlines: f.airlines || [],
    stops: Math.max(0, route.length - 1),
    duration: typeof f.duration?.total === 'number' ? Math.round(f.duration.total / 60) : 0,
    deepLink: f.deep_link || '',
    route: route.map((r: any) => ({
      flyFrom: r.flyFrom,
      flyTo: r.flyTo,
      price: r.price,
    })),
  }
}

/** Convert a KiwiFlightResult to the normalized format */
function toNormalized(f: KiwiFlightResult): NormalizedFlight {
  return {
    price: f.price,
    currency: f.currency,
    airlines: f.airlines,
    stops: f.stops,
    departureTime: f.departureDate,
    arrivalTime: f.returnDate || '',
    duration: f.duration,
    deepLink: f.deepLink,
  }
}

// ── Core raw search (internal) ────────────────────────────────

async function searchKiwiRaw(params: {
  origin: string
  destination: string
  dateFrom: string
  dateTo: string
  returnFrom?: string
  returnTo?: string
  maxPrice?: number
  currency?: string
  limit?: number
}): Promise<KiwiFlightResult[]> {
  const {
    origin, destination, dateFrom, dateTo,
    returnFrom, returnTo,
    maxPrice, currency = 'USD', limit = 20,
  } = params

  const searchParams = new URLSearchParams({
    fly_from: origin,
    fly_to: destination,
    date_from: dateFrom,
    date_to: dateTo,
    curr: currency,
    limit: String(limit),
    sort: 'price',
    one_for_city: destination === 'anywhere' ? '1' : '0',
  })

  if (returnFrom) searchParams.set('return_from', returnFrom)
  if (returnTo) searchParams.set('return_to', returnTo)
  if (maxPrice) searchParams.set('price_to', String(maxPrice))

  const url = `${KIWI_BASE}/v2/search?${searchParams}`
  console.log(`[Kiwi] Searching: ${origin} -> ${destination} (${dateFrom} - ${dateTo})`)

  const response = await fetchWithRetry(url, { headers: getHeaders() })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kiwi API error ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  return (data.data || []).map((f: any) => parseKiwiFlight(f, currency))
}

// ── Public API ────────────────────────────────────────────────

/**
 * Search flights between two airports on a specific date.
 * Returns normalized results suitable for the UI.
 */
export async function searchFlights(params: {
  origin: string
  destination: string
  departDate: string         // YYYY-MM-DD
  returnDate?: string        // YYYY-MM-DD
  adults?: number
  maxResults?: number
}): Promise<NormalizedFlight[]> {
  const { origin, destination, departDate, returnDate, maxResults = 10 } = params

  const dateFrom = toKiwiDate(departDate)
  const dateTo = dateFrom // exact date
  const returnFrom = returnDate ? toKiwiDate(returnDate) : undefined
  const returnTo = returnFrom

  const raw = await searchKiwiRaw({
    origin,
    destination,
    dateFrom,
    dateTo,
    returnFrom,
    returnTo,
    limit: maxResults,
  })

  console.log(`[Kiwi] searchFlights: ${raw.length} results for ${origin}->${destination}`)
  return raw.map(toNormalized)
}

/**
 * Discover cheapest destinations from an origin (fly_to=anywhere).
 * Returns normalized results.
 */
export async function searchCheapestDestinations(params: {
  origin: string
  departDate: string         // YYYY-MM-DD
  returnDate?: string        // YYYY-MM-DD
  limit?: number
}): Promise<(NormalizedFlight & { destinationCode: string; cityName: string })[]> {
  const { origin, departDate, returnDate, limit = 20 } = params

  const dateFrom = toKiwiDate(departDate)
  // Search a window of ±3 days to get more results
  const dateParsed = new Date(departDate)
  const dateEnd = new Date(dateParsed.getTime() + 6 * 86400000)
  const dateTo = toKiwiDate(dateEnd.toISOString().split('T')[0])

  const returnFrom = returnDate ? toKiwiDate(returnDate) : undefined
  const returnTo = returnFrom

  const raw = await searchKiwiRaw({
    origin,
    destination: 'anywhere',
    dateFrom,
    dateTo,
    returnFrom,
    returnTo,
    limit,
  })

  console.log(`[Kiwi] searchCheapestDestinations: ${raw.length} destinations from ${origin}`)

  return raw.map(f => ({
    ...toNormalized(f),
    destinationCode: f.flyTo,
    cityName: f.cityTo,
  }))
}

// ── Legacy exports (used by layover route) ────────────────────

/** Raw search used by the existing kiwi/search API route */
export { searchKiwiRaw as searchKiwiFlights }

/**
 * Multi-city search — powers Layover Arbitrage
 * Returns: direct route + all viable hub combinations with prices for each leg
 */
export async function searchKiwiMultiCity(params: {
  origin: string
  destination: string
  departDate: string   // YYYY-MM-DD
  maxPrice?: number
}): Promise<KiwiLayoverResult> {
  const { origin, destination, departDate, maxPrice } = params

  const dateFormatted = toKiwiDate(departDate)
  const dateEnd = toKiwiDate(
    new Date(new Date(departDate).getTime() + 3 * 86400000).toISOString().split('T')[0]
  )

  // Search direct
  let direct: KiwiFlightResult | null = null
  try {
    const results = await searchKiwiRaw({
      origin, destination, dateFrom: dateFormatted, dateTo: dateEnd,
      maxPrice, limit: 1,
    })
    if (results.length > 0) direct = results[0]
  } catch (err) {
    console.warn('[Kiwi] Direct search failed:', err)
  }

  // Search via hubs
  const hubs = ['SIN', 'DXB', 'IST', 'DOH', 'LHR', 'CDG', 'HKG', 'BKK', 'KUL', 'FRA']
    .filter(h => h !== origin && h !== destination)

  const viaHub: KiwiLayoverResult['viaHub'] = []

  await Promise.all(hubs.map(async (hub) => {
    try {
      const [leg1Results, leg2Results] = await Promise.all([
        searchKiwiRaw({ origin, destination: hub, dateFrom: dateFormatted, dateTo: dateEnd, limit: 1 }),
        searchKiwiRaw({ origin: hub, destination, dateFrom: dateFormatted, dateTo: dateEnd, limit: 1 }),
      ])

      if (leg1Results.length > 0 && leg2Results.length > 0) {
        const totalPrice = leg1Results[0].price + leg2Results[0].price
        const savings = direct ? direct.price - totalPrice : null
        const savingsPercent = direct && savings !== null ? Math.round((savings / direct.price) * 100) : null

        viaHub.push({
          hub,
          hubCity: leg1Results[0].cityTo,
          leg1: leg1Results[0],
          leg2: leg2Results[0],
          totalPrice,
          savings,
          savingsPercent,
        })
      }
    } catch {}
  }))

  viaHub.sort((a, b) => a.totalPrice - b.totalPrice)

  return { direct, viaHub }
}

/**
 * Inspiration search — powers Mystery Trip with real data
 * fly_to=anywhere — returns cheapest destinations globally
 */
export async function searchKiwiInspiration(params: {
  origin: string
  dateFrom: string     // YYYY-MM-DD
  dateTo: string       // YYYY-MM-DD
  maxPrice: number
  currency?: string
}): Promise<KiwiFlightResult[]> {
  const { origin, dateFrom, dateTo, maxPrice, currency = 'USD' } = params

  return searchKiwiRaw({
    origin,
    destination: 'anywhere',
    dateFrom: toKiwiDate(dateFrom),
    dateTo: toKiwiDate(dateTo),
    maxPrice,
    currency,
    limit: 30,
  })
}
