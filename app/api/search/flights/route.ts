import { NextRequest, NextResponse } from 'next/server'
import { searchFlight } from '@/lib/flight-engine'
import { getSerpApiUsage } from '@/lib/flight-providers/serpapi'
import { trackFeatureUse } from '@/lib/analytics'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request)
  const rl = rateLimit(`flight-search:${clientIp}`, 5, 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('departDate')
  const returnDate = searchParams.get('returnDate') || undefined
  const departTimeRaw = searchParams.get('departTime') // 0=morning,1=afternoon,2=evening,3=night
  const returnTimeRaw = searchParams.get('returnTime')
  const departTime = departTimeRaw !== null ? parseInt(departTimeRaw, 10) : undefined
  const returnTime = returnTimeRaw !== null ? parseInt(returnTimeRaw, 10) : undefined

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departDate' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json(
      { error: 'origin and destination must be 3-letter IATA airport codes' },
      { status: 400 }
    )
  }

  if (origin === destination) {
    return NextResponse.json(
      { error: 'Origin and destination must be different' },
      { status: 400 }
    )
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departDate)) {
    return NextResponse.json(
      { error: 'departDate must be in YYYY-MM-DD format' },
      { status: 400 }
    )
  }

  try {
    // Unified tiered search — user explicitly searching = 'price-check'
    const result = await searchFlight({
      origin,
      destination,
      departDate,
      returnDate,
      routeType: 'price-check',
      maxTier: 3,
      departTime,
      returnTime,
    })

    const usage = getSerpApiUsage()

    trackFeatureUse('flight_search', {
      origin,
      destination,
      source: result.source,
      isLive: result.confidence === 'live',
      engine: 'flight-engine',
    })

    if (result.price === null) {
      return NextResponse.json({
        success: true,
        source: result.source,
        isLive: false,
        flight: null,
        message: 'No price data available for this route',
      })
    }

    return NextResponse.json({
      success: true,
      source: result.source === 'serpapi' ? 'google-flights' : result.source,
      isLive: result.confidence === 'live',
      flight: {
        price: result.price,
        airlines: result.airlines,
        stops: result.stops,
        duration: result.duration,
        priceLevel: null,
        typicalRange: null,
      },
      allPrices: result.allPrices,
      usage: {
        remaining: usage.remaining,
        limit: usage.limit,
      },
    })
  } catch (error) {
    console.error('[Flight Search API] Error:', error)
    return NextResponse.json(
      { error: 'Flight search failed. Please try again.' },
      { status: 502 }
    )
  }
}
