// ─── Booking Redirect Engine ───
// Resolves flight parameters into the most specific booking action possible.
//
// TODAY (Phase 1-2): All actions → affiliate redirects
//   → Aviasales via TravelPayouts (default)
//   → Kiwi deep links (when available from API response)
//
// FUTURE (Phase 3+): Direct booking via Duffel
//   → Flip BOOKING_FLAGS.duffelDirectBook = true
//   → resolveFlightBooking() returns 'direct-book' action
//   → Frontend shows in-app checkout instead of new-tab redirect
//
// The abstraction: callers don't know (or care) whether the booking
// is an affiliate redirect or a direct purchase. They get a typed
// action and render accordingly.

import { buildFlightLink, buildFlightLinkForSource } from '@/lib/affiliate'
import type { SafeBookingAction } from '@/lib/affiliate'
import { STEALTH_MODE, logStealthBlock } from '@/lib/stealth'
import { BOOKING_FLAGS } from '@/lib/affiliate'

// ─── Types ───

export interface BookableFlightParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  price?: number
  currency?: string

  // Specificity boosters — help user find the right flight on the partner search page
  airline?: string
  flightNumber?: string
  departureTime?: string
  cabinClass?: string
  adults?: number

  // Provider context — enables richer deep links
  source?: string          // 'kiwi' | 'amadeus' | 'travelpayouts' | etc
  deepLink?: string        // Kiwi provides direct booking URLs for exact itineraries
  offerId?: string         // Duffel/Amadeus offer ID → future direct booking
}

export interface FlightContext {
  airline?: string
  flightNumber?: string
  departureTime?: string
  cabinClass?: string
  priceShown: number | null
}

export interface ResolvedBooking {
  /** The booking action (affiliate-redirect today, direct-book future) */
  action: SafeBookingAction
  /** Flight metadata for the UI — helps user identify the right result */
  flightContext: FlightContext
}

export interface SplitBookingResult {
  type: 'split-ticket'
  /** Individual tickets to purchase separately */
  tickets: ResolvedBooking[]
  /** Self-transfer warnings */
  warnings: string[]
  /** Combined price of all tickets */
  totalPrice: number
  /** Legal disclaimer text */
  disclaimer: string
}

// ─── Resolvers ───

/**
 * Resolve a single flight into a booking action.
 *
 * Resolution priority:
 * 1. Direct booking via Duffel (future — requires flag + offerId)
 * 2. Kiwi deep link (most specific — exact itinerary page)
 * 3. Source-specific affiliate link (Kiwi/WayAway/JetRadar)
 * 4. Default Aviasales via TravelPayouts
 *
 * In stealth mode: returns sandbox-demo regardless of source.
 */
export function resolveFlightBooking(params: BookableFlightParams): ResolvedBooking {
  const {
    origin, destination, departDate, returnDate,
    source, deepLink, price, offerId,
  } = params

  const context: FlightContext = {
    airline: params.airline,
    flightNumber: params.flightNumber,
    departureTime: params.departureTime,
    cabinClass: params.cabinClass,
    priceShown: price ?? null,
  }

  // ─── Stealth mode: all bookings become sandbox demos ───
  if (STEALTH_MODE) {
    logStealthBlock('flight-redirect', `${origin} → ${destination} ${departDate}`)
    return {
      action: {
        type: 'sandbox-demo',
        intendedAction: 'affiliate-redirect',
        intendedUrl: buildFlightLink(origin, destination, departDate, returnDate),
        provider: source || 'aviasales',
        label: 'Search Flights (Demo)',
        message: 'Live booking links are disabled in development mode.',
      },
      flightContext: context,
    }
  }

  // ─── Future: Direct booking via Duffel ───
  // When BOOKING_FLAGS.duffelDirectBook is true and we have a live offer ID,
  // return a direct-book action. The frontend renders an in-app checkout.
  if (BOOKING_FLAGS.duffelDirectBook && offerId && source === 'duffel' && price) {
    return {
      action: {
        type: 'direct-book',
        offerId,
        provider: 'duffel',
        requiresPayment: true,
        price,
        currency: params.currency || 'USD',
        label: `Book Now — $${price}`,
      },
      flightContext: context,
    }
  }

  // ─── Kiwi deep link (exact itinerary) ───
  if (deepLink && source === 'kiwi') {
    return {
      action: {
        type: 'affiliate-redirect',
        url: deepLink,
        provider: 'kiwi',
        label: price ? `Book Flight — $${price}` : 'Book This Flight',
      },
      flightContext: context,
    }
  }

  // ─── Source-aware affiliate link ───
  const url = source
    ? buildFlightLinkForSource(source, origin, destination, departDate, returnDate)
    : buildFlightLink(origin, destination, departDate, returnDate)

  return {
    action: {
      type: 'affiliate-redirect',
      url,
      provider: source || 'aviasales',
      label: price ? `Search Flights (~$${price})` : 'Search Flights',
    },
    flightContext: context,
  }
}

/**
 * Resolve a self-transfer (split-ticket) route into separate booking actions.
 * Each leg is booked independently with its own ticket.
 *
 * Self-transfers are the core of the Side Quest model:
 * Origin → Hub (ticket 1) + Hub → Destination (ticket 2)
 * The hub stay is the "side quest."
 */
export function resolveSplitBooking(
  legs: BookableFlightParams[],
  connectionMinutes?: number[]
): SplitBookingResult {
  const tickets = legs.map(leg => resolveFlightBooking(leg))
  const totalPrice = legs.reduce((sum, leg) => sum + (leg.price || 0), 0)

  const warnings: string[] = [
    'These are separate tickets. If one flight is delayed or cancelled, the other airline will not rebook you.',
    'You will need to collect your luggage and re-check in between flights.',
  ]

  if (connectionMinutes) {
    connectionMinutes.forEach((mins, i) => {
      if (mins < 180) {
        warnings.push(
          `Connection ${i + 1}: ${mins} minutes may not be enough for international transfer, immigration, and re-check-in.`
        )
      } else if (mins < 240) {
        warnings.push(
          `Connection ${i + 1}: ${mins} minutes is tight for self-transfer. Allow extra time for delays.`
        )
      }
    })
  }

  return {
    type: 'split-ticket',
    tickets,
    warnings,
    totalPrice,
    disclaimer: 'Self-transfer itinerary: Each flight segment is a separate booking. GlobePilots is not responsible for missed connections between independently booked tickets.',
  }
}

/**
 * Convenience: resolve a layover route (origin → hub → destination) into split booking.
 * This is the primary entry point for the Side Quest / Layover Explorer features.
 */
export function resolveLayoverBooking(params: {
  origin: string
  hub: string
  destination: string
  departDate: string
  leg1Price: number
  leg2Price: number
  hubStayDays?: number
  source?: string
}): SplitBookingResult {
  const { origin, hub, destination, departDate, leg1Price, leg2Price, hubStayDays = 0, source } = params

  const leg2Date = hubStayDays > 0
    ? addDays(departDate, hubStayDays)
    : departDate

  return resolveSplitBooking([
    { origin, destination: hub, departDate, price: leg1Price, source },
    { origin: hub, destination, departDate: leg2Date, price: leg2Price, source },
  ])
}

// ─── Utility ───

function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  } catch {
    return dateStr
  }
}
