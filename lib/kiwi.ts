// Kiwi Tequila API integration
// Activate by setting AFFILIATE_FLAGS.kiwi = true in lib/affiliate.ts
// and adding KIWI_API_KEY to env vars

const KIWI_BASE = 'https://api.tequila.kiwi.com'

export interface KiwiFlightResult {
  id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  countryTo: { code: string; name: string }
  price: number
  currency: string
  departureDate: string
  returnDate?: string
  airlines: string[]
  route: { flyFrom: string; flyTo: string; price: number }[]
}

export interface KiwiLayoverResult {
  direct: KiwiFlightResult | null
  viaHub: {
    hub: string
    hubCity: string
    leg1: KiwiFlightResult
    leg2: KiwiFlightResult
    totalPrice: number
    savings: number | null
    savingsPercent: number | null
  }[]
}

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'apikey': process.env.KIWI_API_KEY || '',
  }
}

/**
 * Search one-way or return flights — replaces TravelPayouts latest/calendar
 */
export async function searchKiwiFlights(params: {
  origin: string
  destination: string // IATA or 'anywhere'
  dateFrom: string    // dd/mm/yyyy
  dateTo: string
  returnFrom?: string
  returnTo?: string
  maxPrice?: number
  currency?: string   // default USD
  limit?: number      // default 20
}): Promise<KiwiFlightResult[]> {
  const {
    origin, destination, dateFrom, dateTo,
    returnFrom, returnTo,
    maxPrice, currency = 'USD', limit = 20,
  } = params

  const searchParams = new URLSearchParams({
    fly_from: origin,
    fly_to: destination,
    date_from: dateFrom,
    date_to: dateTo,
    curr: currency,
    limit: String(limit),
    sort: 'price',
    one_for_city: '1',
  })

  if (returnFrom) searchParams.set('return_from', returnFrom)
  if (returnTo) searchParams.set('return_to', returnTo)
  if (maxPrice) searchParams.set('price_to', String(maxPrice))

  const response = await fetch(`${KIWI_BASE}/v2/search?${searchParams}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Kiwi API error: ${response.status}`)
  }

  const data = await response.json()

  return (data.data || []).map((f: any) => ({
    id: f.id,
    flyFrom: f.flyFrom,
    flyTo: f.flyTo,
    cityFrom: f.cityFrom,
    cityTo: f.cityTo,
    countryTo: f.countryTo,
    price: f.price,
    currency: f.currency || currency,
    departureDate: f.local_departure,
    returnDate: f.local_arrival,
    airlines: f.airlines || [],
    route: (f.route || []).map((r: any) => ({
      flyFrom: r.flyFrom,
      flyTo: r.flyTo,
      price: r.price,
    })),
  }))
}

/**
 * Multi-city search — powers Layover Arbitrage properly
 * Returns: direct route + all viable hub combinations with prices for each leg
 */
export async function searchKiwiMultiCity(params: {
  origin: string
  destination: string
  departDate: string   // YYYY-MM-DD
  maxPrice?: number
}): Promise<KiwiLayoverResult> {
  const { origin, destination, departDate, maxPrice } = params

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  const dateFormatted = formatDate(departDate)
  const dateEnd = formatDate(new Date(new Date(departDate).getTime() + 3 * 86400000).toISOString().split('T')[0])

  // Search direct
  let direct: KiwiFlightResult | null = null
  try {
    const results = await searchKiwiFlights({
      origin, destination, dateFrom: dateFormatted, dateTo: dateEnd,
      maxPrice, limit: 1,
    })
    if (results.length > 0) direct = results[0]
  } catch {}

  // Search via hubs
  const hubs = ['SIN', 'DXB', 'IST', 'DOH', 'LHR', 'CDG', 'HKG', 'BKK', 'KUL', 'FRA']
    .filter(h => h !== origin && h !== destination)

  const viaHub: KiwiLayoverResult['viaHub'] = []

  await Promise.all(hubs.map(async (hub) => {
    try {
      const [leg1Results, leg2Results] = await Promise.all([
        searchKiwiFlights({ origin, destination: hub, dateFrom: dateFormatted, dateTo: dateEnd, limit: 1 }),
        searchKiwiFlights({ origin: hub, destination, dateFrom: dateFormatted, dateTo: dateEnd, limit: 1 }),
      ])

      if (leg1Results.length > 0 && leg2Results.length > 0) {
        const totalPrice = leg1Results[0].price + leg2Results[0].price
        const savings = direct ? direct.price - totalPrice : null
        const savingsPercent = direct && savings !== null ? Math.round((savings / direct.price) * 100) : null

        viaHub.push({
          hub,
          hubCity: leg1Results[0].cityTo,
          leg1: leg1Results[0],
          leg2: leg2Results[0],
          totalPrice,
          savings,
          savingsPercent,
        })
      }
    } catch {}
  }))

  viaHub.sort((a, b) => a.totalPrice - b.totalPrice)

  return { direct, viaHub }
}

/**
 * Inspiration search — powers Mystery Trip with real data
 * fly_to=anywhere — returns cheapest destinations globally, not cache-limited
 */
export async function searchKiwiInspiration(params: {
  origin: string
  dateFrom: string     // YYYY-MM-DD
  dateTo: string       // YYYY-MM-DD
  maxPrice: number
  currency?: string
}): Promise<KiwiFlightResult[]> {
  const { origin, dateFrom, dateTo, maxPrice, currency = 'USD' } = params

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  return searchKiwiFlights({
    origin,
    destination: 'anywhere',
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(dateTo),
    maxPrice,
    currency,
    limit: 30,
  })
}
