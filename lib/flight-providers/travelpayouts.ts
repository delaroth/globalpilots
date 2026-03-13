import type { FlightProvider, FlightSearchParams, FlightOffer, CheapestDestination } from './types'
import { buildFlightLink } from '@/lib/affiliate'

const API_BASE = 'https://api.travelpayouts.com'

function getToken(): string | undefined {
  return process.env.TRAVELPAYOUTS_TOKEN
}

/**
 * TravelPayouts flight provider — uses cached/aggregated data.
 * Prices are not live quotes; they are based on recent search history.
 * All results are marked with isLive = false.
 */
export const travelpayoutsProvider: FlightProvider = {
  name: 'travelpayouts',

  async isAvailable(): Promise<boolean> {
    return !!getToken()
  },

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const token = getToken()
    if (!token) throw new Error('TravelPayouts token not configured')

    const { origin, destination, departDate, returnDate, maxResults = 5 } = params

    // Use v2/prices/latest for a specific route — filters by date if provided
    let url = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&limit=${maxResults}&token=${token}`
    if (departDate) {
      url += `&depart_date=${departDate}`
    }

    console.log(`[TravelPayouts] Searching flights: ${origin} -> ${destination} on ${departDate}`)

    const response = await fetch(url, { next: { revalidate: 21600 } })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`TravelPayouts API error ${response.status}: ${text.slice(0, 200)}`)
    }

    const data = await response.json()
    const deals = data.data || []

    return deals.map((deal: any) => ({
      price: deal.value,
      currency: 'USD',
      airlines: deal.airline ? [deal.airline] : [],
      stops: deal.number_of_changes ?? 0,
      departureTime: deal.depart_date || '',
      arrivalTime: deal.return_date || '',
      duration: undefined,
      bookingUrl: buildFlightLink(origin, destination, deal.depart_date || departDate, returnDate || deal.return_date),
      source: 'travelpayouts' as const,
      isLive: false,
    }))
  },

  async searchCheapest(params: {
    origin: string
    departDate: string
    returnDate?: string
    limit?: number
  }): Promise<CheapestDestination[]> {
    const token = getToken()
    if (!token) throw new Error('TravelPayouts token not configured')

    const { origin, departDate, limit = 20 } = params

    // Fetch all destinations from origin, then filter by date proximity
    const url = `${API_BASE}/v2/prices/latest?origin=${origin}&limit=200&currency=usd&token=${token}`

    console.log(`[TravelPayouts] Searching cheapest destinations from ${origin}`)

    const response = await fetch(url, { next: { revalidate: 21600 } })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`TravelPayouts API error ${response.status}: ${text.slice(0, 200)}`)
    }

    const data = await response.json()
    let deals = data.data || []

    // Filter by departure date proximity (within 3 days)
    if (departDate && departDate.length === 10) {
      const target = new Date(departDate)
      deals = deals.filter((d: any) => {
        const depart = new Date(d.depart_date)
        const diff = Math.abs(depart.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 3
      })
    } else if (departDate && departDate.length === 7) {
      deals = deals.filter((d: any) => d.depart_date?.startsWith(departDate))
    }

    // Filter out past dates
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    deals = deals.filter((d: any) => new Date(d.depart_date) >= now)

    // Sort by price, deduplicate by destination
    deals.sort((a: any, b: any) => a.value - b.value)

    const seen = new Set<string>()
    const results: CheapestDestination[] = []

    for (const deal of deals) {
      if (seen.has(deal.destination) || deal.destination === origin) continue
      seen.add(deal.destination)
      results.push({
        destination: deal.destination,
        city: deal.destination, // TravelPayouts only returns IATA codes here
        price: deal.value,
        departDate: deal.depart_date,
        returnDate: deal.return_date || undefined,
        source: 'travelpayouts',
      })
      if (results.length >= limit) break
    }

    return results
  },
}
