// ─── Core Flight Provider Types ───
// All new fields are OPTIONAL to maintain backward compatibility.
// Existing providers continue to work unchanged.

export type FlightSource = 'kiwi' | 'travelpayouts' | 'duffel' | 'flightapi'

export type PriceConfidence = 'live' | 'cached' | 'estimated'

export interface FlightSearchParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  adults?: number
  maxResults?: number
}

export interface FlightSegment {
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  airline: string
  flightNumber?: string
  duration?: string
  source: FlightSource
  bookingUrl: string
  /** Aircraft type, e.g. "Boeing 787-9" — populated by AeroDataBox enrichment */
  aircraft?: string
  /** Operating airline if different from marketing airline */
  operatingAirline?: string
}

export interface FareDetails {
  class?: string           // economy, premium_economy, business, first
  baggageKg?: number       // Checked bag allowance in kg
  cabinBagKg?: number      // Cabin bag allowance in kg
  refundable?: boolean
  changeable?: boolean
  carrierBookingCode?: string
  fareFamily?: string      // e.g. "Economy Light", "Economy Classic"
}

export interface FlightOffer {
  price: number
  currency: string
  airlines: string[]
  stops: number
  departureTime: string
  arrivalTime: string
  duration?: string
  bookingUrl: string
  source: FlightSource
  /** @deprecated Use `confidence` instead. Kept for backward compat. */
  isLive: boolean

  // ─── Phase 2+ Fields (all optional) ───

  /** Provider's bookable offer reference (Duffel offer ID, Amadeus dictId, etc.) */
  offerId?: string
  /** When this price expires — live offers go stale in 10-30 min */
  expiresAt?: string
  /** Three-tier confidence: live (bookable now), cached (recent), estimated (rough guess) */
  confidence?: PriceConfidence
  /** When this data was fetched from the provider */
  fetchedAt?: number
  /** Individual flight segments for multi-leg / self-transfer itineraries */
  segments?: FlightSegment[]
  /** Fare class, baggage, refund policy from providers that supply it */
  fareDetails?: FareDetails
  /** Unique hash for deduplication — set by the intelligence layer */
  offerHash?: string
  /** Physical flight hash — identifies same metal tube across providers */
  flightHash?: string
}

export interface CheapestDestination {
  destination: string
  city: string
  country?: string
  price: number
  departDate: string
  returnDate?: string
  source: string
  confidence?: PriceConfidence
  fetchedAt?: number
}

export interface FlightProvider {
  name: string
  isAvailable(): Promise<boolean>
  searchFlights(params: FlightSearchParams): Promise<FlightOffer[]>
  searchCheapest?(params: { origin: string; departDate: string; returnDate?: string; limit?: number }): Promise<CheapestDestination[]>
}
