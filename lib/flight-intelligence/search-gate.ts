// ─── 2-Tier Search Gating ───
// Controls when to show cached estimates (Tier 1: Browse) vs hit live APIs (Tier 2: Live).
// Protects expensive API quotas (Duffel search-to-book ratio, Kiwi rate limits)
// while keeping the UX snappy for casual browsers.
//
// STEALTH MODE: Duffel is excluded from allowed sources entirely — sandbox only.

import type { FlightOffer, PriceConfidence } from '@/lib/flight-providers/types'
import { calculateConfidence, inferRouteVolatility, type ConfidenceInput } from './confidence'
import { STEALTH_MODE, DUFFEL_SANDBOX, getDuffelToken } from '@/lib/stealth'

export type SearchTier = 'browse' | 'live'

export interface TieredSearchConfig {
  /** Which tier this search belongs to */
  tier: SearchTier
  /** Providers to query for this tier */
  allowedSources: string[]
  /** Max results to fetch (lower for browse, higher for live) */
  maxResults: number
  /** Cache TTL in ms for this tier */
  cacheTtlMs: number
  /** Whether to show "Get Live Price" CTA */
  showLivePriceCta: boolean
}

// ─── Tier Configuration ───

const BROWSE_CONFIG: TieredSearchConfig = {
  tier: 'browse',
  allowedSources: ['travelpayouts', 'kiwi'],  // Cheap/free APIs only
  maxResults: 10,
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  showLivePriceCta: true,
}

/**
 * Build the live tier config dynamically based on stealth mode.
 * In stealth mode: Duffel is excluded from allowed sources entirely.
 */
function buildLiveConfig(): TieredSearchConfig {
  const sources = STEALTH_MODE
    ? ['amadeus', 'kiwi', 'skyscanner', 'flightapi'] // No Duffel in stealth
    : ['duffel', 'amadeus', 'kiwi', 'skyscanner', 'flightapi']

  return {
    tier: 'live',
    allowedSources: sources,
    maxResults: 20,
    cacheTtlMs: 15 * 60 * 1000, // 15 minutes (live offers expire)
    showLivePriceCta: false,
  }
}

/**
 * Determine which search tier to use based on user intent.
 *
 * Tier 1 (Browse): Page load, slider changes, discovery mode
 *   → TravelPayouts cached + Kiwi inspiration (near-zero cost)
 *   → Shows "~$XXX estimated" with "Get Live Price" button
 *
 * Tier 2 (Live): User clicks "Get Live Price", "Book Now", or "Verify Deal"
 *   → Kiwi live → Amadeus → Duffel (counted API calls)
 *   → Shows "$XXX live" with expiry countdown
 *
 * STEALTH MODE: Duffel is excluded from live tier sources.
 * All searches use sandbox/test tokens only.
 */
export function getSearchTier(intent: 'browse' | 'live'): TieredSearchConfig {
  return intent === 'live' ? buildLiveConfig() : BROWSE_CONFIG
}

/**
 * Get the Duffel configuration for API calls.
 * In stealth mode: always sandbox token, logged warning.
 */
export function getDuffelConfig(): { token: string | undefined; isSandbox: boolean } {
  if (STEALTH_MODE) {
    console.log('[SearchGate] Stealth mode: Duffel using sandbox token only')
  }
  return {
    token: getDuffelToken(),
    isSandbox: DUFFEL_SANDBOX,
  }
}

/**
 * Check if a cached result is still usable for its tier,
 * or if it should be re-fetched.
 */
export function isCacheValid(
  fetchedAt: number,
  tier: SearchTier
): boolean {
  const config = tier === 'live' ? buildLiveConfig() : BROWSE_CONFIG
  return (Date.now() - fetchedAt) < config.cacheTtlMs
}

/**
 * Annotate flight offers with confidence metadata for the UI.
 * Stamps each offer with its confidence score and display info.
 * Call this before sending results to the frontend.
 */
export function annotateForUI(offers: FlightOffer[]): AnnotatedOffer[] {
  return offers.map(offer => {
    const origin = offer.segments?.[0]?.origin || ''
    const dest = offer.segments?.[offer.segments.length - 1]?.destination || ''
    const volatility = origin && dest ? inferRouteVolatility(origin, dest) : 'moderate'

    const conf = calculateConfidence({
      source: offer.source,
      fetchedAt: offer.fetchedAt || Date.now(),
      routeVolatility: volatility,
    })

    return {
      ...offer,
      confidence: conf.tier,
      ui: {
        confidenceScore: conf.score,
        label: conf.label,
        pricePrefix: conf.pricePrefix,
        actionLabel: conf.actionLabel,
        shouldRefetch: conf.shouldRefetch,
        badgeColor: conf.score >= 0.80 ? 'green'
          : conf.score >= 0.50 ? 'blue'
          : conf.score >= 0.25 ? 'amber'
          : 'gray',
      },
    }
  })
}

export interface UIAnnotation {
  confidenceScore: number
  label: string
  pricePrefix: string
  actionLabel: string
  shouldRefetch: boolean
  badgeColor: 'green' | 'blue' | 'amber' | 'gray'
}

export interface AnnotatedOffer extends FlightOffer {
  ui: UIAnnotation
}

/**
 * Helper: determine if a set of offers warrants showing a "Get Live Price" banner.
 * Returns true if ALL offers are below the live confidence threshold.
 */
export function shouldShowLivePriceBanner(offers: FlightOffer[]): boolean {
  if (offers.length === 0) return false
  return offers.every(o => {
    const conf = calculateConfidence({
      source: o.source,
      fetchedAt: o.fetchedAt || Date.now(),
    })
    return conf.shouldRefetch
  })
}
