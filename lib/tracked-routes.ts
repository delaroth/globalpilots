// ─── Price-History Route Matrix ───
// The deliberate data-moat: routes tracked daily by /api/cron/track-prices
// regardless of user alerts. Every day of history is calendar time a
// competitor cannot buy. Balkan-anchored (we live there, local affiliate
// strategy) + the Western/Central European origins budget travelers fly from.

export interface TrackedRoute {
  origin: string
  destination: string
}

// Origins: the big budget-travel source markets for the Balkans.
// TravelPayouts accepts metro city codes (LON covers LHR/LGW/STN etc.)
export const TRACKED_ORIGINS = [
  'LON', // London
  'BER', // Berlin
  'PAR', // Paris
  'AMS', // Amsterdam
  'MIL', // Milan
  'VIE', // Vienna
  'MAD', // Madrid
  'WAW', // Warsaw
] as const

// Destinations: Balkans + budget-adjacent. Matches cities present in
// lib/destination-costs.ts so total-trip-cost can be computed on top.
export const TRACKED_DESTINATIONS = [
  'SOF', // Sofia
  'VAR', // Varna (Black Sea summer)
  'BOJ', // Burgas (Black Sea summer)
  'BUH', // Bucharest (metro code)
  'CLJ', // Cluj-Napoca
  'BEG', // Belgrade
  'SKP', // Skopje
  'TIA', // Tirana
  'SJJ', // Sarajevo
  'TGD', // Podgorica
  'DBV', // Dubrovnik
  'SPU', // Split
  'ATH', // Athens
  'SKG', // Thessaloniki
  'IST', // Istanbul
] as const

/** Full origin × destination matrix (8 × 15 = 120 routes). */
export function getTrackedRoutes(): TrackedRoute[] {
  const routes: TrackedRoute[] = []
  for (const origin of TRACKED_ORIGINS) {
    for (const destination of TRACKED_DESTINATIONS) {
      routes.push({ origin, destination })
    }
  }
  return routes
}
