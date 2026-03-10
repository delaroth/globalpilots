// Major airline hub cities for layover arbitrage

export const majorHubs = [
  // Top priority hubs (most common international connections)
  { code: 'SIN', city: 'Singapore', region: 'Asia' },
  { code: 'DXB', city: 'Dubai', region: 'Middle East' },
  { code: 'IST', city: 'Istanbul', region: 'Europe/Asia' },
  { code: 'DOH', city: 'Doha', region: 'Middle East' },
  { code: 'KUL', city: 'Kuala Lumpur', region: 'Asia' },
  // Other major hubs
  { code: 'LHR', city: 'London', region: 'Europe' },
  { code: 'CDG', city: 'Paris', region: 'Europe' },
  { code: 'AMS', city: 'Amsterdam', region: 'Europe' },
  { code: 'FRA', city: 'Frankfurt', region: 'Europe' },
  { code: 'HKG', city: 'Hong Kong', region: 'Asia' },
  { code: 'ICN', city: 'Seoul', region: 'Asia' },
  { code: 'NRT', city: 'Tokyo', region: 'Asia' },
  { code: 'LAX', city: 'Los Angeles', region: 'North America' },
  { code: 'JFK', city: 'New York', region: 'North America' },
  { code: 'ORD', city: 'Chicago', region: 'North America' },
  { code: 'DFW', city: 'Dallas', region: 'North America' },
  { code: 'ATL', city: 'Atlanta', region: 'North America' },
]

export interface LayoverRoute {
  hub: typeof majorHubs[0]
  leg1Price: number
  leg2Price: number
  totalPrice: number
  savings: number
  savingsPercent: number
}

/**
 * Calculate layover arbitrage opportunities
 */
export function calculateLayoverSavings(
  directPrice: number,
  layoverRoutes: LayoverRoute[]
): LayoverRoute[] {
  return layoverRoutes
    .map(route => ({
      ...route,
      savings: directPrice - route.totalPrice,
      savingsPercent: Math.round(((directPrice - route.totalPrice) / directPrice) * 100),
    }))
    .filter(route => route.savings > 0)
    .sort((a, b) => b.savings - a.savings)
}
