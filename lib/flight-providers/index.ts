import { kiwiProvider } from './kiwi'
import { flightapiProvider } from './flightapi'
import { travelpayoutsProvider } from './travelpayouts'
import type { FlightSearchParams, FlightOffer, CheapestDestination, FlightProvider } from './types'

export type { FlightSearchParams, FlightOffer, CheapestDestination, FlightProvider }

// Priority order: Kiwi (live LCC + deep links) → FlightAPI.io (live, credit-managed) → TravelPayouts (cached fallback)
// Amadeus removed: self-service portal decommissioned July 2026.
// FlightAPI auto-disables when credits are exhausted → falls through to TravelPayouts silently.
const providers: FlightProvider[] = [
  kiwiProvider,
  flightapiProvider,
  travelpayoutsProvider,
]

/**
 * Search flights across multiple providers with automatic fallback.
 * Tries providers in priority order: Kiwi → FlightAPI.io → TravelPayouts.
 * Returns the first successful result along with source metadata.
 */
export async function searchFlightsMultiProvider(
  params: FlightSearchParams
): Promise<{ offers: FlightOffer[]; provider: string }> {
  for (const provider of providers) {
    try {
      const available = await provider.isAvailable()
      if (!available) {
        console.log(`[FlightProviders] ${provider.name}: not available, skipping`)
        continue
      }

      console.log(`[FlightProviders] ${provider.name}: searching ${params.origin} → ${params.destination}`)
      const offers = await provider.searchFlights(params)

      if (offers.length > 0) {
        console.log(`[FlightProviders] ${provider.name}: returned ${offers.length} offers (cheapest: $${offers[0]?.price})`)
        return { offers, provider: provider.name }
      }

      console.log(`[FlightProviders] ${provider.name}: returned 0 results, trying next provider`)
    } catch (err) {
      console.warn(`[FlightProviders] ${provider.name}: error —`, err instanceof Error ? err.message : err)
    }
  }

  console.warn('[FlightProviders] All providers failed or returned no results')
  return { offers: [], provider: 'none' }
}

/**
 * Find cheapest destinations from an origin across providers with fallback.
 * Tries providers that support searchCheapest in priority order.
 */
export async function getCheapestDestinations(params: {
  origin: string
  departDate: string
  returnDate?: string
  limit?: number
}): Promise<{ destinations: CheapestDestination[]; provider: string }> {
  for (const provider of providers) {
    if (!provider.searchCheapest) continue

    try {
      const available = await provider.isAvailable()
      if (!available) {
        console.log(`[FlightProviders] ${provider.name}: not available for cheapest search, skipping`)
        continue
      }

      console.log(`[FlightProviders] ${provider.name}: searching cheapest from ${params.origin}`)
      const destinations = await provider.searchCheapest(params)

      if (destinations.length > 0) {
        console.log(`[FlightProviders] ${provider.name}: found ${destinations.length} cheap destinations`)
        return { destinations, provider: provider.name }
      }

      console.log(`[FlightProviders] ${provider.name}: returned 0 cheap destinations, trying next`)
    } catch (err) {
      console.warn(`[FlightProviders] ${provider.name}: cheapest search error —`, err instanceof Error ? err.message : err)
    }
  }

  console.warn('[FlightProviders] All providers failed for cheapest destinations search')
  return { destinations: [], provider: 'none' }
}

/**
 * Get a single cheapest price for a route via the multi-provider system.
 * Convenience wrapper used by layover arbitrage calculations.
 */
export async function getCheapestRoutePrice(
  origin: string,
  destination: string,
  departDate: string
): Promise<{ price: number | null; provider: string }> {
  const { offers, provider } = await searchFlightsMultiProvider({
    origin,
    destination,
    departDate,
    maxResults: 1,
  })

  return {
    price: offers.length > 0 ? offers[0].price : null,
    provider,
  }
}
