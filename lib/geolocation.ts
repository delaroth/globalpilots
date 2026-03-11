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
  { code: 'BNA', city: 'Nashville', country: 'USA', region: 'North America' },
  { code: 'BOS', city: 'Boston', country: 'USA', region: 'North America' },
  { code: 'BWI', city: 'Baltimore', country: 'USA', region: 'North America' },
  { code: 'CLE', city: 'Cleveland', country: 'USA', region: 'North America' },
  { code: 'CLT', city: 'Charlotte', country: 'USA', region: 'North America' },
  { code: 'DEN', city: 'Denver', country: 'USA', region: 'North America' },
  { code: 'DFW', city: 'Dallas', country: 'USA', region: 'North America' },
  { code: 'DTW', city: 'Detroit', country: 'USA', region: 'North America' },
  { code: 'EWR', city: 'Newark', country: 'USA', region: 'North America' },
  { code: 'HNL', city: 'Honolulu', country: 'USA', region: 'North America' },
  { code: 'HOU', city: 'Houston Hobby', country: 'USA', region: 'North America' },
  { code: 'IAH', city: 'Houston', country: 'USA', region: 'North America' },
  { code: 'IAD', city: 'Washington DC', country: 'USA', region: 'North America' },
  { code: 'IND', city: 'Indianapolis', country: 'USA', region: 'North America' },
  { code: 'JFK', city: 'New York JFK', country: 'USA', region: 'North America' },
  { code: 'LAS', city: 'Las Vegas', country: 'USA', region: 'North America' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', region: 'North America' },
  { code: 'MCO', city: 'Orlando', country: 'USA', region: 'North America' },
  { code: 'MIA', city: 'Miami', country: 'USA', region: 'North America' },
  { code: 'MSP', city: 'Minneapolis', country: 'USA', region: 'North America' },
  { code: 'MSY', city: 'New Orleans', country: 'USA', region: 'North America' },
  { code: 'OAK', city: 'Oakland', country: 'USA', region: 'North America' },
  { code: 'ORD', city: 'Chicago', country: 'USA', region: 'North America' },
  { code: 'PDX', city: 'Portland', country: 'USA', region: 'North America' },
  { code: 'PHL', city: 'Philadelphia', country: 'USA', region: 'North America' },
  { code: 'PHX', city: 'Phoenix', country: 'USA', region: 'North America' },
  { code: 'PIT', city: 'Pittsburgh', country: 'USA', region: 'North America' },
  { code: 'RDU', city: 'Raleigh', country: 'USA', region: 'North America' },
  { code: 'SAN', city: 'San Diego', country: 'USA', region: 'North America' },
  { code: 'SAT', city: 'San Antonio', country: 'USA', region: 'North America' },
  { code: 'SEA', city: 'Seattle', country: 'USA', region: 'North America' },
  { code: 'SFO', city: 'San Francisco', country: 'USA', region: 'North America' },
  { code: 'SJC', city: 'San Jose', country: 'USA', region: 'North America' },
  { code: 'SLC', city: 'Salt Lake City', country: 'USA', region: 'North America' },
  { code: 'STL', city: 'St. Louis', country: 'USA', region: 'North America' },
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
  // Spain
  { code: 'MAD', city: 'Madrid', country: 'Spain', region: 'Europe' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { code: 'AGP', city: 'Malaga', country: 'Spain', region: 'Europe' },
  { code: 'VLC', city: 'Valencia', country: 'Spain', region: 'Europe' },
  { code: 'SVQ', city: 'Seville', country: 'Spain', region: 'Europe' },
  { code: 'PMI', city: 'Palma de Mallorca', country: 'Spain', region: 'Europe' },

  // Italy
  { code: 'FCO', city: 'Rome', country: 'Italy', region: 'Europe' },
  { code: 'MXP', city: 'Milan', country: 'Italy', region: 'Europe' },
  { code: 'VCE', city: 'Venice', country: 'Italy', region: 'Europe' },
  { code: 'NAP', city: 'Naples', country: 'Italy', region: 'Europe' },
  { code: 'FLR', city: 'Florence', country: 'Italy', region: 'Europe' },
  { code: 'BLQ', city: 'Bologna', country: 'Italy', region: 'Europe' },

  // Portugal
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { code: 'OPO', city: 'Porto', country: 'Portugal', region: 'Europe' },
  { code: 'FAO', city: 'Faro', country: 'Portugal', region: 'Europe' },

  // Greece
  { code: 'ATH', city: 'Athens', country: 'Greece', region: 'Europe' },
  { code: 'SKG', city: 'Thessaloniki', country: 'Greece', region: 'Europe' },

  // EUROPE - Nordic Countries
  { code: 'ARN', city: 'Stockholm', country: 'Sweden', region: 'Europe' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark', region: 'Europe' },
  { code: 'OSL', city: 'Oslo', country: 'Norway', region: 'Europe' },
  { code: 'HEL', city: 'Helsinki', country: 'Finland', region: 'Europe' },

  // EUROPE - Eastern Europe & Balkans
  { code: 'WAW', city: 'Warsaw', country: 'Poland', region: 'Europe' },
  { code: 'PRG', city: 'Prague', country: 'Czech Republic', region: 'Europe' },
  { code: 'BUD', city: 'Budapest', country: 'Hungary', region: 'Europe' },
  { code: 'OTP', city: 'Bucharest', country: 'Romania', region: 'Europe' },
  { code: 'SOF', city: 'Sofia', country: 'Bulgaria', region: 'Europe' },
  { code: 'BEG', city: 'Belgrade', country: 'Serbia', region: 'Europe' },
  { code: 'ZAG', city: 'Zagreb', country: 'Croatia', region: 'Europe' },
  { code: 'RIX', city: 'Riga', country: 'Latvia', region: 'Europe' },
  { code: 'TLL', city: 'Tallinn', country: 'Estonia', region: 'Europe' },
  { code: 'VNO', city: 'Vilnius', country: 'Lithuania', region: 'Europe' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', region: 'Europe' },
  { code: 'SAW', city: 'Istanbul Sabiha', country: 'Turkey', region: 'Europe' },
  { code: 'AYT', city: 'Antalya', country: 'Turkey', region: 'Europe' },

  // ASIA - East Asia
  // Japan
  { code: 'NRT', city: 'Tokyo Narita', country: 'Japan', region: 'Asia' },
  { code: 'HND', city: 'Tokyo Haneda', country: 'Japan', region: 'Asia' },
  { code: 'KIX', city: 'Osaka', country: 'Japan', region: 'Asia' },
  { code: 'NGO', city: 'Nagoya', country: 'Japan', region: 'Asia' },
  { code: 'FUK', city: 'Fukuoka', country: 'Japan', region: 'Asia' },
  { code: 'CTS', city: 'Sapporo', country: 'Japan', region: 'Asia' },
  { code: 'OKA', city: 'Okinawa', country: 'Japan', region: 'Asia' },

  // South Korea
  { code: 'ICN', city: 'Seoul', country: 'South Korea', region: 'Asia' },
  { code: 'GMP', city: 'Seoul Gimpo', country: 'South Korea', region: 'Asia' },
  { code: 'PUS', city: 'Busan', country: 'South Korea', region: 'Asia' },
  { code: 'CJU', city: 'Jeju', country: 'South Korea', region: 'Asia' },

  // China
  { code: 'PEK', city: 'Beijing', country: 'China', region: 'Asia' },
  { code: 'PKX', city: 'Beijing Daxing', country: 'China', region: 'Asia' },
  { code: 'PVG', city: 'Shanghai Pudong', country: 'China', region: 'Asia' },
  { code: 'SHA', city: 'Shanghai Hongqiao', country: 'China', region: 'Asia' },
  { code: 'CAN', city: 'Guangzhou', country: 'China', region: 'Asia' },
  { code: 'SZX', city: 'Shenzhen', country: 'China', region: 'Asia' },
  { code: 'CTU', city: 'Chengdu', country: 'China', region: 'Asia' },
  { code: 'XIY', city: 'Xi\'an', country: 'China', region: 'Asia' },
  { code: 'KMG', city: 'Kunming', country: 'China', region: 'Asia' },

  // Hong Kong, Macau, Taiwan
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
  { code: 'MFM', city: 'Macau', country: 'Macau', region: 'Asia' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan', region: 'Asia' },
  { code: 'KHH', city: 'Kaohsiung', country: 'Taiwan', region: 'Asia' },

  // ASIA - Southeast Asia
  { code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia' },

  // Thailand
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', region: 'Asia' },
  { code: 'CNX', city: 'Chiang Mai', country: 'Thailand', region: 'Asia' },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', region: 'Asia' },
  { code: 'HDY', city: 'Hat Yai', country: 'Thailand', region: 'Asia' },
  { code: 'USM', city: 'Ko Samui', country: 'Thailand', region: 'Asia' },
  { code: 'KKC', city: 'Khon Kaen', country: 'Thailand', region: 'Asia' },
  { code: 'UTH', city: 'Udon Thani', country: 'Thailand', region: 'Asia' },
  { code: 'BFV', city: 'Buriram', country: 'Thailand', region: 'Asia' },
  { code: 'ROI', city: 'Roi Et', country: 'Thailand', region: 'Asia' },
  { code: 'NAK', city: 'Nakhon Ratchasima', country: 'Thailand', region: 'Asia' },
  { code: 'CEI', city: 'Chiang Rai', country: 'Thailand', region: 'Asia' },
  { code: 'URT', city: 'Surat Thani', country: 'Thailand', region: 'Asia' },

  // Malaysia
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia' },
  { code: 'PEN', city: 'Penang', country: 'Malaysia', region: 'Asia' },
  { code: 'JHB', city: 'Johor Bahru', country: 'Malaysia', region: 'Asia' },
  { code: 'KCH', city: 'Kuching', country: 'Malaysia', region: 'Asia' },

  // Indonesia
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', region: 'Asia' },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', region: 'Asia' },
  { code: 'SUB', city: 'Surabaya', country: 'Indonesia', region: 'Asia' },

  // Philippines
  { code: 'MNL', city: 'Manila', country: 'Philippines', region: 'Asia' },
  { code: 'CEB', city: 'Cebu', country: 'Philippines', region: 'Asia' },

  // Vietnam
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam', region: 'Asia' },
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia' },
  { code: 'DAD', city: 'Da Nang', country: 'Vietnam', region: 'Asia' },

  // Cambodia & Laos
  { code: 'PNH', city: 'Phnom Penh', country: 'Cambodia', region: 'Asia' },
  { code: 'REP', city: 'Siem Reap', country: 'Cambodia', region: 'Asia' },
  { code: 'VTE', city: 'Vientiane', country: 'Laos', region: 'Asia' },

  // ASIA - South Asia
  // India
  { code: 'DEL', city: 'Delhi', country: 'India', region: 'Asia' },
  { code: 'BOM', city: 'Mumbai', country: 'India', region: 'Asia' },
  { code: 'BLR', city: 'Bangalore', country: 'India', region: 'Asia' },
  { code: 'HYD', city: 'Hyderabad', country: 'India', region: 'Asia' },
  { code: 'MAA', city: 'Chennai', country: 'India', region: 'Asia' },
  { code: 'CCU', city: 'Kolkata', country: 'India', region: 'Asia' },
  { code: 'GOI', city: 'Goa', country: 'India', region: 'Asia' },
  { code: 'COK', city: 'Kochi', country: 'India', region: 'Asia' },
  { code: 'AMD', city: 'Ahmedabad', country: 'India', region: 'Asia' },
  { code: 'PNQ', city: 'Pune', country: 'India', region: 'Asia' },

  // Pakistan, Bangladesh, Sri Lanka, Nepal
  { code: 'KHI', city: 'Karachi', country: 'Pakistan', region: 'Asia' },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan', region: 'Asia' },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan', region: 'Asia' },
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', region: 'Asia' },
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', region: 'Asia' },
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal', region: 'Asia' },

  // MIDDLE EAST
  { code: 'DXB', city: 'Dubai', country: 'UAE', region: 'Middle East' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE', region: 'Middle East' },
  { code: 'SHJ', city: 'Sharjah', country: 'UAE', region: 'Middle East' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', region: 'Middle East' },
  { code: 'BAH', city: 'Bahrain', country: 'Bahrain', region: 'Middle East' },
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait', region: 'Middle East' },
  { code: 'MCT', city: 'Muscat', country: 'Oman', region: 'Middle East' },
  { code: 'AMM', city: 'Amman', country: 'Jordan', region: 'Middle East' },
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel', region: 'Middle East' },
  { code: 'CAI', city: 'Cairo', country: 'Egypt', region: 'Middle East' },

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
