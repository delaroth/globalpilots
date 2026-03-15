// Fetches nearby points of interest from Wikipedia GeoSearch API (free, no key)
// https://www.mediawiki.org/wiki/API:Geosearch
// Results cached in-memory for 7 days
// Returns null on any error — never throws

import { getAirportCoords } from '@/data/airport-coordinates'

export interface Attraction {
  name: string
  description: string
  distance: string
}

// In-memory cache: IATA code -> { attractions, fetchedAt }
const attractionsCache = new Map<string, { attractions: Attraction[]; fetchedAt: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Fetch nearby attractions/POIs using Wikipedia GeoSearch + summaries.
 * Uses IATA code to look up lat/lon from the airport-coordinates data file.
 * Results are cached for 7 days.
 * Returns null if the airport is unknown or the API fails.
 */
export async function fetchAttractions(
  iata: string
): Promise<Attraction[] | null> {
  const code = iata.toUpperCase()

  // Check cache
  const cached = attractionsCache.get(code)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.attractions
  }

  const coords = getAirportCoords(code)
  if (!coords) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    // Step 1: GeoSearch — find nearby Wikipedia articles
    const geoUrl =
      `https://en.wikipedia.org/w/api.php` +
      `?action=query&list=geosearch` +
      `&gscoord=${coords.lat}|${coords.lon}` +
      `&gsradius=10000&gslimit=10&format=json&origin=*`

    const geoRes = await fetch(geoUrl, { signal: controller.signal })
    if (!geoRes.ok) return null

    const geoData = await geoRes.json() as GeoSearchResponse
    const pages = geoData.query?.geosearch
    if (!pages || pages.length === 0) return null

    // Step 2: Get summaries for the pages (batch request)
    const titles = pages.map((p) => p.title).join('|')
    const summaryUrl =
      `https://en.wikipedia.org/w/api.php` +
      `?action=query&prop=extracts&exintro&explaintext&exsentences=2` +
      `&titles=${encodeURIComponent(titles)}&format=json&origin=*`

    const summaryRes = await fetch(summaryUrl, { signal: controller.signal })
    if (!summaryRes.ok) return null

    const summaryData = await summaryRes.json() as SummaryResponse
    const summaryPages = summaryData.query?.pages || {}

    // Build title -> extract map
    const extractMap = new Map<string, string>()
    for (const page of Object.values(summaryPages)) {
      if (page.title && page.extract) {
        extractMap.set(page.title, page.extract)
      }
    }

    // Combine geo results with summaries
    const attractions: Attraction[] = pages
      .filter((p) => {
        // Skip airport articles and very generic results
        const lower = p.title.toLowerCase()
        return !lower.includes('airport') && !lower.includes('airline')
      })
      .slice(0, 8)
      .map((p) => {
        const dist = p.dist
        const distStr = dist >= 1000
          ? `${(dist / 1000).toFixed(1)} km`
          : `${Math.round(dist)} m`

        return {
          name: p.title,
          description: extractMap.get(p.title) || 'A notable nearby place of interest.',
          distance: distStr,
        }
      })

    // Cache results
    if (attractions.length > 0) {
      attractionsCache.set(code, { attractions, fetchedAt: Date.now() })
    }

    return attractions.length > 0 ? attractions : null
  } catch {
    // Return stale cache if available
    const stale = attractionsCache.get(code)
    if (stale) return stale.attractions
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// Wikipedia GeoSearch API response types (minimal)
interface GeoSearchResult {
  pageid: number
  title: string
  lat: number
  lon: number
  dist: number
}

interface GeoSearchResponse {
  query: {
    geosearch: GeoSearchResult[]
  }
}

interface SummaryPage {
  pageid: number
  title: string
  extract: string
}

interface SummaryResponse {
  query: {
    pages: Record<string, SummaryPage>
  }
}
