// ─── Affiliate & Booking Action Factory ───
// Central place for all affiliate programs and the BookingAction abstraction.
// Phase 1-2: Returns affiliate-redirect actions (open URL in new tab)
// Phase 3+:  Returns direct-book actions (Duffel orders.create) via feature flag
// Phase 4:   Returns managed-package actions (bundled mystery packages)

import type { FlightOffer, FlightSource } from '@/lib/flight-providers/types'
import { STEALTH_MODE, canEarnCommissions, canProcessPayments, logStealthBlock } from '@/lib/stealth'

export type AffiliateProgram = 'aviasales' | 'agoda' | 'getyourguide' | 'klook' | 'kiwi' | 'wayaway' | 'jetradar'

// ─── Feature Flags ───
// Flip to true when each program/capability is approved.
// In STEALTH_MODE, affiliate flags are force-disabled regardless of these values.
export const AFFILIATE_FLAGS = {
  agoda: false,
  getyourguide: false,
  klook: false,
  kiwi: false,
  wayaway: false,
  jetradar: false,
}

export const BOOKING_FLAGS = {
  /** Phase 2: Enable Duffel direct booking flow (blocked in stealth mode) */
  duffelDirectBook: false,
  /** Phase 4: Enable managed mystery package purchases (blocked in stealth mode) */
  managedPackages: false,
}

/**
 * Check if a given affiliate flag is truly active.
 * In stealth mode: ALL affiliate flags return false — no commissions earned.
 */
function isAffiliateActive(flag: keyof typeof AFFILIATE_FLAGS): boolean {
  if (!canEarnCommissions()) return false
  return AFFILIATE_FLAGS[flag]
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

/** Returned in stealth mode instead of real booking/affiliate actions */
export interface SandboxAction {
  type: 'sandbox-demo'
  intendedAction: 'affiliate-redirect' | 'direct-book' | 'managed-package'
  intendedUrl?: string
  provider: string
  label: string
  message: string
}

export type SafeBookingAction = BookingAction | SandboxAction

/**
 * Resolve the correct booking action for a FlightOffer.
 *
 * STEALTH MODE GUARD:
 * When STEALTH_MODE is active, ALL actions are intercepted:
 * - direct-book → sandbox-demo (no real payments)
 * - affiliate-redirect → sandbox-demo (no real commissions)
 * The intended action is logged and preserved in intendedAction/intendedUrl
 * so the Bulgaria migration just requires flipping the env var.
 *
 * LIVE MODE decision tree:
 * 1. If source is 'duffel' + has offerId + duffelDirectBook flag → direct-book
 * 2. Default → affiliate redirect via appropriate network
 *
 * The frontend renders different UIs per type:
 * - affiliate-redirect: opens URL in new tab ("Search Flights →")
 * - direct-book: shows payment form ("Book Now — $XXX")
 * - managed-package: shows bundle checkout ("Book Package — $XXX")
 * - sandbox-demo: shows DemoBookingModal with sandbox warning
 */
export function resolveBookingAction(offer: FlightOffer): SafeBookingAction {
  // ─── STEALTH MODE: Intercept ALL booking actions ───
  if (STEALTH_MODE) {
    // Determine what the action WOULD be in live mode
    const wouldBeDirect = BOOKING_FLAGS.duffelDirectBook && offer.source === 'duffel' && offer.offerId

    if (wouldBeDirect) {
      logStealthBlock('direct-book', `Duffel offer ${offer.offerId} — $${offer.price}`)
      return {
        type: 'sandbox-demo',
        intendedAction: 'direct-book',
        provider: 'duffel',
        label: 'Booking Preview (Demo)',
        message: 'This is a development preview. Real booking via Duffel is disabled in Sandbox Mode.',
      }
    }

    // Affiliate redirect — neutralize the tracking
    logStealthBlock('affiliate-redirect', `${offer.source} → ${offer.bookingUrl?.slice(0, 60)}...`)
    return {
      type: 'sandbox-demo',
      intendedAction: 'affiliate-redirect',
      intendedUrl: offer.bookingUrl,
      provider: offer.source,
      label: 'Search Flights (Demo)',
      message: 'Live affiliate links are disabled in this build. This is a development preview.',
    }
  }

  // ─── LIVE MODE: Real booking actions ───

  // Phase 2: Duffel direct booking
  if (
    BOOKING_FLAGS.duffelDirectBook &&
    canProcessPayments() &&
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
}): SafeBookingAction {
  if (STEALTH_MODE) {
    logStealthBlock('hotel-affiliate', `${params.cityName} ${params.nights}n`)
    return {
      type: 'sandbox-demo',
      intendedAction: 'affiliate-redirect',
      intendedUrl: buildHotelLink(params.cityName, params.checkIn, params.nights),
      provider: 'agoda',
      label: 'Search Hotels (Demo)',
      message: 'Live hotel affiliate links are disabled in this build.',
    }
  }
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
export function resolveActivityBookingAction(cityName: string): SafeBookingAction {
  if (STEALTH_MODE) {
    logStealthBlock('activity-affiliate', cityName)
    return {
      type: 'sandbox-demo',
      intendedAction: 'affiliate-redirect',
      intendedUrl: buildActivitiesLink(cityName),
      provider: 'getyourguide',
      label: 'Find Activities (Demo)',
      message: 'Live activity affiliate links are disabled in this build.',
    }
  }
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
  // Google Flights (from SerpApi live search)
  if (source === 'google-flights' || source === 'serpapi') {
    const retParam = returnDate ? `+returning+${returnDate}` : ''
    return `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest}+on+${date}${retParam}`
  }
  // Kiwi affiliate
  if (source === 'kiwi' && isAffiliateActive('kiwi')) {
    return buildKiwiFlightLink(origin, dest, date)
  }
  // WayAway affiliate (if approved — offers cashback)
  if (isAffiliateActive('wayaway') && process.env.WAYAWAY_PARTNER_ID) {
    return buildWayAwayLink(origin, dest, date, returnDate)
  }
  // JetRadar affiliate (alternative to Aviasales, same parent company)
  if (isAffiliateActive('jetradar') && process.env.JETRADAR_MARKER) {
    return buildJetRadarLink(origin, dest, date, returnDate)
  }
  // Default: Aviasales via TravelPayouts
  return buildFlightLink(origin, dest, date, returnDate)
}

/**
 * Build Aviasales affiliate flight link (default)
 * date = YYYY-MM-DD, converts to DDMM internally
 *
 * STEALTH MODE: Returns the raw Aviasales search URL without tp.media
 * affiliate wrapping — no tracking, no commissions, just the search page.
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

  // Stealth mode: return raw search URL — no affiliate wrapper
  if (!canEarnCommissions()) {
    return aviasalesUrl
  }

  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(aviasalesUrl)}`
}

/**
 * Build Agoda hotel deep link
 * STEALTH: No affiliate cid appended — clean search URL only
 *
 * Optional budget constraints align the hotel search with the Side Quest
 * value calculation — e.g. if our netValue math assumes $50/night,
 * the link pre-filters to hotels under $50.
 */
export function buildHotelLink(
  cityName: string,
  checkIn: string,
  nights: number = 3,
  options?: {
    maxPricePerNight?: number   // From destination-costs or Side Quest calculator
    sortByPrice?: boolean       // Show cheapest first
    country?: string            // Appended to search text for better Agoda city resolution
  }
): string {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkInDate)
  checkOutDate.setDate(checkOutDate.getDate() + nights)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  // Use Booking.com — works with city names in URL (Agoda requires numeric IDs)
  const searchText = options?.country
    ? `${cityName}, ${options.country}`
    : cityName

  let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchText)}&checkin=${formatDate(checkInDate)}&checkout=${formatDate(checkOutDate)}&group_adults=1&no_rooms=1`

  // Budget constraints
  if (options?.maxPricePerNight) {
    url += `&nflt=price%3DUSD-min-${options.maxPricePerNight}-1`
  }
  if (options?.sortByPrice) {
    url += `&order=price`
  }

  return url
}

/**
 * Build GetYourGuide activities deep link
 * STEALTH: No partner_id appended — clean search URL only
 */
export function buildActivitiesLink(cityName: string): string {
  let url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(cityName)}&searchSource=1`

  // Only append affiliate tracking when commissions are allowed
  if (isAffiliateActive('getyourguide') && process.env.GETYOURGUIDE_PARTNER_ID) {
    url += `&partner_id=${process.env.GETYOURGUIDE_PARTNER_ID}`
  }

  return url
}

/**
 * Build Kiwi flight deep link
 * STEALTH: Falls back to raw Aviasales search (no affiliate wrapper)
 */
export function buildKiwiFlightLink(origin: string, dest: string, date: string): string {
  if (isAffiliateActive('kiwi') && process.env.KIWI_API_KEY) {
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
  maxHotelPerNight?: number
  country?: string
}): { flightUrl: string; hotelUrl: string; activitiesUrl: string } {
  const { origin, destination, cityName, departDate, nights = 3, maxHotelPerNight, country } = params

  // Calculate return date from depart + nights
  const returnDate = (() => {
    const d = new Date(departDate + 'T00:00:00')
    d.setDate(d.getDate() + nights)
    return d.toISOString().split('T')[0]
  })()

  const flightUrl = isAffiliateActive('kiwi')
    ? buildKiwiFlightLink(origin, destination, departDate)
    : buildFlightLink(origin, destination, departDate, returnDate)

  const hotelUrl = buildHotelLink(cityName, departDate, nights, {
    maxPricePerNight: maxHotelPerNight,
    sortByPrice: !!maxHotelPerNight,
    country,
  })
  const activitiesUrl = buildActivitiesLink(cityName)

  return { flightUrl, hotelUrl, activitiesUrl }
}

// ─── Legacy Compat ───
// These functions are used by existing code and must remain unchanged.

export function generateAffiliateLink(params: FlightParams): string {
  return buildFlightLink(params.origin, params.destination, params.departDate, params.returnDate)
}

export function generateCustomAffiliateLink(destinationUrl: string): string {
  // Stealth: return the raw URL without affiliate wrapping
  if (!canEarnCommissions()) {
    return destinationUrl
  }
  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(destinationUrl)}`
}
