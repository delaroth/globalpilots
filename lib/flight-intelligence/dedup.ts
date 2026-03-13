// ─── Flight Deduplication Service ───
// Two-level hashing: physical flights (same plane) vs bookable offers (same product)

import type { FlightOffer, FlightSegment } from '@/lib/flight-providers/types'

/**
 * Fast, deterministic hash — no crypto dependency.
 * Produces a short alphanumeric string for use as a Map key.
 */
export function simpleHash(input: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return combined.toString(36)
}

/**
 * Level 1: Physical Flight Hash
 * Identifies the same aircraft/departure across providers.
 * Used for metadata merging (e.g., attach AeroDataBox aircraft specs).
 *
 * Example: VS1 on 2024-03-15 → same hash from Amadeus, Duffel, and Kiwi
 */
export function physicalFlightHash(segment: FlightSegment): string {
  const raw = `${segment.airline}:${segment.flightNumber || 'X'}:${segment.departureTime.slice(0, 10)}`
  return simpleHash(raw)
}

/**
 * Level 2: Bookable Offer Hash
 * Identifies the same purchasable product — including fare class and baggage.
 *
 * VS1 Economy Basic (no bag) ≠ VS1 Economy Classic (23kg bag)
 * These are different offers even though they're on the same plane.
 *
 * When fareDetails are missing (e.g., TravelPayouts), the hash degrades
 * gracefully to a segments-only hash, which gets lowest merge priority.
 */
export function bookableOfferHash(offer: FlightOffer): string {
  // Build segment key — either from explicit segments or from top-level fields
  let segmentKeys: string
  if (offer.segments && offer.segments.length > 0) {
    segmentKeys = offer.segments
      .map(s => `${s.airline}${s.flightNumber || ''}@${s.departureTime.slice(0, 10)}`)
      .join('|')
  } else {
    // Fallback: use top-level fields (origin→dest implied by departureTime+airlines)
    segmentKeys = `${offer.airlines.join(',')}@${offer.departureTime.slice(0, 10)}:${offer.stops}`
  }

  // Fare key — unknown fare details get '?' to avoid false dedup
  const fareClass = offer.fareDetails?.class || '?'
  const baggageKg = offer.fareDetails?.baggageKg ?? '?'
  const refundable = offer.fareDetails?.refundable ?? '?'
  const fareKey = `${fareClass}:${baggageKg}:${refundable}`

  return simpleHash(`${segmentKeys}::${fareKey}`)
}

/**
 * Stamp an offer with both hash types for downstream dedup/merge.
 * Mutates the offer in-place for efficiency (avoids copying large arrays).
 */
export function stampHashes(offer: FlightOffer): FlightOffer {
  offer.offerHash = bookableOfferHash(offer)
  if (offer.segments && offer.segments.length > 0) {
    offer.flightHash = physicalFlightHash(offer.segments[0])
  }
  return offer
}

/**
 * Group offers by their bookable offer hash.
 * Returns a Map where each key is a hash and the value is all offers with that hash.
 * Used as the first step of the merge pipeline.
 */
export function groupByOfferHash(offers: FlightOffer[]): Map<string, FlightOffer[]> {
  const groups = new Map<string, FlightOffer[]>()
  for (const offer of offers) {
    const hash = offer.offerHash || bookableOfferHash(offer)
    const group = groups.get(hash)
    if (group) {
      group.push(offer)
    } else {
      groups.set(hash, [offer])
    }
  }
  return groups
}
