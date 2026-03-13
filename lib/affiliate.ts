// ─── Affiliate & Booking Action Factory ───
// Central place for all affiliate programs and the BookingAction abstraction.
// Phase 1-2: Returns affiliate-redirect actions (open URL in new tab)
// Phase 3+:  Returns direct-book actions (Duffel orders.create) via feature flag
// Phase 4:   Returns managed-package actions (bundled mystery packages)

import type { FlightOffer, FlightSource } from '@/lib/flight-providers/types'

export type AffiliateProgram = 'aviasales' | 'agoda' | 'getyourguide' | 'klook' | 'kiwi' | 'wayaway' | 'jetradar'

// ─── Feature Flags ───
// Flip to true when each program/capability is approved
export const AFFILIATE_FLAGS = {
  agoda: false,
  getyourguide: false,
  klook: false,
  kiwi: false,
  wayaway: false,
  jetradar: false,
}

export const BOOKING_FLAGS = {
  /** Phase 2: Enable Duffel direct booking flow */
  duffelDirectBook: false,
  /** Phase 4: Enable managed mystery package purchases */
  managedPackages: false,
}

const MARKER = '708764'
const CAMPAIGN_ID = '100'
const TRS = '505363'
const SUB_ID = 'GlobePilots'

// ─── BookingAction Abstraction ───

export type BookingAction =
  | AffiliateRedirectAction
  | DirectBookAction
  | ManagedPackageAction

export interface AffiliateRedirectAction {
  type: 'affiliate-redirect'
  url: string
  provider: string
  /** Label for the CTA button */
  label: string
}

export interface DirectBookAction {
  type: 'direct-book'
  offerId: string
  provider: 'duffel'
  requiresPayment: true
  price: number
  currency: string
  label: string
}

export interface ManagedPackageAction {
  type: 'managed-package'
  packageId: string
  components: string[]  // ['flight', 'hotel', 'activity']
  price: number
  currency: string
  label: string
}

/**
 * Resolve the correct booking action for a FlightOffer.
 *
 * Decision tree:
 * 1. If source is 'duffel' + has offerId + duffelDirectBook flag → direct-book
 * 2. If source is 'kiwi' + kiwi affiliate flag → kiwi affiliate URL
 * 3. Default → Aviasales affiliate redirect
 *
 * The frontend renders different UIs per type:
 * - affiliate-redirect: opens URL in new tab ("Search Flights →")
 * - direct-book: shows payment form ("Book Now — $XXX")
 * - managed-package: shows bundle checkout ("Book Package — $XXX")
 */
export function resolveBookingAction(offer: FlightOffer): BookingAction {
  // Phase 2: Duffel direct booking
  if (
    BOOKING_FLAGS.duffelDirectBook &&
    offer.source === 'duffel' &&
    offer.offerId
  ) {
    return {
      type: 'direct-book',
      offerId: offer.offerId,
      provider: 'duffel',
      requiresPayment: true,
      price: offer.price,
      currency: offer.currency,
      label: `Book Now — $${offer.price}`,
    }
  }

  // Default: affiliate redirect
  return {
    type: 'affiliate-redirect',
    url: offer.bookingUrl,
    provider: offer.source,
    label: offer.confidence === 'live' ? 'Book Flight' : 'Search Flights',
  }
}

/**
 * Resolve booking action for a hotel.
 */
export function resolveHotelBookingAction(params: {
  cityName: string
  checkIn: string
  nights: number
}): BookingAction {
  return {
    type: 'affiliate-redirect',
    url: buildHotelLink(params.cityName, params.checkIn, params.nights),
    provider: 'agoda',
    label: 'Search Hotels',
  }
}

/**
 * Resolve booking action for activities.
 */
export function resolveActivityBookingAction(cityName: string): BookingAction {
  return {
    type: 'affiliate-redirect',
    url: buildActivitiesLink(cityName),
    provider: 'getyourguide',
    label: 'Find Activities',
  }
}

// ─── Deep Link Generators ───

export interface FlightParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
}

/**
 * Build affiliate flight link — routes to the correct affiliate network
 * based on the source provider and active affiliate flags.
 */
export function buildFlightLinkForSource(
  source: FlightSource | string,
  origin: string,
  dest: string,
  date: string,
  returnDate?: string
): string {
  // Kiwi affiliate
  if (source === 'kiwi' && AFFILIATE_FLAGS.kiwi) {
    return buildKiwiFlightLink(origin, dest, date)
  }
  // WayAway affiliate (if approved — offers cashback)
  if (AFFILIATE_FLAGS.wayaway && process.env.WAYAWAY_PARTNER_ID) {
    return buildWayAwayLink(origin, dest, date, returnDate)
  }
  // JetRadar affiliate (alternative to Aviasales, same parent company)
  if (AFFILIATE_FLAGS.jetradar && process.env.JETRADAR_MARKER) {
    return buildJetRadarLink(origin, dest, date, returnDate)
  }
  // Default: Aviasales via TravelPayouts
  return buildFlightLink(origin, dest, date, returnDate)
}

/**
 * Build Aviasales affiliate flight link (default)
 * date = YYYY-MM-DD, converts to DDMM internally
 */
export function buildFlightLink(origin: string, dest: string, date: string, returnDate?: string): string {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return day + month
  }

  const departFormatted = formatDate(date)
  const returnFormatted = returnDate ? formatDate(returnDate) : ''
  const searchPath = `${origin}${departFormatted}${dest}${returnFormatted}1`
  const aviasalesUrl = `https://www.aviasales.com/search/${searchPath}`

  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(aviasalesUrl)}`
}

/**
 * Build Agoda hotel deep link
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
 * Build WayAway affiliate link (cashback flight search)
 */
function buildWayAwayLink(origin: string, dest: string, date: string, returnDate?: string): string {
  const partnerId = process.env.WAYAWAY_PARTNER_ID || ''
  let url = `https://www.wayaway.io/flights/${origin}-${dest}/${date}`
  if (returnDate) url += `/${returnDate}`
  url += `?partner_id=${partnerId}`
  return url
}

/**
 * Build JetRadar affiliate link (alternative meta-search)
 */
function buildJetRadarLink(origin: string, dest: string, date: string, returnDate?: string): string {
  const marker = process.env.JETRADAR_MARKER || MARKER
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const searchPath = `${origin}${formatDate(date)}${dest}${returnDate ? formatDate(returnDate) : ''}1`
  return `https://www.jetradar.com/searches/new?marker=${marker}&origin_iata=${origin}&destination_iata=${dest}&depart_date=${date}${returnDate ? `&return_date=${returnDate}` : ''}&adults=1`
}

/**
 * Master booking bundle — returns all three links for a destination
 */
export function buildBookingBundle(params: {
  origin: string
  destination: string
  cityName: string
  departDate: string
  nights?: number
}): { flightUrl: string; hotelUrl: string; activitiesUrl: string } {
  const { origin, destination, cityName, departDate, nights = 3 } = params

  const flightUrl = AFFILIATE_FLAGS.kiwi
    ? buildKiwiFlightLink(origin, destination, departDate)
    : buildFlightLink(origin, destination, departDate)

  const hotelUrl = buildHotelLink(cityName, departDate, nights)
  const activitiesUrl = buildActivitiesLink(cityName)

  return { flightUrl, hotelUrl, activitiesUrl }
}

// ─── Legacy Compat ───
// These functions are used by existing code and must remain unchanged.

export function generateAffiliateLink(params: FlightParams): string {
  return buildFlightLink(params.origin, params.destination, params.departDate, params.returnDate)
}

export function generateCustomAffiliateLink(destinationUrl: string): string {
  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(destinationUrl)}`
}
