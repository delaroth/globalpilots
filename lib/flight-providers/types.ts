export interface FlightSearchParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  adults?: number
  maxResults?: number
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
  source: 'kiwi' | 'amadeus' | 'travelpayouts' | 'skyscanner'
  isLive: boolean
}

export interface CheapestDestination {
  destination: string
  city: string
  country?: string
  price: number
  departDate: string
  returnDate?: string
  source: string
}

export interface FlightProvider {
  name: string
  isAvailable(): Promise<boolean>
  searchFlights(params: FlightSearchParams): Promise<FlightOffer[]>
  searchCheapest?(params: { origin: string; departDate: string; returnDate?: string; limit?: number }): Promise<CheapestDestination[]>
}
