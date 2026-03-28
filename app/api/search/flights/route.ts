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

  // Accept multi-airport codes (BKK,DMK) — use primary for search
  const primaryOrigin = origin.split(',')[0].trim()
  const primaryDest = destination.split(',')[0].trim()

  if (!/^[A-Z]{3}$/.test(primaryOrigin) || !/^[A-Z]{3}$/.test(primaryDest)) {
    return NextResponse.json(
      { error: 'origin and destination must be 3-letter IATA airport codes' },
      { status: 400 }
    )
  }

  if (primaryOrigin === primaryDest) {
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
    // Search from ALL origin airports in parallel and pick cheapest
    const originCodes = origin.includes(',') ? origin.split(',').map(c => c.trim()).filter(c => /^[A-Z]{3}$/.test(c)) : [primaryOrigin]
    const destCodes = destination.includes(',') ? destination.split(',').map(c => c.trim()).filter(c => /^[A-Z]{3}$/.test(c)) : [primaryDest]

    // Search all origin×dest combinations in parallel
    const searchCombinations = originCodes.flatMap(o => destCodes.map(d => ({ o, d })))
      .filter(({ o, d }) => o !== d)

    const results = await Promise.allSettled(
      searchCombinations.map(({ o, d }) =>
        searchFlight({
          origin: o,
          destination: d,
          departDate,
          returnDate,
          routeType: 'price-check',
          maxTier: 3,
          departTime,
          returnTime,
        }).then(result => ({ origin: o, destination: d, result }))
      )
    )

    // Find the cheapest result across all airport combinations
    let best: { origin: string; destination: string; result: Awaited<ReturnType<typeof searchFlight>> } | null = null
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      const { result } = r.value
      if (result.price === null) continue
      if (!best || result.price < (best.result.price ?? Infinity)) {
        best = r.value
      }
    }

    const usage = getSerpApiUsage()

    trackFeatureUse('flight_search', {
      origin: best?.origin || primaryOrigin,
      destination: best?.destination || primaryDest,
      source: best?.result.source || 'none',
      isLive: best?.result.confidence === 'live',
      engine: 'flight-engine',
    })

    if (!best) {
      return NextResponse.json({
        success: true,
        source: 'none',
        isLive: false,
        flight: null,
        message: 'No price data available for this route',
      })
    }

    return NextResponse.json({
      success: true,
      source: best.result.source === 'serpapi' ? 'google-flights' : best.result.source,
      isLive: best.result.confidence === 'live',
      bestOrigin: best.origin, // Which airport had the cheapest flight
      bestDestination: best.destination,
      flight: {
        price: best.result.price!,
        airlines: best.result.airlines,
        stops: best.result.stops,
        duration: best.result.duration,
        priceLevel: null,
        typicalRange: null,
      },
      allPrices: best.result.allPrices,
      usage: {
        remaining: usage.remaining,
        limit: usage.limit,
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[Flight Search API] Error:', errMsg)

    // Provide helpful error messages for common issues
    let userMessage = 'Flight search failed. Please try again.'
    if (errMsg.includes('timeout') || errMsg.includes('Timeout')) {
      userMessage = 'Flight search timed out. Try again in a moment.'
    } else if (errMsg.includes('rate') || errMsg.includes('429')) {
      userMessage = 'Too many searches — please wait a moment and try again.'
    } else if (errMsg.includes('No flights') || errMsg.includes('empty')) {
      userMessage = 'No flights found for this route and dates. Try different dates or a nearby airport.'
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 502 }
    )
  }
}
