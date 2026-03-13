// ─── Trip & Package Data Model ───
// Treats every trip as a collection of segments (flight, hotel, activity, transport).
// Today: stores segment metadata + affiliate links.
// Phase 4: each segment becomes a bookable service ID with provider references.

export type SegmentType = 'flight' | 'hotel' | 'activity' | 'transport'
export type SegmentStatus = 'planned' | 'booked' | 'confirmed' | 'cancelled'
export type TripStatus = 'draft' | 'planned' | 'quoted' | 'booked' | 'completed' | 'cancelled'
export type TripType = 'mystery' | 'multi-city' | 'layover' | 'search' | 'custom'

export interface TripSegment {
  id: string
  type: SegmentType
  sequenceOrder: number
  provider?: string          // 'kiwi', 'duffel', 'agoda', 'getyourguide', etc.
  providerRef?: string       // External booking reference / offer ID
  status: SegmentStatus
  price: number
  currency: string
  bookingUrl?: string        // Affiliate link (Phase 1-2) or managed booking URL (Phase 4)

  // ─── Flexible Details (varies by segment type) ───
  details: FlightSegmentDetails | HotelSegmentDetails | ActivitySegmentDetails | TransportSegmentDetails
}

export interface FlightSegmentDetails {
  type: 'flight'
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  airlines: string[]
  flightNumbers?: string[]
  stops: number
  duration?: string
  fareClass?: string
  baggageKg?: number
  isSelfTransfer?: boolean
}

export interface HotelSegmentDetails {
  type: 'hotel'
  city: string
  hotelName?: string
  checkIn: string
  checkOut: string
  nights: number
  pricePerNight: number
  starRating?: number
  neighborhood?: string
}

export interface ActivitySegmentDetails {
  type: 'activity'
  city: string
  name: string
  date: string
  duration?: string
  description?: string
}

export interface TransportSegmentDetails {
  type: 'transport'
  from: string
  to: string
  method: string            // 'taxi', 'train', 'bus', 'ferry', etc.
  estimatedDuration?: string
  estimatedCost: number
}

export interface Trip {
  id: string
  userId?: string
  tripType: TripType
  status: TripStatus
  title: string
  origin: string
  segments: TripSegment[]
  totalPrice: number
  currency: string
  createdAt: string
  updatedAt: string

  // ─── Mystery Package Fields (Phase 4) ───
  /** For mystery trips: what the user can see so far */
  revealStage?: number       // 0=nothing, 1=country, 2=city, 3=full
  /** AI reasoning / description for the trip */
  description?: string
}

/**
 * Build a Trip from mystery vacation results.
 * Converts the flat AI response into the segments model.
 */
export function buildMysteryTrip(params: {
  origin: string
  destination: string
  destinationCity: string
  country: string
  departDate: string
  nights: number
  flightPrice: number
  hotelPerNight: number
  hotelName?: string
  flightBookingUrl: string
  hotelBookingUrl?: string
  activitiesUrl?: string
  itinerary?: { day: number; activities: string[] }[]
  description?: string
}): Trip {
  const now = new Date().toISOString()
  const segments: TripSegment[] = []
  let seq = 0

  // Flight segment
  segments.push({
    id: `seg-${Date.now()}-${seq}`,
    type: 'flight',
    sequenceOrder: seq++,
    status: 'planned',
    price: params.flightPrice,
    currency: 'USD',
    bookingUrl: params.flightBookingUrl,
    details: {
      type: 'flight',
      origin: params.origin,
      destination: params.destination,
      departureTime: params.departDate,
      arrivalTime: '',
      airlines: [],
      stops: 0,
    },
  })

  // Hotel segment
  if (params.hotelPerNight > 0) {
    segments.push({
      id: `seg-${Date.now()}-${seq}`,
      type: 'hotel',
      sequenceOrder: seq++,
      status: 'planned',
      price: params.hotelPerNight * params.nights,
      currency: 'USD',
      bookingUrl: params.hotelBookingUrl,
      details: {
        type: 'hotel',
        city: params.destinationCity,
        hotelName: params.hotelName,
        checkIn: params.departDate,
        checkOut: addDays(params.departDate, params.nights),
        nights: params.nights,
        pricePerNight: params.hotelPerNight,
      },
    })
  }

  // Activity segments from itinerary
  if (params.itinerary) {
    for (const day of params.itinerary) {
      for (const activity of day.activities) {
        segments.push({
          id: `seg-${Date.now()}-${seq}`,
          type: 'activity',
          sequenceOrder: seq++,
          status: 'planned',
          price: 0, // Estimated in Phase 4
          currency: 'USD',
          bookingUrl: params.activitiesUrl,
          details: {
            type: 'activity',
            city: params.destinationCity,
            name: activity,
            date: addDays(params.departDate, day.day - 1),
          },
        })
      }
    }
  }

  return {
    id: `trip-${Date.now()}`,
    tripType: 'mystery',
    status: 'planned',
    title: `Mystery Trip to ${params.destinationCity}, ${params.country}`,
    origin: params.origin,
    segments,
    totalPrice: segments.reduce((sum, s) => sum + s.price, 0),
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    revealStage: 3,
    description: params.description,
  }
}

/**
 * Build a Trip from multi-city planner results.
 */
export function buildMultiCityTrip(params: {
  origin: string
  cities: { code: string; name: string; country: string; days: number; flightCost: number; dailyCost: number }[]
  bookingLinks: { from: string; to: string; url: string }[]
  totalCost: number
  reasoning?: string
}): Trip {
  const now = new Date().toISOString()
  const segments: TripSegment[] = []
  let seq = 0

  for (let i = 0; i < params.cities.length; i++) {
    const city = params.cities[i]
    const bookingLink = params.bookingLinks[i]

    // Flight to this city
    segments.push({
      id: `seg-${Date.now()}-${seq}`,
      type: 'flight',
      sequenceOrder: seq++,
      status: 'planned',
      price: city.flightCost,
      currency: 'USD',
      bookingUrl: bookingLink?.url,
      details: {
        type: 'flight',
        origin: i === 0 ? params.origin : params.cities[i - 1].code,
        destination: city.code,
        departureTime: '',
        arrivalTime: '',
        airlines: [],
        stops: 0,
      },
    })

    // Hotel in this city
    segments.push({
      id: `seg-${Date.now()}-${seq}`,
      type: 'hotel',
      sequenceOrder: seq++,
      status: 'planned',
      price: city.dailyCost * city.days,
      currency: 'USD',
      details: {
        type: 'hotel',
        city: city.name,
        checkIn: '',
        checkOut: '',
        nights: city.days,
        pricePerNight: city.dailyCost,
      },
    })
  }

  // Return flight
  const lastCity = params.cities[params.cities.length - 1]
  const returnLink = params.bookingLinks[params.bookingLinks.length - 1]
  segments.push({
    id: `seg-${Date.now()}-${seq}`,
    type: 'flight',
    sequenceOrder: seq++,
    status: 'planned',
    price: 0,
    currency: 'USD',
    bookingUrl: returnLink?.url,
    details: {
      type: 'flight',
      origin: lastCity.code,
      destination: params.origin,
      departureTime: '',
      arrivalTime: '',
      airlines: [],
      stops: 0,
    },
  })

  return {
    id: `trip-${Date.now()}`,
    tripType: 'multi-city',
    status: 'planned',
    title: `${params.cities.map(c => c.name).join(' → ')}`,
    origin: params.origin,
    segments,
    totalPrice: params.totalCost,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    description: params.reasoning,
  }
}

/**
 * Build a Trip from a layover/stopover arbitrage result.
 */
export function buildLayoverTrip(params: {
  origin: string
  hub: string
  hubCity: string
  destination: string
  leg1Price: number
  leg2Price: number
  leg1Url: string
  leg2Url: string
  isSelfTransfer: boolean
}): Trip {
  const now = new Date().toISOString()

  return {
    id: `trip-${Date.now()}`,
    tripType: 'layover',
    status: 'planned',
    title: `${params.origin} → ${params.hub} → ${params.destination}`,
    origin: params.origin,
    segments: [
      {
        id: `seg-${Date.now()}-0`,
        type: 'flight',
        sequenceOrder: 0,
        status: 'planned',
        price: params.leg1Price,
        currency: 'USD',
        bookingUrl: params.leg1Url,
        details: {
          type: 'flight',
          origin: params.origin,
          destination: params.hub,
          departureTime: '',
          arrivalTime: '',
          airlines: [],
          stops: 0,
          isSelfTransfer: params.isSelfTransfer,
        },
      },
      {
        id: `seg-${Date.now()}-1`,
        type: 'flight',
        sequenceOrder: 1,
        status: 'planned',
        price: params.leg2Price,
        currency: 'USD',
        bookingUrl: params.leg2Url,
        details: {
          type: 'flight',
          origin: params.hub,
          destination: params.destination,
          departureTime: '',
          arrivalTime: '',
          airlines: [],
          stops: 0,
          isSelfTransfer: params.isSelfTransfer,
        },
      },
    ],
    totalPrice: params.leg1Price + params.leg2Price,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Utility ───
function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  } catch {
    return dateStr
  }
}
