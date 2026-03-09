// Geolocation utilities

interface GeolocationResult {
  city: string
  airportCode: string
}

/**
 * Comprehensive list of major airports worldwide
 * Organized by region for easy navigation
 */
export const majorAirports = [
  // NORTH AMERICA - USA
  { code: 'ATL', city: 'Atlanta', country: 'USA', region: 'North America' },
  { code: 'AUS', city: 'Austin', country: 'USA', region: 'North America' },
  { code: 'BOS', city: 'Boston', country: 'USA', region: 'North America' },
  { code: 'BWI', city: 'Baltimore', country: 'USA', region: 'North America' },
  { code: 'CLT', city: 'Charlotte', country: 'USA', region: 'North America' },
  { code: 'DEN', city: 'Denver', country: 'USA', region: 'North America' },
  { code: 'DFW', city: 'Dallas', country: 'USA', region: 'North America' },
  { code: 'DTW', city: 'Detroit', country: 'USA', region: 'North America' },
  { code: 'EWR', city: 'Newark', country: 'USA', region: 'North America' },
  { code: 'HNL', city: 'Honolulu', country: 'USA', region: 'North America' },
  { code: 'HOU', city: 'Houston', country: 'USA', region: 'North America' },
  { code: 'IAD', city: 'Washington DC', country: 'USA', region: 'North America' },
  { code: 'JFK', city: 'New York JFK', country: 'USA', region: 'North America' },
  { code: 'LAS', city: 'Las Vegas', country: 'USA', region: 'North America' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', region: 'North America' },
  { code: 'MCO', city: 'Orlando', country: 'USA', region: 'North America' },
  { code: 'MIA', city: 'Miami', country: 'USA', region: 'North America' },
  { code: 'MSP', city: 'Minneapolis', country: 'USA', region: 'North America' },
  { code: 'MSY', city: 'New Orleans', country: 'USA', region: 'North America' },
  { code: 'ORD', city: 'Chicago', country: 'USA', region: 'North America' },
  { code: 'PDX', city: 'Portland', country: 'USA', region: 'North America' },
  { code: 'PHL', city: 'Philadelphia', country: 'USA', region: 'North America' },
  { code: 'PHX', city: 'Phoenix', country: 'USA', region: 'North America' },
  { code: 'SAN', city: 'San Diego', country: 'USA', region: 'North America' },
  { code: 'SEA', city: 'Seattle', country: 'USA', region: 'North America' },
  { code: 'SFO', city: 'San Francisco', country: 'USA', region: 'North America' },
  { code: 'SLC', city: 'Salt Lake City', country: 'USA', region: 'North America' },
  { code: 'TPA', city: 'Tampa', country: 'USA', region: 'North America' },

  // NORTH AMERICA - Canada
  { code: 'YVR', city: 'Vancouver', country: 'Canada', region: 'North America' },
  { code: 'YYC', city: 'Calgary', country: 'Canada', region: 'North America' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', region: 'North America' },
  { code: 'YUL', city: 'Montreal', country: 'Canada', region: 'North America' },
  { code: 'YOW', city: 'Ottawa', country: 'Canada', region: 'North America' },
  { code: 'YEG', city: 'Edmonton', country: 'Canada', region: 'North America' },

  // NORTH AMERICA - Mexico
  { code: 'MEX', city: 'Mexico City', country: 'Mexico', region: 'North America' },
  { code: 'CUN', city: 'Cancun', country: 'Mexico', region: 'North America' },
  { code: 'GDL', city: 'Guadalajara', country: 'Mexico', region: 'North America' },
  { code: 'MTY', city: 'Monterrey', country: 'Mexico', region: 'North America' },

  // EUROPE - UK & Ireland
  { code: 'LHR', city: 'London Heathrow', country: 'UK', region: 'Europe' },
  { code: 'LGW', city: 'London Gatwick', country: 'UK', region: 'Europe' },
  { code: 'MAN', city: 'Manchester', country: 'UK', region: 'Europe' },
  { code: 'EDI', city: 'Edinburgh', country: 'UK', region: 'Europe' },
  { code: 'DUB', city: 'Dublin', country: 'Ireland', region: 'Europe' },

  // EUROPE - Western Europe
  { code: 'CDG', city: 'Paris', country: 'France', region: 'Europe' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', region: 'Europe' },
  { code: 'MUC', city: 'Munich', country: 'Germany', region: 'Europe' },
  { code: 'BER', city: 'Berlin', country: 'Germany', region: 'Europe' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { code: 'BRU', city: 'Brussels', country: 'Belgium', region: 'Europe' },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland', region: 'Europe' },
  { code: 'GVA', city: 'Geneva', country: 'Switzerland', region: 'Europe' },
  { code: 'VIE', city: 'Vienna', country: 'Austria', region: 'Europe' },

  // EUROPE - Southern Europe
  { code: 'MAD', city: 'Madrid', country: 'Spain', region: 'Europe' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { code: 'FCO', city: 'Rome', country: 'Italy', region: 'Europe' },
  { code: 'MXP', city: 'Milan', country: 'Italy', region: 'Europe' },
  { code: 'VCE', city: 'Venice', country: 'Italy', region: 'Europe' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { code: 'ATH', city: 'Athens', country: 'Greece', region: 'Europe' },

  // EUROPE - Nordic Countries
  { code: 'ARN', city: 'Stockholm', country: 'Sweden', region: 'Europe' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark', region: 'Europe' },
  { code: 'OSL', city: 'Oslo', country: 'Norway', region: 'Europe' },
  { code: 'HEL', city: 'Helsinki', country: 'Finland', region: 'Europe' },

  // EUROPE - Eastern Europe
  { code: 'WAW', city: 'Warsaw', country: 'Poland', region: 'Europe' },
  { code: 'PRG', city: 'Prague', country: 'Czech Republic', region: 'Europe' },
  { code: 'BUD', city: 'Budapest', country: 'Hungary', region: 'Europe' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', region: 'Europe' },

  // ASIA - East Asia
  { code: 'NRT', city: 'Tokyo Narita', country: 'Japan', region: 'Asia' },
  { code: 'HND', city: 'Tokyo Haneda', country: 'Japan', region: 'Asia' },
  { code: 'KIX', city: 'Osaka', country: 'Japan', region: 'Asia' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', region: 'Asia' },
  { code: 'PEK', city: 'Beijing', country: 'China', region: 'Asia' },
  { code: 'PVG', city: 'Shanghai', country: 'China', region: 'Asia' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan', region: 'Asia' },

  // ASIA - Southeast Asia
  { code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', region: 'Asia' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia' },
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', region: 'Asia' },
  { code: 'MNL', city: 'Manila', country: 'Philippines', region: 'Asia' },
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam', region: 'Asia' },
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia' },

  // ASIA - South Asia
  { code: 'DEL', city: 'Delhi', country: 'India', region: 'Asia' },
  { code: 'BOM', city: 'Mumbai', country: 'India', region: 'Asia' },
  { code: 'BLR', city: 'Bangalore', country: 'India', region: 'Asia' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', region: 'Middle East' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', region: 'Middle East' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE', region: 'Middle East' },

  // OCEANIA
  { code: 'SYD', city: 'Sydney', country: 'Australia', region: 'Oceania' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', region: 'Oceania' },
  { code: 'BNE', city: 'Brisbane', country: 'Australia', region: 'Oceania' },
  { code: 'PER', city: 'Perth', country: 'Australia', region: 'Oceania' },
  { code: 'AKL', city: 'Auckland', country: 'New Zealand', region: 'Oceania' },
  { code: 'CHC', city: 'Christchurch', country: 'New Zealand', region: 'Oceania' },

  // SOUTH AMERICA
  { code: 'GRU', city: 'São Paulo', country: 'Brazil', region: 'South America' },
  { code: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', region: 'South America' },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', region: 'South America' },
  { code: 'SCL', city: 'Santiago', country: 'Chile', region: 'South America' },
  { code: 'LIM', city: 'Lima', country: 'Peru', region: 'South America' },
  { code: 'BOG', city: 'Bogotá', country: 'Colombia', region: 'South America' },

  // CENTRAL AMERICA & CARIBBEAN
  { code: 'PTY', city: 'Panama City', country: 'Panama', region: 'Central America' },
  { code: 'SJO', city: 'San José', country: 'Costa Rica', region: 'Central America' },
  { code: 'SJU', city: 'San Juan', country: 'Puerto Rico', region: 'Caribbean' },
  { code: 'NAS', city: 'Nassau', country: 'Bahamas', region: 'Caribbean' },

  // AFRICA
  { code: 'CAI', city: 'Cairo', country: 'Egypt', region: 'Africa' },
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', region: 'Africa' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', region: 'Africa' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', region: 'Africa' },
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', region: 'Africa' },
  { code: 'CMN', city: 'Casablanca', country: 'Morocco', region: 'Africa' },
]

/**
 * Get airport code from city name
 */
export function getAirportCodeFromCity(city: string): string | null {
  const normalizedCity = city.toLowerCase().trim()
  const found = majorAirports.find(
    airport => airport.city.toLowerCase() === normalizedCity
  )
  return found?.code || null
}

/**
 * Get user's approximate location using browser geolocation API
 */
export async function getUserLocation(): Promise<GeolocationResult | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
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
            airportCode: 'JFK',
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
 * Get airports by region
 */
export function getAirportsByRegion(region: string) {
  return majorAirports.filter(airport => airport.region === region)
}

/**
 * Get all unique regions
 */
export function getAllRegions() {
  const regions = [...new Set(majorAirports.map(airport => airport.region))]
  return regions.sort()
}

/**
 * Search airports by city name
 */
export function searchAirports(query: string) {
  const normalized = query.toLowerCase().trim()
  return majorAirports.filter(airport =>
    airport.city.toLowerCase().includes(normalized) ||
    airport.country.toLowerCase().includes(normalized) ||
    airport.code.toLowerCase().includes(normalized)
  )
}
