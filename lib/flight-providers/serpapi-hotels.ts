/**
 * SerpApi Google Hotels integration.
 *
 * Searches Google Hotels for real hotel prices at a destination.
 * Called when displaying Mystery Vacation results to show live hotel costs.
 *
 * Uses engine=google_hotels with sort_by=3 (lowest price) by default.
 * Results are cached for 1 hour to minimize API calls.
 *
 * Cost: 1 API call per search (cached queries are free on SerpApi).
 */

// SerpApi enforces its own per-engine quota — no need to track usage here

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
const BASE_URL = 'https://serpapi.com/search'

// ── Application-level cache (1 hour) ─────────────────────────────────────

interface CacheEntry {
  data: HotelResult
  timestamp: number
}

const hotelCache = new Map<string, CacheEntry>()
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours — hotel prices don't change fast enough to justify more frequent API calls

function getCacheKey(params: HotelSearchParams): string {
  return [
    params.destination,
    params.checkIn,
    params.checkOut,
    String(params.adults ?? 2),
    String(params.maxPrice ?? 0),
    params.currency ?? 'USD',
  ].join(':')
}

function getFromCache(key: string): HotelResult | null {
  const entry = hotelCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    hotelCache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: HotelResult): void {
  // Limit cache size to prevent memory bloat in serverless
  if (hotelCache.size > 50) {
    const oldest = [...hotelCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    if (oldest) hotelCache.delete(oldest[0])
  }
  hotelCache.set(key, { data, timestamp: Date.now() })
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface HotelSearchParams {
  destination: string  // city name or "Hotels in Bangkok"
  checkIn: string      // YYYY-MM-DD
  checkOut: string     // YYYY-MM-DD
  adults?: number
  maxPrice?: number
  currency?: string
}

export interface Hotel {
  name: string
  price: number        // per night (extracted numeric)
  totalPrice: number   // full stay cost (extracted numeric)
  rating: number       // out of 5
  reviews: number
  stars: number        // hotel class 1-5
  type: string         // "Hotel", "Hostel", "Resort", etc.
  thumbnail?: string
  amenities: string[]
  neighborhood?: string
  link: string
}

export interface HotelResult {
  hotels: Hotel[]
  cheapestPrice: number
  averagePrice: number
  source: 'serpapi-hotels'
  isLive: true
  fetchedAt: number
}

// ── Core API ──────────────────────────────────────────────────────────────

/**
 * Search Google Hotels for a destination.
 *
 * Returns real hotel prices sorted by lowest price.
 * Results are cached for 1 hour (app-level + SerpApi-level).
 */
export async function searchHotels(params: HotelSearchParams): Promise<HotelResult> {
  const cacheKey = getCacheKey(params)
  const cached = getFromCache(cacheKey)
  if (cached) {
    console.log(`[SerpApi Hotels] Cache hit: ${cacheKey}`)
    return cached
  }

  // Check API key (SerpApi enforces its own per-engine quota limits;
  // don't use getSerpApiUsage() here — that tracks Google Flights, not Hotels)
  if (!SERPAPI_KEY) {
    console.log(`[SerpApi Hotels] No API key, returning empty`)
    return emptyResult()
  }

  // Build query — prefix with "Hotels in" if it looks like a bare city name
  const query = params.destination.toLowerCase().startsWith('hotels')
    ? params.destination
    : `Hotels in ${params.destination}`

  const searchParams = new URLSearchParams({
    engine: 'google_hotels',
    api_key: SERPAPI_KEY,
    q: query,
    check_in_date: params.checkIn,
    check_out_date: params.checkOut,
    adults: String(params.adults ?? 2),
    currency: params.currency ?? 'USD',
    gl: 'us',
    hl: 'en',
    sort_by: '3', // lowest price
  })

  if (params.maxPrice) {
    searchParams.set('max_price', String(params.maxPrice))
  }

  const url = `${BASE_URL}?${searchParams.toString()}`
  console.log(`[SerpApi Hotels] Searching: ${query}, ${params.checkIn} to ${params.checkOut}`)

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000), // 12s timeout
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[SerpApi Hotels] HTTP ${response.status}: ${text.slice(0, 200)}`)
      return emptyResult()
    }

    const data = await response.json()

    if (data.error) {
      console.error(`[SerpApi Hotels] API error: ${data.error}`)
      return emptyResult()
    }

    const result = parseHotelResponse(data)
    setCache(cacheKey, result)

    console.log(`[SerpApi Hotels] Found ${result.hotels.length} hotels, cheapest: $${result.cheapestPrice}, avg: $${result.averagePrice}`)
    return result
  } catch (err) {
    console.warn(`[SerpApi Hotels] Failed:`, err instanceof Error ? err.message : err)
    return emptyResult()
  }
}

// ── Response Parsing ──────────────────────────────────────────────────────

function parseHotelResponse(data: any): HotelResult {
  const properties = data.properties || []

  const hotels: Hotel[] = properties
    .map((p: any) => parseProperty(p))
    .filter((h: Hotel | null): h is Hotel => h !== null)

  // Calculate stats
  const prices = hotels.map(h => h.price).filter(p => p > 0)
  const cheapestPrice = prices.length > 0 ? Math.min(...prices) : 0
  const averagePrice = prices.length > 0
    ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
    : 0

  return {
    hotels,
    cheapestPrice,
    averagePrice,
    source: 'serpapi-hotels',
    isLive: true,
    fetchedAt: Date.now(),
  }
}

function parseProperty(p: any): Hotel | null {
  // Skip properties without pricing
  const pricePerNight = p.rate_per_night?.extracted_lowest ?? 0
  const totalPrice = p.total_rate?.extracted_lowest ?? 0

  if (pricePerNight <= 0 && totalPrice <= 0) return null

  // Extract thumbnail from images array or direct field
  let thumbnail: string | undefined
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    thumbnail = p.images[0]?.thumbnail || p.images[0]?.original_image
  }

  return {
    name: p.name || 'Unknown Hotel',
    price: pricePerNight,
    totalPrice,
    rating: p.overall_rating ?? 0,
    reviews: p.reviews ?? 0,
    stars: p.extracted_hotel_class ?? p.hotel_class ?? 0,
    type: p.type || 'Hotel',
    thumbnail,
    amenities: Array.isArray(p.amenities) ? p.amenities.slice(0, 10) : [],
    neighborhood: p.neighborhood || undefined,
    link: p.link || '',
  }
}

function emptyResult(): HotelResult {
  return {
    hotels: [],
    cheapestPrice: 0,
    averagePrice: 0,
    source: 'serpapi-hotels',
    isLive: true,
    fetchedAt: Date.now(),
  }
}

// ── Convenience functions ─────────────────────────────────────────────────

/**
 * Get a quick hotel price summary for a destination.
 * Returns cheapest and average per-night price, or null if unavailable.
 *
 * Used by the mystery vacation flow to show "Hotels from $XX/night" without
 * needing the full hotel list.
 */
export async function getHotelPriceSummary(params: {
  destination: string
  checkIn: string
  checkOut: string
  currency?: string
}): Promise<{ cheapest: number; average: number; count: number } | null> {
  try {
    const result = await searchHotels({
      destination: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      currency: params.currency,
    })

    if (result.hotels.length === 0) return null

    return {
      cheapest: result.cheapestPrice,
      average: result.averagePrice,
      count: result.hotels.length,
    }
  } catch {
    return null
  }
}
