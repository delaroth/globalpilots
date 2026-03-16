import { NextRequest, NextResponse } from 'next/server'
import { exploreDestinations, dateToMonth, type ExploreDestination } from '@/lib/flight-providers/serpapi-explore'
import { serpapiProvider, getGoogleFlightsPrice, getSerpApiUsage } from '@/lib/flight-providers/serpapi'
import { trackFeatureUse } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60_000)

/**
 * Flexible flight search API.
 *
 * Handles combinations of exact/month/anytime for departure and return dates.
 * Uses SerpApi Explore for month/anytime searches (1 API call) and
 * SerpApi Google Flights for exact date searches.
 *
 * Query params:
 *   origin: IATA code (required)
 *   destination: IATA code (required)
 *   departType: 'exact' | 'month' | 'anytime' (required)
 *   departDate: YYYY-MM-DD (required if departType=exact)
 *   departMonth: YYYY-MM (required if departType=month)
 *   returnType: 'exact' | 'month' | 'anytime' | 'none' (required)
 *   returnDate: YYYY-MM-DD (required if returnType=exact)
 *   returnMonth: YYYY-MM (required if returnType=month)
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute before searching again.' },
      { status: 429 }
    )
  }

  const p = request.nextUrl.searchParams
  const origin = p.get('origin')
  const destination = p.get('destination')
  const departType = p.get('departType') as 'exact' | 'month' | 'anytime'
  const departDate = p.get('departDate') || undefined
  const departMonth = p.get('departMonth') || undefined
  const returnType = p.get('returnType') as 'exact' | 'month' | 'anytime' | 'none'
  const returnDate = p.get('returnDate') || undefined
  const returnMonth = p.get('returnMonth') || undefined

  // Validation
  if (!origin || !destination) {
    return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 })
  }
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json({ error: 'origin and destination must be 3-letter IATA codes' }, { status: 400 })
  }
  if (origin === destination) {
    return NextResponse.json({ error: 'Origin and destination must be different' }, { status: 400 })
  }
  if (!['exact', 'month', 'anytime'].includes(departType)) {
    return NextResponse.json({ error: 'departType must be exact, month, or anytime' }, { status: 400 })
  }
  if (!['exact', 'month', 'anytime', 'none'].includes(returnType)) {
    return NextResponse.json({ error: 'returnType must be exact, month, anytime, or none' }, { status: 400 })
  }

  try {
    const usage = getSerpApiUsage()
    console.log(`[Flexible Search] ${origin} -> ${destination}, depart=${departType}, return=${returnType} (${usage.remaining} SerpApi remaining)`)

    // Fire-and-forget tracking
    trackFeatureUse('flight_search_flexible', {
      origin,
      destination,
      departure_type: departType,
      return_type: returnType,
    })

    // ── Case 1: Both exact → standard Google Flights search (1 call) ──
    if (departType === 'exact' && returnType === 'exact') {
      if (!departDate || !returnDate) {
        return NextResponse.json({ error: 'departDate and returnDate required for exact dates' }, { status: 400 })
      }
      return await searchExactDates(origin, destination, departDate, returnDate)
    }

    // ── Case 2: Exact departure, no return (one-way exact) ──
    if (departType === 'exact' && returnType === 'none') {
      if (!departDate) {
        return NextResponse.json({ error: 'departDate required for exact departure' }, { status: 400 })
      }
      return await searchExactDates(origin, destination, departDate, undefined)
    }

    // ── Case 3: Exact departure + flexible return (month/anytime) ──
    // Search one-way for departure, then use Explore for return direction
    if (departType === 'exact' && (returnType === 'month' || returnType === 'anytime')) {
      if (!departDate) {
        return NextResponse.json({ error: 'departDate required for exact departure' }, { status: 400 })
      }

      // Get departure price via Google Flights (one-way)
      const departResult = await getGoogleFlightsPrice(origin, destination, departDate)

      // Get return options via Explore (cheapest dates for return direction)
      const returnMonthNum = returnType === 'month' && returnMonth
        ? parseInt(returnMonth.split('-')[1])
        : 0 // 0 = anytime

      const exploreResult = await exploreDestinations({
        origin: destination, // reverse direction for return
        destination: origin,
        month: returnMonthNum,
        type: 2, // one-way
      })

      const bestReturn = exploreResult.flights.length > 0
        ? exploreResult.flights.sort((a, b) => a.price - b.price)[0]
        : null

      return NextResponse.json({
        success: true,
        searchType: 'mixed',
        departure: {
          type: 'exact',
          date: departDate,
          price: departResult?.price || null,
          airlines: departResult?.airlines || [],
          stops: departResult?.stops ?? null,
          duration: departResult?.duration || null,
          isLive: !!departResult,
          source: departResult ? 'google-flights' : null,
        },
        return: {
          type: returnType,
          bestDate: exploreResult.startDate || (bestReturn ? null : null),
          price: bestReturn?.price || null,
          airline: bestReturn?.airline || null,
          stops: bestReturn?.stops ?? null,
          isLive: exploreResult.flights.length > 0,
          source: exploreResult.flights.length > 0 ? 'serpapi-explore' : null,
          // Also provide the destination list if we got one for the return direction
          options: exploreResult.flights.slice(0, 5).map(f => ({
            price: f.price,
            airline: f.airline,
            stops: f.stops,
            duration: f.duration,
          })),
        },
        totalEstimate: (departResult?.price || 0) + (bestReturn?.price || 0) || null,
      })
    }

    // ── Case 4: Month departure (with any return type) ──
    // Use Explore API with month=N for the departure month
    if (departType === 'month') {
      const monthNum = departMonth
        ? parseInt(departMonth.split('-')[1])
        : new Date().getMonth() + 1

      const exploreResult = await exploreDestinations({
        origin,
        destination,
        month: monthNum,
        type: (returnType === 'none') ? 2 : 1, // one-way or round trip
      })

      // For a specific route, the Explore API returns flights and best dates
      const bestFlight = exploreResult.flights.length > 0
        ? exploreResult.flights.sort((a, b) => a.price - b.price)[0]
        : null

      // Also check if there's a matching destination entry
      const destMatch = exploreResult.destinations.find(
        d => d.airportCode === destination
      )

      // Fall back to TravelPayouts calendar if Explore returns nothing
      if (!bestFlight && !destMatch) {
        return await fallbackToTravelPayoutsMonth(origin, destination, departMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
      }

      const price = bestFlight?.price || destMatch?.flightPrice || null
      const bestDepartDate = destMatch?.startDate || exploreResult.startDate || null
      const bestReturnDate = destMatch?.endDate || exploreResult.endDate || null

      return NextResponse.json({
        success: true,
        searchType: 'flexible',
        flexType: 'month',
        month: departMonth,
        monthNum,
        bestDepartDate,
        bestReturnDate,
        price,
        airline: bestFlight?.airline || destMatch?.airline || null,
        stops: bestFlight?.stops ?? destMatch?.stops ?? null,
        duration: bestFlight?.duration || destMatch?.flightDuration || null,
        isLive: true,
        source: 'serpapi-explore',
        flights: exploreResult.flights.slice(0, 5).map(f => ({
          price: f.price,
          airline: f.airline,
          stops: f.stops,
          duration: f.duration,
          isCheapest: f.isCheapest,
        })),
      })
    }

    // ── Case 5: Anytime departure (with any return type) ──
    // Use Explore API with month=0 (next 6 months)
    if (departType === 'anytime') {
      const exploreResult = await exploreDestinations({
        origin,
        destination,
        month: 0, // anytime = cheapest in next 6 months
        type: (returnType === 'none') ? 2 : 1,
      })

      const bestFlight = exploreResult.flights.length > 0
        ? exploreResult.flights.sort((a, b) => a.price - b.price)[0]
        : null

      const destMatch = exploreResult.destinations.find(
        d => d.airportCode === destination
      )

      // Fall back to TravelPayouts if Explore returns nothing
      if (!bestFlight && !destMatch) {
        return await fallbackToTravelPayoutsAnytime(origin, destination)
      }

      const price = bestFlight?.price || destMatch?.flightPrice || null
      const bestDepartDate = destMatch?.startDate || exploreResult.startDate || null
      const bestReturnDate = destMatch?.endDate || exploreResult.endDate || null

      return NextResponse.json({
        success: true,
        searchType: 'flexible',
        flexType: 'anytime',
        bestDepartDate,
        bestReturnDate,
        price,
        airline: bestFlight?.airline || destMatch?.airline || null,
        stops: bestFlight?.stops ?? destMatch?.stops ?? null,
        duration: bestFlight?.duration || destMatch?.flightDuration || null,
        isLive: true,
        source: 'serpapi-explore',
        flights: exploreResult.flights.slice(0, 5).map(f => ({
          price: f.price,
          airline: f.airline,
          stops: f.stops,
          duration: f.duration,
          isCheapest: f.isCheapest,
        })),
      })
    }

    return NextResponse.json({ error: 'Unsupported date combination' }, { status: 400 })
  } catch (error) {
    console.error('[Flexible Search] Error:', error)
    return NextResponse.json(
      { error: 'Flexible search failed. Please try again.' },
      { status: 502 }
    )
  }
}

// ── Helper: exact date search via Google Flights + TravelPayouts fallback ──

async function searchExactDates(
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string | undefined,
) {
  // Try Google Flights first
  const result = await getGoogleFlightsPrice(origin, destination, departDate, returnDate)

  if (result) {
    const usage = getSerpApiUsage()
    return NextResponse.json({
      success: true,
      searchType: 'exact',
      source: 'google-flights',
      isLive: true,
      price: result.price,
      airlines: result.airlines,
      stops: result.stops,
      duration: result.duration,
      priceLevel: result.priceLevel || null,
      typicalRange: result.typicalRange || null,
      departDate,
      returnDate: returnDate || null,
      usage: { remaining: usage.remaining, limit: usage.limit },
    })
  }

  // Fallback to TravelPayouts cached price
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN
  if (!tpToken) {
    return NextResponse.json({
      success: true,
      searchType: 'exact',
      source: null,
      isLive: false,
      price: null,
      message: 'No price data available',
    })
  }

  const monthStr = departDate.slice(0, 7)
  const tpUrl = `https://api.travelpayouts.com/v2/prices/month-matrix?origin=${origin}&destination=${destination}&month=${monthStr}&currency=usd&token=${tpToken}`

  try {
    const tpRes = await fetch(tpUrl, { signal: AbortSignal.timeout(8000) })
    if (!tpRes.ok) throw new Error(`TravelPayouts HTTP ${tpRes.status}`)

    const tpData = await tpRes.json()
    if (!tpData.success || !tpData.data) throw new Error('No data')

    const dayEntry = tpData.data.find((d: any) => d.depart_date === departDate)

    if (!dayEntry) {
      return NextResponse.json({
        success: true,
        searchType: 'exact',
        source: 'travelpayouts',
        isLive: false,
        price: null,
        message: 'No price data available for this date',
      })
    }

    return NextResponse.json({
      success: true,
      searchType: 'exact',
      source: 'travelpayouts',
      isLive: false,
      price: dayEntry.value,
      airlines: [],
      stops: dayEntry.number_of_changes ?? null,
      duration: null,
      priceLevel: null,
      typicalRange: null,
      departDate,
      returnDate: returnDate || null,
    })
  } catch {
    return NextResponse.json({
      success: true,
      searchType: 'exact',
      source: null,
      isLive: false,
      price: null,
      message: 'Price lookup failed',
    })
  }
}

// ── Helper: TravelPayouts fallback for month searches ──

async function fallbackToTravelPayoutsMonth(origin: string, destination: string, month: string) {
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN
  if (!tpToken) {
    return NextResponse.json({
      success: true,
      searchType: 'flexible',
      flexType: 'month',
      price: null,
      source: null,
      message: 'No price data available',
    })
  }

  try {
    const url = `https://api.travelpayouts.com/v1/prices/calendar?origin=${origin}&destination=${destination}&depart_date=${month}&currency=usd&token=${tpToken}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    if (!data.data || Object.keys(data.data).length === 0) {
      return NextResponse.json({
        success: true,
        searchType: 'flexible',
        flexType: 'month',
        price: null,
        source: null,
        message: 'No prices found for this month',
      })
    }

    // Find cheapest day in the month
    const entries = Object.entries(data.data) as [string, any][]
    const cheapest = entries
      .filter(([_, v]) => v && (v.price || v.value))
      .sort((a, b) => ((a[1] as any).price || (a[1] as any).value) - ((b[1] as any).price || (b[1] as any).value))[0]

    if (!cheapest) {
      return NextResponse.json({
        success: true,
        searchType: 'flexible',
        flexType: 'month',
        price: null,
        source: null,
        message: 'No prices found for this month',
      })
    }

    const cheapestData = cheapest[1] as any
    const price = cheapestData.price || cheapestData.value

    return NextResponse.json({
      success: true,
      searchType: 'flexible',
      flexType: 'month',
      month,
      bestDepartDate: cheapest[0],
      bestReturnDate: cheapestData.return_date || null,
      price,
      airline: cheapestData.airline || null,
      stops: cheapestData.number_of_changes ?? null,
      duration: null,
      isLive: false,
      source: 'travelpayouts',
      calendarData: data.data, // Send full calendar so frontend can show month view
    })
  } catch {
    return NextResponse.json({
      success: true,
      searchType: 'flexible',
      flexType: 'month',
      price: null,
      source: null,
      message: 'Price lookup failed',
    })
  }
}

// ── Helper: TravelPayouts fallback for anytime searches ──

async function fallbackToTravelPayoutsAnytime(origin: string, destination: string) {
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN
  if (!tpToken) {
    return NextResponse.json({
      success: true,
      searchType: 'flexible',
      flexType: 'anytime',
      price: null,
      source: null,
      message: 'No price data available',
    })
  }

  try {
    const url = `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&limit=30&token=${tpToken}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const deals = (data.data || [])
      .filter((d: any) => new Date(d.depart_date) >= new Date())
      .sort((a: any, b: any) => a.value - b.value)

    if (deals.length === 0) {
      return NextResponse.json({
        success: true,
        searchType: 'flexible',
        flexType: 'anytime',
        price: null,
        source: null,
        message: 'No prices found',
      })
    }

    const best = deals[0]
    return NextResponse.json({
      success: true,
      searchType: 'flexible',
      flexType: 'anytime',
      bestDepartDate: best.depart_date,
      bestReturnDate: best.return_date || null,
      price: best.value,
      airline: best.airline || null,
      stops: best.number_of_changes ?? null,
      duration: null,
      isLive: false,
      source: 'travelpayouts',
    })
  } catch {
    return NextResponse.json({
      success: true,
      searchType: 'flexible',
      flexType: 'anytime',
      price: null,
      source: null,
      message: 'Price lookup failed',
    })
  }
}
