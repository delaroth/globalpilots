// Affiliate link generation factory
// Central place for all affiliate programs — flip flags when approved

export type AffiliateProgram = 'aviasales' | 'agoda' | 'getyourguide' | 'klook' | 'kiwi'

// Feature flags — flip to true when each program is approved
export const AFFILIATE_FLAGS = {
  agoda: false,
  getyourguide: false,
  klook: false,
  kiwi: false,
}

const MARKER = '708764'
const CAMPAIGN_ID = '100'
const TRS = '505363'
const SUB_ID = 'GlobePilots'

export interface FlightParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
}

/**
 * Build Aviasales affiliate flight link
 * date = YYYY-MM-DD, converts to DDMM internally
 */
export function buildFlightLink(origin: string, dest: string, date: string): string {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return day + month
  }

  const departFormatted = formatDate(date)
  const searchPath = `${origin}${departFormatted}${dest}1`
  const aviasalesUrl = `https://www.aviasales.com/search/${searchPath}`

  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(aviasalesUrl)}`
}

/**
 * Build Agoda hotel deep link
 * When AFFILIATE_FLAGS.agoda = true, appends &cid={AGODA_AFFILIATE_ID}
 * When false, returns plain Agoda search URL
 */
export function buildHotelLink(cityName: string, checkIn: string, nights: number = 3): string {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkInDate)
  checkOutDate.setDate(checkOutDate.getDate() + nights)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  let url = `https://www.agoda.com/search?city=${encodeURIComponent(cityName)}&checkIn=${formatDate(checkInDate)}&checkOut=${formatDate(checkOutDate)}&adults=1`

  if (AFFILIATE_FLAGS.agoda && process.env.AGODA_AFFILIATE_ID) {
    url += `&cid=${process.env.AGODA_AFFILIATE_ID}`
  }

  return url
}

/**
 * Build GetYourGuide activities deep link
 * When AFFILIATE_FLAGS.getyourguide = true, appends ?partner_id={GYG_PARTNER_ID}
 */
export function buildActivitiesLink(cityName: string): string {
  const slug = cityName.toLowerCase().replace(/\s+/g, '-')
  let url = `https://www.getyourguide.com/${slug}/`

  if (AFFILIATE_FLAGS.getyourguide && process.env.GETYOURGUIDE_PARTNER_ID) {
    url += `?partner_id=${process.env.GETYOURGUIDE_PARTNER_ID}`
  }

  return url
}

/**
 * Build Kiwi flight deep link
 * When AFFILIATE_FLAGS.kiwi = true, uses Kiwi search URL with affiliate params
 * When false, falls back to buildFlightLink() (Aviasales)
 */
export function buildKiwiFlightLink(origin: string, dest: string, date: string): string {
  if (AFFILIATE_FLAGS.kiwi && process.env.KIWI_API_KEY) {
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }
    return `https://www.kiwi.com/en/search/results/${origin}/${dest}/${formatDate(date)}`
  }
  return buildFlightLink(origin, dest, date)
}

/**
 * Master booking bundle — returns all three links for a destination
 */
export function buildBookingBundle(params: {
  origin: string
  destination: string  // IATA
  cityName: string
  departDate: string   // YYYY-MM-DD
  nights?: number      // default 3
}): { flightUrl: string; hotelUrl: string; activitiesUrl: string } {
  const { origin, destination, cityName, departDate, nights = 3 } = params

  const flightUrl = AFFILIATE_FLAGS.kiwi
    ? buildKiwiFlightLink(origin, destination, departDate)
    : buildFlightLink(origin, destination, departDate)

  const hotelUrl = buildHotelLink(cityName, departDate, nights)
  const activitiesUrl = buildActivitiesLink(cityName)

  return { flightUrl, hotelUrl, activitiesUrl }
}

// Legacy compat — used by search page and other existing code
export function generateAffiliateLink(params: FlightParams): string {
  return buildFlightLink(params.origin, params.destination, params.departDate)
}

export function generateCustomAffiliateLink(destinationUrl: string): string {
  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(destinationUrl)}`
}
