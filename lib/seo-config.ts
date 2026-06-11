// Central SEO configuration: which programmatic pages are worth indexing.
//
// Google's scaled-content policies penalize large sets of templated pages.
// We keep ~60 high-demand destinations and a curated set of origin airports
// in the sitemap with index allowed; every other programmatic page stays
// live for users but is excluded from the sitemap and marked noindex.

import { getAllDestinations, type DestinationCost } from './destination-costs'

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Destinations with meaningful global flight-search demand (IATA codes
// matching destination-costs.ts). Roughly the top half of the cost DB,
// biased toward cities people actually search flights for.
export const TOP_DESTINATION_CODES: string[] = [
  // Southeast Asia
  'BKK', 'CNX', 'HKT', 'DPS', 'SIN', 'KUL', 'HAN', 'SGN', 'MNL', 'REP', 'CEB',
  // East Asia
  'NRT', 'KIX', 'ICN', 'HKG', 'TPE',
  // South Asia
  'BOM', 'DEL', 'GOI', 'CMB', 'KTM', 'MLE',
  // Middle East
  'DXB', 'IST', 'DOH', 'CAI', 'TLV', 'AMM',
  // Europe
  'LHR', 'CDG', 'AMS', 'BCN', 'LIS', 'OPO', 'PRG', 'BUD', 'ATH', 'FCO',
  'BER', 'VIE', 'KRK', 'DUB', 'CPH', 'KEF', 'DBV', 'ZAG', 'TBS',
  // Americas
  'JFK', 'LAX', 'MIA', 'MEX', 'CUN', 'BOG', 'CTG', 'LIM', 'CUZ', 'EZE',
  'GIG', 'GRU', 'HAV', 'SJO',
  // Africa
  'RAK', 'CPT', 'NBO', 'ZNZ',
  // Oceania
  'SYD', 'AKL',
]

// Origins for /flights-from pages (all indexable; matches the page's own list).
export const TOP_ORIGIN_CODES: string[] = [
  'ATL', 'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS',
  'LHR', 'CDG', 'AMS', 'FRA', 'BCN', 'MAD', 'FCO', 'LIS',
  'BKK', 'SIN', 'HKG', 'NRT', 'ICN', 'TPE', 'KUL', 'CGK',
  'DXB', 'DOH', 'IST',
  'SYD', 'MEL',
  'DEL', 'BOM',
  'GRU', 'EZE', 'BOG', 'LIM', 'SCL', 'MEX',
  'YYZ', 'YVR',
]

// Origins for /mystery-flights/[from] pages. "Mystery flights from X" queries
// come almost entirely from English-speaking markets, so only major hubs
// there earn an indexable page; the other ~470 airport pages are noindexed.
export const MYSTERY_ORIGIN_CODES: string[] = [
  'JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'ATL', 'DFW', 'SEA', 'BOS', 'DEN',
  'YYZ', 'YVR', 'LHR', 'MAN', 'DUB', 'SYD', 'MEL', 'AKL',
]

const topDestinationSet = new Set(TOP_DESTINATION_CODES)
const mysteryOriginSet = new Set(MYSTERY_ORIGIN_CODES)

let topSlugCache: Set<string> | null = null
function topDestinationSlugs(): Set<string> {
  if (!topSlugCache) {
    topSlugCache = new Set(
      getAllDestinations()
        .filter((d) => topDestinationSet.has(d.code))
        .map((d) => slugify(d.city))
    )
  }
  return topSlugCache
}

export function isTopDestination(dest: DestinationCost): boolean {
  return topDestinationSet.has(dest.code)
}

export function isTopDestinationSlug(slug: string): boolean {
  return topDestinationSlugs().has(slug)
}

export function isMysteryOrigin(iataCode: string): boolean {
  return mysteryOriginSet.has(iataCode.toUpperCase())
}

export function getTopDestinations(): DestinationCost[] {
  return getAllDestinations().filter((d) => topDestinationSet.has(d.code))
}

// Robots metadata fragments — spread into generateMetadata results.
export const NOINDEX_ROBOTS = { index: false, follow: true } as const
