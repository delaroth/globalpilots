// ─── Stopover Arbitrage Engine ───
// Builds stitched itineraries from separate flight legs,
// validates connection times, and flags self-transfer risks.

import type { FlightOffer, FlightSegment, FlightSource } from '@/lib/flight-providers/types'

export type ItineraryType = 'single-ticket' | 'self-transfer' | 'virtual-interline'

export interface ConnectionInfo {
  /** Hub airport code where the transfer occurs */
  hub: string
  /** Minutes between arrival of prev leg and departure of next leg */
  connectionMinutes: number
  /** Whether this is a self-transfer (separate tickets, must re-check-in) */
  isSelfTransfer: boolean
  /** Human-readable warning for the user */
  warning?: string
}

export interface StitchedItinerary {
  type: ItineraryType
  segments: FlightSegment[]
  legs: FlightOffer[]
  connections: ConnectionInfo[]
  totalPrice: number
  currency: string
  /** All warnings rolled up for display */
  warnings: string[]
  /** Per-leg booking links — critical for self-transfer (each leg is a separate ticket) */
  bookingLinks: { legIndex: number; url: string; label: string }[]
  /** Whether this itinerary has any risky connections */
  hasRiskyConnection: boolean
}

// ─── Minimum Connection Times ───
// Self-transfers need longer because you must collect bags, go through security,
// and re-check-in at a potentially different terminal.
const MIN_SELF_TRANSFER_MINUTES = 180  // 3 hours
const MIN_INTERLINE_MINUTES = 120      // 2 hours (airline handles transfer)
const RISKY_SELF_TRANSFER_MINUTES = 240 // Under 4 hours = risky

/**
 * Calculate connection time in minutes between two legs.
 * Returns null if times can't be parsed.
 */
function connectionMinutes(prevArrival: string, nextDeparture: string): number | null {
  try {
    const arrive = new Date(prevArrival).getTime()
    const depart = new Date(nextDeparture).getTime()
    if (isNaN(arrive) || isNaN(depart)) return null
    return Math.round((depart - arrive) / 60_000)
  } catch {
    return null
  }
}

/**
 * Determine if two legs are from different booking sources (self-transfer)
 * or from the same provider's interlined itinerary.
 */
function isSelfTransfer(legA: FlightOffer, legB: FlightOffer): boolean {
  // Different providers = always self-transfer
  if (legA.source !== legB.source) return true
  // Same provider but no shared offerId = likely separate searches
  if (!legA.offerId || !legB.offerId || legA.offerId !== legB.offerId) return true
  return false
}

/**
 * Build connection info between two consecutive legs.
 */
function buildConnection(prevLeg: FlightOffer, nextLeg: FlightOffer, hub: string): ConnectionInfo {
  const selfTransfer = isSelfTransfer(prevLeg, nextLeg)
  const minMinutes = selfTransfer ? MIN_SELF_TRANSFER_MINUTES : MIN_INTERLINE_MINUTES

  const connTime = connectionMinutes(prevLeg.arrivalTime, nextLeg.departureTime)

  let warning: string | undefined
  if (connTime === null) {
    warning = `Connection at ${hub}: flight times not available — verify manually before booking.`
  } else if (connTime < minMinutes) {
    warning = selfTransfer
      ? `WARNING: Only ${connTime} min connection at ${hub}. Self-transfers need at least ${MIN_SELF_TRANSFER_MINUTES} min. You must collect bags, clear security, and re-check-in.`
      : `WARNING: Only ${connTime} min connection at ${hub}. Minimum ${MIN_INTERLINE_MINUTES} min recommended for interline transfers.`
  } else if (selfTransfer && connTime < RISKY_SELF_TRANSFER_MINUTES) {
    warning = `Tight connection: ${connTime} min at ${hub}. Allow extra time for baggage claim and re-check-in.`
  }

  return {
    hub,
    connectionMinutes: connTime ?? -1,
    isSelfTransfer: selfTransfer,
    warning,
  }
}

/**
 * Stitch multiple flight legs into a single itinerary.
 *
 * Input: Ordered array of FlightOffers representing each leg,
 *        plus the hub codes where transfers occur.
 *
 * Output: A StitchedItinerary with connection validation, warnings,
 *         and per-leg booking links.
 */
export function stitchItinerary(
  legs: FlightOffer[],
  hubs: string[]
): StitchedItinerary {
  if (legs.length === 0) {
    return {
      type: 'single-ticket',
      segments: [],
      legs: [],
      connections: [],
      totalPrice: 0,
      currency: 'USD',
      warnings: [],
      bookingLinks: [],
      hasRiskyConnection: false,
    }
  }

  if (legs.length === 1) {
    return {
      type: 'single-ticket',
      segments: legs[0].segments || [],
      legs,
      connections: [],
      totalPrice: legs[0].price,
      currency: legs[0].currency,
      warnings: [],
      bookingLinks: [{ legIndex: 0, url: legs[0].bookingUrl, label: 'Book Flight' }],
      hasRiskyConnection: false,
    }
  }

  // Build connections between consecutive legs
  const connections: ConnectionInfo[] = []
  for (let i = 0; i < legs.length - 1; i++) {
    const hub = hubs[i] || 'Unknown'
    connections.push(buildConnection(legs[i], legs[i + 1], hub))
  }

  // Determine itinerary type
  const hasSelfTransfer = connections.some(c => c.isSelfTransfer)
  const allSameSource = legs.every(l => l.source === legs[0].source)
  let type: ItineraryType
  if (!hasSelfTransfer && allSameSource) {
    type = 'single-ticket'
  } else if (legs.some(l => l.source === 'kiwi') && !hasSelfTransfer) {
    // Kiwi virtual interlining — they guarantee the connection
    type = 'virtual-interline'
  } else {
    type = 'self-transfer'
  }

  // Collect all warnings
  const warnings: string[] = connections
    .map(c => c.warning)
    .filter((w): w is string => !!w)

  if (type === 'self-transfer') {
    warnings.unshift(
      'This route uses separate tickets. If one flight is delayed or cancelled, ' +
      'the other airline is NOT responsible for rebooking. Travel insurance recommended.'
    )
  }

  // Check for risky connections
  const hasRiskyConnection = connections.some(c =>
    c.connectionMinutes >= 0 && c.connectionMinutes < (c.isSelfTransfer ? RISKY_SELF_TRANSFER_MINUTES : MIN_INTERLINE_MINUTES)
  )

  // Build per-leg booking links
  const bookingLinks = legs.map((leg, i) => ({
    legIndex: i,
    url: leg.bookingUrl,
    label: i === 0 ? 'Book Leg 1' : i === legs.length - 1 ? `Book Leg ${i + 1} (Final)` : `Book Leg ${i + 1}`,
  }))

  // Merge all segments
  const allSegments = legs.flatMap(l => l.segments || [])

  return {
    type,
    segments: allSegments,
    legs,
    connections,
    totalPrice: legs.reduce((sum, l) => sum + l.price, 0),
    currency: legs[0].currency,
    warnings,
    bookingLinks,
    hasRiskyConnection,
  }
}

/**
 * Convert a layover route (from the existing Layover Explorer) into a StitchedItinerary.
 * Bridge function for backward compatibility with the current hub-based search.
 */
export function layoverRouteToStitchedItinerary(
  origin: string,
  hub: string,
  destination: string,
  leg1: FlightOffer,
  leg2: FlightOffer
): StitchedItinerary {
  return stitchItinerary([leg1, leg2], [hub])
}
