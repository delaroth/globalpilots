import {
  searchFlights as kiwiSearchFlights,
  searchCheapestDestinations,
  isKiwiAvailable,
} from '@/lib/kiwi'
import type { FlightProvider, FlightSearchParams, FlightOffer, CheapestDestination } from './types'

/**
 * Convert duration in minutes to a readable string like "14h 30m"
 */
function formatMinutes(minutes: number): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m > 0 ? ` ${m}m` : ''}`
}

export const kiwiProvider: FlightProvider = {
  name: 'kiwi',

  async isAvailable(): Promise<boolean> {
    return isKiwiAvailable()
  },

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const { origin, destination, departDate, returnDate, maxResults } = params

    const results = await kiwiSearchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      maxResults: maxResults ?? 10,
    })

    return results.map((flight) => ({
      price: flight.price,
      currency: flight.currency,
      airlines: flight.airlines,
      stops: flight.stops,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: formatMinutes(flight.duration),
      bookingUrl: flight.deepLink,
      source: 'kiwi' as const,
      isLive: true,
    }))
  },

  async searchCheapest(params: {
    origin: string
    departDate: string
    returnDate?: string
    limit?: number
  }): Promise<CheapestDestination[]> {
    const results = await searchCheapestDestinations({
      origin: params.origin,
      departDate: params.departDate,
      returnDate: params.returnDate,
      limit: params.limit ?? 20,
    })

    return results.map((r) => ({
      destination: r.destinationCode,
      city: r.cityName,
      price: r.price,
      departDate: r.departureTime,
      returnDate: r.arrivalTime || undefined,
      source: 'kiwi',
    }))
  },
}
