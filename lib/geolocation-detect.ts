/**
 * Timezone-based geolocation detection.
 * Maps 80+ timezones to nearest major airport, country, and currency.
 * No external API calls — uses Intl.DateTimeFormat for timezone detection.
 */

interface TimezoneMapping {
  airport: string
  city: string
  country: string
  currency: string
}

const TIMEZONE_MAP: Record<string, TimezoneMapping> = {
  // ── North America ──
  'America/New_York':       { airport: 'JFK', city: 'New York', country: 'US', currency: 'USD' },
  'America/Chicago':        { airport: 'ORD', city: 'Chicago', country: 'US', currency: 'USD' },
  'America/Denver':         { airport: 'DEN', city: 'Denver', country: 'US', currency: 'USD' },
  'America/Los_Angeles':    { airport: 'LAX', city: 'Los Angeles', country: 'US', currency: 'USD' },
  'America/Phoenix':        { airport: 'PHX', city: 'Phoenix', country: 'US', currency: 'USD' },
  'America/Anchorage':      { airport: 'ANC', city: 'Anchorage', country: 'US', currency: 'USD' },
  'Pacific/Honolulu':       { airport: 'HNL', city: 'Honolulu', country: 'US', currency: 'USD' },
  'America/Detroit':        { airport: 'DTW', city: 'Detroit', country: 'US', currency: 'USD' },
  'America/Indiana/Indianapolis': { airport: 'IND', city: 'Indianapolis', country: 'US', currency: 'USD' },
  'America/Boise':          { airport: 'BOI', city: 'Boise', country: 'US', currency: 'USD' },
  'America/Toronto':        { airport: 'YYZ', city: 'Toronto', country: 'CA', currency: 'CAD' },
  'America/Vancouver':      { airport: 'YVR', city: 'Vancouver', country: 'CA', currency: 'CAD' },
  'America/Edmonton':       { airport: 'YEG', city: 'Edmonton', country: 'CA', currency: 'CAD' },
  'America/Winnipeg':       { airport: 'YWG', city: 'Winnipeg', country: 'CA', currency: 'CAD' },
  'America/Halifax':        { airport: 'YHZ', city: 'Halifax', country: 'CA', currency: 'CAD' },
  'America/St_Johns':       { airport: 'YYT', city: "St. John's", country: 'CA', currency: 'CAD' },
  'America/Montreal':       { airport: 'YUL', city: 'Montreal', country: 'CA', currency: 'CAD' },
  'America/Mexico_City':    { airport: 'MEX', city: 'Mexico City', country: 'MX', currency: 'MXN' },
  'America/Cancun':         { airport: 'CUN', city: 'Cancun', country: 'MX', currency: 'MXN' },
  'America/Tijuana':        { airport: 'TIJ', city: 'Tijuana', country: 'MX', currency: 'MXN' },

  // ── Central & South America ──
  'America/Bogota':         { airport: 'BOG', city: 'Bogota', country: 'CO', currency: 'COP' },
  'America/Lima':           { airport: 'LIM', city: 'Lima', country: 'PE', currency: 'PEN' },
  'America/Santiago':       { airport: 'SCL', city: 'Santiago', country: 'CL', currency: 'CLP' },
  'America/Buenos_Aires':   { airport: 'EZE', city: 'Buenos Aires', country: 'AR', currency: 'ARS' },
  'America/Sao_Paulo':      { airport: 'GRU', city: 'Sao Paulo', country: 'BR', currency: 'BRL' },
  'America/Costa_Rica':     { airport: 'SJO', city: 'San Jose', country: 'CR', currency: 'CRC' },
  'America/Panama':         { airport: 'PTY', city: 'Panama City', country: 'PA', currency: 'USD' },
  'America/Guayaquil':      { airport: 'GYE', city: 'Guayaquil', country: 'EC', currency: 'USD' },
  'America/Caracas':        { airport: 'CCS', city: 'Caracas', country: 'VE', currency: 'VES' },

  // ── Europe ──
  'Europe/London':          { airport: 'LHR', city: 'London', country: 'GB', currency: 'GBP' },
  'Europe/Paris':           { airport: 'CDG', city: 'Paris', country: 'FR', currency: 'EUR' },
  'Europe/Berlin':          { airport: 'BER', city: 'Berlin', country: 'DE', currency: 'EUR' },
  'Europe/Madrid':          { airport: 'MAD', city: 'Madrid', country: 'ES', currency: 'EUR' },
  'Europe/Rome':            { airport: 'FCO', city: 'Rome', country: 'IT', currency: 'EUR' },
  'Europe/Amsterdam':       { airport: 'AMS', city: 'Amsterdam', country: 'NL', currency: 'EUR' },
  'Europe/Brussels':        { airport: 'BRU', city: 'Brussels', country: 'BE', currency: 'EUR' },
  'Europe/Zurich':          { airport: 'ZRH', city: 'Zurich', country: 'CH', currency: 'CHF' },
  'Europe/Vienna':          { airport: 'VIE', city: 'Vienna', country: 'AT', currency: 'EUR' },
  'Europe/Warsaw':          { airport: 'WAW', city: 'Warsaw', country: 'PL', currency: 'PLN' },
  'Europe/Prague':          { airport: 'PRG', city: 'Prague', country: 'CZ', currency: 'CZK' },
  'Europe/Budapest':        { airport: 'BUD', city: 'Budapest', country: 'HU', currency: 'HUF' },
  'Europe/Bucharest':       { airport: 'OTP', city: 'Bucharest', country: 'RO', currency: 'RON' },
  'Europe/Athens':          { airport: 'ATH', city: 'Athens', country: 'GR', currency: 'EUR' },
  'Europe/Istanbul':        { airport: 'IST', city: 'Istanbul', country: 'TR', currency: 'TRY' },
  'Europe/Moscow':          { airport: 'SVO', city: 'Moscow', country: 'RU', currency: 'RUB' },
  'Europe/Stockholm':       { airport: 'ARN', city: 'Stockholm', country: 'SE', currency: 'SEK' },
  'Europe/Helsinki':        { airport: 'HEL', city: 'Helsinki', country: 'FI', currency: 'EUR' },
  'Europe/Oslo':            { airport: 'OSL', city: 'Oslo', country: 'NO', currency: 'NOK' },
  'Europe/Copenhagen':      { airport: 'CPH', city: 'Copenhagen', country: 'DK', currency: 'DKK' },
  'Europe/Dublin':          { airport: 'DUB', city: 'Dublin', country: 'IE', currency: 'EUR' },
  'Europe/Lisbon':          { airport: 'LIS', city: 'Lisbon', country: 'PT', currency: 'EUR' },
  'Europe/Kiev':            { airport: 'KBP', city: 'Kyiv', country: 'UA', currency: 'UAH' },
  'Europe/Belgrade':        { airport: 'BEG', city: 'Belgrade', country: 'RS', currency: 'RSD' },
  'Europe/Zagreb':          { airport: 'ZAG', city: 'Zagreb', country: 'HR', currency: 'EUR' },
  'Europe/Sofia':           { airport: 'SOF', city: 'Sofia', country: 'BG', currency: 'BGN' },

  // ── Asia ──
  'Asia/Bangkok':           { airport: 'BKK', city: 'Bangkok', country: 'TH', currency: 'THB' },
  'Asia/Singapore':         { airport: 'SIN', city: 'Singapore', country: 'SG', currency: 'SGD' },
  'Asia/Tokyo':             { airport: 'NRT', city: 'Tokyo', country: 'JP', currency: 'JPY' },
  'Asia/Seoul':             { airport: 'ICN', city: 'Seoul', country: 'KR', currency: 'KRW' },
  'Asia/Shanghai':          { airport: 'PVG', city: 'Shanghai', country: 'CN', currency: 'CNY' },
  'Asia/Hong_Kong':         { airport: 'HKG', city: 'Hong Kong', country: 'HK', currency: 'HKD' },
  'Asia/Taipei':            { airport: 'TPE', city: 'Taipei', country: 'TW', currency: 'TWD' },
  'Asia/Manila':            { airport: 'MNL', city: 'Manila', country: 'PH', currency: 'PHP' },
  'Asia/Jakarta':           { airport: 'CGK', city: 'Jakarta', country: 'ID', currency: 'IDR' },
  'Asia/Kuala_Lumpur':      { airport: 'KUL', city: 'Kuala Lumpur', country: 'MY', currency: 'MYR' },
  'Asia/Ho_Chi_Minh':       { airport: 'SGN', city: 'Ho Chi Minh', country: 'VN', currency: 'VND' },
  'Asia/Kolkata':           { airport: 'DEL', city: 'Delhi', country: 'IN', currency: 'INR' },
  'Asia/Colombo':           { airport: 'CMB', city: 'Colombo', country: 'LK', currency: 'LKR' },
  'Asia/Dhaka':             { airport: 'DAC', city: 'Dhaka', country: 'BD', currency: 'BDT' },
  'Asia/Karachi':           { airport: 'KHI', city: 'Karachi', country: 'PK', currency: 'PKR' },
  'Asia/Dubai':             { airport: 'DXB', city: 'Dubai', country: 'AE', currency: 'AED' },
  'Asia/Riyadh':            { airport: 'RUH', city: 'Riyadh', country: 'SA', currency: 'SAR' },
  'Asia/Qatar':             { airport: 'DOH', city: 'Doha', country: 'QA', currency: 'QAR' },
  'Asia/Muscat':            { airport: 'MCT', city: 'Muscat', country: 'OM', currency: 'OMR' },
  'Asia/Tehran':            { airport: 'IKA', city: 'Tehran', country: 'IR', currency: 'IRR' },
  'Asia/Baghdad':           { airport: 'BGW', city: 'Baghdad', country: 'IQ', currency: 'IQD' },
  'Asia/Beirut':            { airport: 'BEY', city: 'Beirut', country: 'LB', currency: 'LBP' },
  'Asia/Jerusalem':         { airport: 'TLV', city: 'Tel Aviv', country: 'IL', currency: 'ILS' },
  'Asia/Almaty':            { airport: 'ALA', city: 'Almaty', country: 'KZ', currency: 'KZT' },
  'Asia/Tashkent':          { airport: 'TAS', city: 'Tashkent', country: 'UZ', currency: 'UZS' },
  'Asia/Yangon':            { airport: 'RGN', city: 'Yangon', country: 'MM', currency: 'MMK' },
  'Asia/Phnom_Penh':        { airport: 'PNH', city: 'Phnom Penh', country: 'KH', currency: 'KHR' },
  'Asia/Vientiane':         { airport: 'VTE', city: 'Vientiane', country: 'LA', currency: 'LAK' },
  'Asia/Kathmandu':         { airport: 'KTM', city: 'Kathmandu', country: 'NP', currency: 'NPR' },

  // ── Africa ──
  'Africa/Cairo':           { airport: 'CAI', city: 'Cairo', country: 'EG', currency: 'EGP' },
  'Africa/Johannesburg':    { airport: 'JNB', city: 'Johannesburg', country: 'ZA', currency: 'ZAR' },
  'Africa/Lagos':           { airport: 'LOS', city: 'Lagos', country: 'NG', currency: 'NGN' },
  'Africa/Nairobi':         { airport: 'NBO', city: 'Nairobi', country: 'KE', currency: 'KES' },
  'Africa/Casablanca':      { airport: 'CMN', city: 'Casablanca', country: 'MA', currency: 'MAD' },
  'Africa/Addis_Ababa':     { airport: 'ADD', city: 'Addis Ababa', country: 'ET', currency: 'ETB' },
  'Africa/Accra':           { airport: 'ACC', city: 'Accra', country: 'GH', currency: 'GHS' },
  'Africa/Dar_es_Salaam':   { airport: 'DAR', city: 'Dar es Salaam', country: 'TZ', currency: 'TZS' },
  'Africa/Tunis':           { airport: 'TUN', city: 'Tunis', country: 'TN', currency: 'TND' },

  // ── Oceania ──
  'Australia/Sydney':       { airport: 'SYD', city: 'Sydney', country: 'AU', currency: 'AUD' },
  'Australia/Melbourne':    { airport: 'MEL', city: 'Melbourne', country: 'AU', currency: 'AUD' },
  'Australia/Perth':        { airport: 'PER', city: 'Perth', country: 'AU', currency: 'AUD' },
  'Australia/Brisbane':     { airport: 'BNE', city: 'Brisbane', country: 'AU', currency: 'AUD' },
  'Australia/Adelaide':     { airport: 'ADL', city: 'Adelaide', country: 'AU', currency: 'AUD' },
  'Pacific/Auckland':       { airport: 'AKL', city: 'Auckland', country: 'NZ', currency: 'NZD' },
  'Pacific/Fiji':           { airport: 'NAN', city: 'Nadi', country: 'FJ', currency: 'FJD' },
}

/**
 * Detect user's timezone using Intl API.
 * Returns IANA timezone string (e.g., "Asia/Bangkok").
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/New_York' // safe fallback
  }
}

/**
 * Get full mapping for a timezone. Returns null if timezone is unknown.
 */
function getMapping(timezone: string): TimezoneMapping | null {
  // Direct match
  if (TIMEZONE_MAP[timezone]) return TIMEZONE_MAP[timezone]

  // Try matching by region prefix (e.g., "America/Kentucky/Louisville" -> "America/New_York")
  const parts = timezone.split('/')
  if (parts.length >= 2) {
    const region = parts[0]
    // Find first entry in same region as fallback
    for (const [tz, mapping] of Object.entries(TIMEZONE_MAP)) {
      if (tz.startsWith(region + '/')) return mapping
    }
  }

  return null
}

/**
 * Guess nearest major airport from user's timezone.
 */
export function guessAirportFromTimezone(timezone?: string): { code: string; city: string } | null {
  const tz = timezone || detectUserTimezone()
  const mapping = getMapping(tz)
  return mapping ? { code: mapping.airport, city: mapping.city } : null
}

/**
 * Guess user's country code from timezone.
 */
export function guessCountryFromTimezone(timezone?: string): string | null {
  const tz = timezone || detectUserTimezone()
  const mapping = getMapping(tz)
  return mapping?.country || null
}

/**
 * Guess user's likely currency from timezone.
 */
export function guessCurrencyFromTimezone(timezone?: string): string | null {
  const tz = timezone || detectUserTimezone()
  const mapping = getMapping(tz)
  return mapping?.currency || null
}
