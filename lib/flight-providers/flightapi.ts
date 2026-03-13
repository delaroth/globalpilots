// ─── FlightAPI.io Provider Wrapper ───
// Adapts FlightAPI.io to the FlightProvider interface.
// Credit-managed: auto-disables when credits are exhausted,
// falls through to next provider in the chain silently.

import { searchFlightApi, isFlightApiAvailable } from '@/lib/flightapi'
import type { FlightProvider, FlightSearchParams, FlightOffer } from './types'
import { buildFlightLink } from '@/lib/affiliate'

export const flightapiProvider: FlightProvider = {
  name: 'flightapi',

  async isAvailable(): Promise<boolean> {
    return isFlightApiAvailable()
  },

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const { origin, destination, departDate, returnDate, adults, maxResults } = params

    const results = await searchFlightApi({
      origin,
      destination,
      departDate,
      adults: adults ?? 1,
      currency: 'USD',
    })

    return results
      .slice(0, maxResults ?? 10)
      .map(result => ({
        price: result.price,
        currency: result.currency,
        airlines: result.airlines,
        stops: result.stops,
        departureTime: result.departureTime,
        arrivalTime: result.arrivalTime,
        duration: result.duration,
        // Use FlightAPI booking URL if available, otherwise fall back to affiliate link
        bookingUrl: result.bookingUrl || buildFlightLink(origin, destination, departDate, returnDate),
        source: 'flightapi' as const,
        isLive: true,
        confidence: 'live' as const,
        fetchedAt: Date.now(),
        // Preserve segment data for the intelligence layer
        segments: result.segments.map(seg => ({
          origin: seg.origin,
          destination: seg.destination,
          departureTime: seg.departure,
          arrivalTime: seg.arrival,
          airline: seg.airline,
          flightNumber: seg.flightNumber,
          source: 'flightapi' as const,
          bookingUrl: buildFlightLink(origin, destination, departDate, returnDate),
        })),
      }))
  },

  // FlightAPI doesn't have a cheapest-destinations endpoint
  // Discovery stays with TravelPayouts/Kiwi
}
