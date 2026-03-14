// Fetches country information from REST Countries API (free, no key)
// https://restcountries.com/v3.1/alpha/{countryCode}

export interface CountryData {
  flag: string
  languages: string[]
  currency: { code: string; name: string; symbol: string }
  capital: string
  population: number
  region: string
  subregion: string
  drivingSide: string
  timezones: string[]
  mapUrl: string
}

// Static map of country names (as used in destination-costs.ts) to ISO 3166-1 alpha-2 codes
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'Thailand': 'TH',
  'Indonesia': 'ID',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Vietnam': 'VN',
  'Philippines': 'PH',
  'Cambodia': 'KH',
  'Laos': 'LA',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Hong Kong': 'HK',
  'Taiwan': 'TW',
  'China': 'CN',
  'India': 'IN',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'UAE': 'AE',
  'Turkey': 'TR',
  'Qatar': 'QA',
  'Israel': 'IL',
  'Jordan': 'JO',
  'Egypt': 'EG',
  'UK': 'GB',
  'France': 'FR',
  'Netherlands': 'NL',
  'Spain': 'ES',
  'Portugal': 'PT',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Greece': 'GR',
  'Italy': 'IT',
  'Germany': 'DE',
  'Austria': 'AT',
  'Poland': 'PL',
  'Denmark': 'DK',
  'Ireland': 'IE',
  'USA': 'US',
  'Mexico': 'MX',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Argentina': 'AR',
  'Brazil': 'BR',
  'Chile': 'CL',
  'Panama': 'PA',
  'Costa Rica': 'CR',
  'Morocco': 'MA',
  'South Africa': 'ZA',
  'Kenya': 'KE',
  'Senegal': 'SN',
  'Georgia': 'GE',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  // Additional common names / variants
  'United States': 'US',
  'United Kingdom': 'GB',
  'United Arab Emirates': 'AE',
  'Turkiye': 'TR',
  'Czechia': 'CZ',
  'Republic of Korea': 'KR',
  'Korea': 'KR',
  'Ivory Coast': 'CI',
  'Cote d\'Ivoire': 'CI',
  'Macau': 'MO',
  'Myanmar': 'MM',
  'Burma': 'MM',
  'Brunei': 'BN',
  'Bangladesh': 'BD',
  'Pakistan': 'PK',
  'Oman': 'OM',
  'Kuwait': 'KW',
  'Bahrain': 'BH',
  'Saudi Arabia': 'SA',
  'Lebanon': 'LB',
  'Iraq': 'IQ',
  'Iran': 'IR',
  'Russia': 'RU',
  'Ukraine': 'UA',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Croatia': 'HR',
  'Serbia': 'RS',
  'Slovenia': 'SI',
  'Slovakia': 'SK',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Iceland': 'IS',
  'Canada': 'CA',
  'Cuba': 'CU',
  'Dominican Republic': 'DO',
  'Jamaica': 'JM',
  'Ecuador': 'EC',
  'Bolivia': 'BO',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Venezuela': 'VE',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'El Salvador': 'SV',
  'Nicaragua': 'NI',
  'Belize': 'BZ',
  'Trinidad and Tobago': 'TT',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Ethiopia': 'ET',
  'Tanzania': 'TZ',
  'Uganda': 'UG',
  'Rwanda': 'RW',
  'Mozambique': 'MZ',
  'Madagascar': 'MG',
  'Namibia': 'NA',
  'Botswana': 'BW',
  'Zimbabwe': 'ZW',
  'Zambia': 'ZM',
  'Tunisia': 'TN',
  'Algeria': 'DZ',
  'Mauritius': 'MU',
}

/**
 * Convert a country name to its ISO 3166-1 alpha-2 code.
 * Returns null if no mapping is found.
 */
export function countryNameToCode(countryName: string): string | null {
  // Try exact match first
  const direct = COUNTRY_NAME_TO_CODE[countryName]
  if (direct) return direct

  // Try case-insensitive match
  const lower = countryName.toLowerCase()
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (name.toLowerCase() === lower) return code
  }

  // If the input looks like it's already a 2-letter code, return it
  if (/^[A-Z]{2}$/i.test(countryName.trim())) {
    return countryName.trim().toUpperCase()
  }

  return null
}

/**
 * Fetch country data from REST Countries API.
 * Returns null on any error.
 */
export async function fetchCountryData(countryCode: string): Promise<CountryData | null> {
  const code = countryCode.toUpperCase()
  const url = `https://restcountries.com/v3.1/alpha/${code}?fields=flag,languages,currencies,capital,population,region,subregion,car,timezones,maps`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null

    const data = await res.json() as RestCountriesResponse

    // Extract languages
    const languages = data.languages
      ? Object.values(data.languages)
      : []

    // Extract primary currency
    let currency = { code: 'N/A', name: 'N/A', symbol: '' }
    if (data.currencies) {
      const currencyEntries = Object.entries(data.currencies)
      if (currencyEntries.length > 0) {
        const [currCode, currInfo] = currencyEntries[0]
        currency = {
          code: currCode,
          name: currInfo.name || 'N/A',
          symbol: currInfo.symbol || '',
        }
      }
    }

    return {
      flag: data.flag || '',
      languages,
      currency,
      capital: data.capital?.[0] || 'N/A',
      population: data.population || 0,
      region: data.region || 'N/A',
      subregion: data.subregion || 'N/A',
      drivingSide: data.car?.side || 'right',
      timezones: data.timezones || [],
      mapUrl: data.maps?.googleMaps || `https://www.google.com/maps/search/${encodeURIComponent(code)}`,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// REST Countries API response types (minimal)
interface RestCountriesResponse {
  flag: string
  languages: Record<string, string>
  currencies: Record<string, { name: string; symbol: string }>
  capital: string[]
  population: number
  region: string
  subregion: string
  car: { side: string }
  timezones: string[]
  maps: { googleMaps: string; openStreetMaps: string }
}
