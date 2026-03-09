// Geolocation utilities

interface GeolocationResult {
  city: string
  airportCode: string
}

// Map major cities to airport codes (expandable)
const cityToAirportMap: Record<string, string> = {
  'new york': 'NYC',
  'los angeles': 'LAX',
  'chicago': 'CHI',
  'houston': 'HOU',
  'miami': 'MIA',
  'san francisco': 'SFO',
  'seattle': 'SEA',
  'boston': 'BOS',
  'atlanta': 'ATL',
  'dallas': 'DFW',
  'washington': 'WAS',
  'philadelphia': 'PHL',
  'phoenix': 'PHX',
  'las vegas': 'LAS',
  'denver': 'DEN',
  'london': 'LON',
  'paris': 'PAR',
  'tokyo': 'TYO',
  'sydney': 'SYD',
  'toronto': 'YTO',
  'vancouver': 'YVR',
  'montreal': 'YMQ',
}

/**
 * Get user's approximate location using browser geolocation API
 */
export async function getUserLocation(): Promise<GeolocationResult | null> {
  if (!navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city name
          // For production, you'd use a proper geocoding service
          // For now, we'll return a default
          resolve({
            city: 'New York',
            airportCode: 'NYC',
          })
        } catch (error) {
          resolve(null)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        resolve(null)
      },
      {
        timeout: 5000,
        maximumAge: 3600000, // 1 hour
      }
    )
  })
}

/**
 * Get airport code from city name
 */
export function getAirportCodeFromCity(city: string): string | null {
  const normalizedCity = city.toLowerCase().trim()
  return cityToAirportMap[normalizedCity] || null
}

/**
 * Get major airport codes for testing
 */
export const majorAirports = [
  { code: 'NYC', city: 'New York' },
  { code: 'LAX', city: 'Los Angeles' },
  { code: 'CHI', city: 'Chicago' },
  { code: 'MIA', city: 'Miami' },
  { code: 'SFO', city: 'San Francisco' },
  { code: 'BOS', city: 'Boston' },
  { code: 'SEA', city: 'Seattle' },
  { code: 'ATL', city: 'Atlanta' },
  { code: 'DEN', city: 'Denver' },
  { code: 'LAS', city: 'Las Vegas' },
]
