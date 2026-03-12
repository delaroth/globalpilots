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
 * Find the nearest airport to given coordinates using haversine distance
 */
function findNearestAirport(lat: number, lon: number): { code: string; city: string } | null {
  // Airport coordinates (approximate) for major airports
  const airportCoords: Record<string, { lat: number; lon: number }> = {
    BKK: { lat: 13.69, lon: 100.75 }, SIN: { lat: 1.35, lon: 103.99 },
    KUL: { lat: 2.74, lon: 101.70 }, CGK: { lat: -6.13, lon: 106.66 },
    MNL: { lat: 14.51, lon: 121.02 }, HKG: { lat: 22.31, lon: 113.92 },
    NRT: { lat: 35.76, lon: 140.39 }, ICN: { lat: 37.46, lon: 126.44 },
    PVG: { lat: 31.14, lon: 121.81 }, DEL: { lat: 28.56, lon: 77.10 },
    BOM: { lat: 19.09, lon: 72.87 }, DXB: { lat: 25.25, lon: 55.36 },
    DOH: { lat: 25.26, lon: 51.57 }, IST: { lat: 41.26, lon: 28.74 },
    LHR: { lat: 51.47, lon: -0.46 }, CDG: { lat: 49.01, lon: 2.55 },
    AMS: { lat: 52.31, lon: 4.77 }, FRA: { lat: 50.03, lon: 8.57 },
    FCO: { lat: 41.80, lon: 12.25 }, BCN: { lat: 41.30, lon: 2.08 },
    MAD: { lat: 40.47, lon: -3.56 }, LIS: { lat: 38.77, lon: -9.13 },
    JFK: { lat: 40.64, lon: -73.78 }, LAX: { lat: 33.94, lon: -118.41 },
    ORD: { lat: 41.97, lon: -87.91 }, MIA: { lat: 25.80, lon: -80.29 },
    SFO: { lat: 37.62, lon: -122.38 }, ATL: { lat: 33.64, lon: -84.43 },
    SYD: { lat: -33.95, lon: 151.18 }, MEL: { lat: -37.67, lon: 144.84 },
    GRU: { lat: -23.43, lon: -46.47 }, HAN: { lat: 21.22, lon: 105.81 },
    SGN: { lat: 10.82, lon: 106.65 }, HKT: { lat: 8.11, lon: 98.32 },
    CNX: { lat: 18.77, lon: 98.96 }, DPS: { lat: -8.75, lon: 115.17 },
    TPE: { lat: 25.08, lon: 121.23 }, CMB: { lat: 7.18, lon: 79.88 },
    CAI: { lat: 30.12, lon: 31.41 }, NBO: { lat: -1.32, lon: 36.93 },
    CPT: { lat: -33.96, lon: 18.60 }, YYZ: { lat: 43.68, lon: -79.63 },
    SEA: { lat: 47.45, lon: -122.31 }, DEN: { lat: 39.86, lon: -104.67 },
  }

  const toRad = (deg: number) => deg * Math.PI / 180
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  let nearest: { code: string; dist: number } | null = null
  for (const [code, coords] of Object.entries(airportCoords)) {
    const dist = haversine(lat, lon, coords.lat, coords.lon)
    if (!nearest || dist < nearest.dist) {
      nearest = { code, dist }
    }
  }

  if (!nearest) return null
  const airport = majorAirports.find(a => a.code === nearest!.code)
  return airport ? { code: airport.code, city: airport.city } : null
}

const SESSION_KEY = 'globepilot_user_location'

/**
 * Get user's approximate location using browser geolocation API
 * Finds nearest airport by lat/lon, caches in sessionStorage
 * Defaults to BKK (primary audience is SE Asia based)
 */
export async function getUserLocation(): Promise<GeolocationResult | null> {
  if (typeof window === 'undefined') {
    return { city: 'Bangkok', airportCode: 'BKK' }
  }

  // Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { city: 'Bangkok', airportCode: 'BKK' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const nearest = findNearestAirport(position.coords.latitude, position.coords.longitude)
          const result: GeolocationResult = nearest
            ? { city: nearest.city, airportCode: nearest.code }
            : { city: 'Bangkok', airportCode: 'BKK' }

          // Cache in sessionStorage
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(result)) } catch {}

          resolve(result)
        } catch {
          resolve({ city: 'Bangkok', airportCode: 'BKK' })
        }
      },
      () => {
        // Geolocation denied or unavailable — default to BKK
        const result = { city: 'Bangkok', airportCode: 'BKK' }
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(result)) } catch {}
        resolve(result)
      },
      {
        timeout: 5000,
        maximumAge: 3600000,
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
