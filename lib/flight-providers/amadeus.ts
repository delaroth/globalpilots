// ─── Amadeus Provider (DORMANT) ───
// Amadeus Self-Service API is being decommissioned July 17, 2026.
// This file is preserved but not imported into the provider chain.
// If Amadeus Enterprise becomes viable, re-enable by adding to index.ts.
//
// To reactivate:
// 1. Add 'amadeus' back to FlightSource union in types.ts
// 2. Import amadeusProvider in index.ts
// 3. Set live AMADEUS_* env vars

import type { FlightProvider, FlightSearchParams, FlightOffer } from './types'

export const amadeusProvider: FlightProvider = {
  name: 'amadeus',

  async isAvailable(): Promise<boolean> {
    // Always unavailable — self-service decommissioned
    return false
  },

  async searchFlights(_params: FlightSearchParams): Promise<FlightOffer[]> {
    return []
  },
}
