import {
  searchFlights as amadeusSearchFlights,
  isAmadeusAvailable,
} from '@/lib/amadeus'
import type { FlightProvider, FlightSearchParams, FlightOffer } from './types'
import { buildFlightLink } from '@/lib/affiliate'

/**
 * Convert ISO 8601 duration (PT14H30M) to human-readable string
 */
function formatIsoDuration(iso: string): string {
  if (!iso) return ''
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const hours = match[1] ? `${match[1]}h` : ''
  const minutes = match[2] ? `${match[2]}m` : ''
  return `${hours}${minutes ? ' ' : ''}${minutes}`.trim()
}

export const amadeusProvider: FlightProvider = {
  name: 'amadeus',

  async isAvailable(): Promise<boolean> {
    return isAmadeusAvailable()
  },

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const { origin, destination, departDate, returnDate, adults, maxResults } = params

    const result = await amadeusSearchFlights({
      origin,
      destination,
      departureDate: departDate,
      returnDate,
      adults: adults ?? 1,
      max: maxResults ?? 10,
    })

    return result.offers.map((offer) => ({
      price: offer.price,
      currency: offer.currency,
      airlines: offer.airlines,
      stops: offer.stops,
      departureTime: offer.departureTime,
      arrivalTime: offer.arrivalTime,
      duration: formatIsoDuration(offer.duration),
      bookingUrl: buildFlightLink(origin, destination, departDate, returnDate),
      source: 'amadeus' as const,
      isLive: true,
    }))
  },

  // Amadeus doesn't have a dedicated cheapest-destinations endpoint
  // (Flight Inspiration API requires production approval), so omit searchCheapest
}
