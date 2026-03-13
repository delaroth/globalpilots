// ─── The Normalizer: Multi-Provider Offer Merger ───
// Deduplicates, ranks, and merges flight offers from multiple providers.
//
// The merge strategy:
// 1. Group offers by bookableOfferHash (same product = same hash)
// 2. Within each group, pick the primary source (best price among highest confidence)
// 3. Enrich with metadata from richest source (segments, fare details)
// 4. Retain alternative prices for fallback and upsell

import type { FlightOffer, PriceConfidence } from '@/lib/flight-providers/types'
import { bookableOfferHash, stampHashes, groupByOfferHash } from './dedup'
import { calculateConfidence, inferRouteVolatility } from './confidence'

export interface AlternativePrice {
  provider: string
  price: number
  currency: string
  bookingUrl: string
  offerId?: string
  confidence: PriceConfidence
}

export interface MergedOffer extends FlightOffer {
  /** Other providers that had this same offer at different prices */
  alternativePrices: AlternativePrice[]
  /** How many providers returned this same offer */
  providerCount: number
  /** The computed confidence result for display */
  confidenceScore: number
  confidenceLabel: string
  pricePrefix: string
  actionLabel: string
  shouldRefetch: boolean
}

// ─── Confidence Ranking ───
const CONFIDENCE_RANK: Record<PriceConfidence, number> = {
  'live': 0,
  'cached': 1,
  'estimated': 2,
}

/**
 * Resolve an offer's effective confidence tier.
 * If the offer has an explicit `confidence` field, use it.
 * Otherwise, derive from `isLive` (backward compat) or `source`.
 */
function resolveConfidence(offer: FlightOffer): PriceConfidence {
  if (offer.confidence) return offer.confidence
  if (offer.isLive) return 'live'
  if (offer.source === 'travelpayouts') return 'cached'
  if (offer.source === 'kiwi' || offer.source === 'amadeus' || offer.source === 'duffel') return 'live'
  return 'estimated'
}

/**
 * Sort offers: highest confidence first, then cheapest price.
 * Within the same confidence tier, price wins.
 */
function rankOffers(offers: FlightOffer[]): FlightOffer[] {
  return [...offers].sort((a, b) => {
    const confA = CONFIDENCE_RANK[resolveConfidence(a)]
    const confB = CONFIDENCE_RANK[resolveConfidence(b)]
    if (confA !== confB) return confA - confB // lower rank = higher confidence
    return a.price - b.price                  // then cheapest
  })
}

/**
 * Merge a group of offers that share the same bookableOfferHash.
 * - Primary: best price among highest-confidence sources (owns price + bookingUrl)
 * - Metadata: richest segments, fare details from any source
 * - Alternatives: all non-primary prices for fallback/upsell
 */
function mergeGroup(offers: FlightOffer[]): MergedOffer {
  const ranked = rankOffers(offers)
  const primary = ranked[0]
  const conf = resolveConfidence(primary)

  // Find richest metadata sources
  const richestSegments = ranked.reduce((best, o) =>
    (o.segments?.length || 0) > (best.segments?.length || 0) ? o : best,
    primary
  )
  const richestFare = ranked.find(o => o.fareDetails?.class) || primary
  const richestExpiry = ranked
    .map(o => o.expiresAt)
    .filter((e): e is string => !!e)
    .sort()[0] // earliest = most conservative

  // Determine origin/dest for volatility inference
  const origin = primary.segments?.[0]?.origin || ''
  const dest = primary.segments?.[primary.segments.length - 1]?.destination || ''
  const volatility = origin && dest ? inferRouteVolatility(origin, dest) : 'moderate'

  // Calculate full confidence result
  const confResult = calculateConfidence({
    source: primary.source,
    fetchedAt: primary.fetchedAt || Date.now(),
    routeVolatility: volatility,
  })

  // Build alternative prices from non-primary sources
  const alternatives: AlternativePrice[] = ranked.slice(1).map(o => ({
    provider: o.source,
    price: o.price,
    currency: o.currency,
    bookingUrl: o.bookingUrl,
    offerId: o.offerId,
    confidence: resolveConfidence(o),
  }))

  return {
    // Core fields from primary (price + booking always from same source)
    ...primary,
    confidence: conf,

    // Enrich metadata from richest sources
    segments: richestSegments.segments || primary.segments,
    fareDetails: richestFare.fareDetails || primary.fareDetails,
    expiresAt: richestExpiry || primary.expiresAt,

    // Merge metadata
    alternativePrices: alternatives,
    providerCount: offers.length,
    confidenceScore: confResult.score,
    confidenceLabel: confResult.label,
    pricePrefix: confResult.pricePrefix,
    actionLabel: confResult.actionLabel,
    shouldRefetch: confResult.shouldRefetch,
  }
}

/**
 * The main normalizer pipeline.
 *
 * Input: Raw offers from multiple providers (may contain duplicates).
 * Output: Deduplicated, ranked, metadata-enriched merged offers.
 *
 * Steps:
 * 1. Stamp each offer with hashes
 * 2. Group by bookableOfferHash
 * 3. Merge each group (pick primary, enrich metadata, retain alternatives)
 * 4. Sort final list by confidence then price
 */
export function mergeOffers(rawOffers: FlightOffer[]): MergedOffer[] {
  if (rawOffers.length === 0) return []

  // Step 1: Stamp hashes
  const stamped = rawOffers.map(o => stampHashes({ ...o }))

  // Step 2: Group by bookable offer hash
  const groups = groupByOfferHash(stamped)

  // Step 3: Merge each group
  const merged: MergedOffer[] = []
  for (const [, group] of groups) {
    merged.push(mergeGroup(group))
  }

  // Step 4: Final sort — highest confidence first, then cheapest
  merged.sort((a, b) => {
    if (a.confidenceScore !== b.confidenceScore) {
      return b.confidenceScore - a.confidenceScore // higher score first
    }
    return a.price - b.price
  })

  return merged
}

/**
 * Convenience: merge offers from multiple provider results.
 * Accepts an array of { offers, provider } results from searchFlightsMultiProvider.
 */
export function mergeMultiProviderResults(
  results: { offers: FlightOffer[]; provider: string }[]
): MergedOffer[] {
  const allOffers = results.flatMap(r => r.offers)
  return mergeOffers(allOffers)
}
