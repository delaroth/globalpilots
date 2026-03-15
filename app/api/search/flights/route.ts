import { NextRequest, NextResponse } from 'next/server'
import { serpapiProvider, getGoogleFlightsPrice, getSerpApiUsage } from '@/lib/flight-providers/serpapi'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
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

  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('departDate')
  const returnDate = searchParams.get('returnDate') || undefined

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
    // Priority 1: SerpApi Google Flights (live data)
    const serpApiAvailable = await serpapiProvider.isAvailable()

    if (serpApiAvailable) {
      console.log(`[Flight Search API] Trying SerpApi for ${origin} → ${destination} on ${departDate}`)
      try {
        const result = await getGoogleFlightsPrice(origin, destination, departDate, returnDate)

        if (result) {
          const usage = getSerpApiUsage()
          console.log(`[Flight Search API] SerpApi success: $${result.price} (${usage.remaining} searches remaining)`)

          return NextResponse.json({
            success: true,
            source: 'google-flights',
            isLive: true,
            flight: {
              price: result.price,
              airlines: result.airlines,
              stops: result.stops,
              duration: result.duration,
              priceLevel: result.priceLevel || null,
              typicalRange: result.typicalRange || null,
            },
            usage: {
              remaining: usage.remaining,
              limit: usage.limit,
            },
          })
        }

        console.log('[Flight Search API] SerpApi returned no results, falling back to TravelPayouts')
      } catch (serpErr) {
        console.warn('[Flight Search API] SerpApi error, falling back:', serpErr instanceof Error ? serpErr.message : serpErr)
      }
    } else {
      const usage = getSerpApiUsage()
      console.log(`[Flight Search API] SerpApi unavailable (${usage.remaining} remaining), falling back to TravelPayouts`)
    }

    // Priority 2: TravelPayouts cached price (fallback)
    console.log(`[Flight Search API] Falling back to TravelPayouts calendar for ${origin} → ${destination}`)
    const monthStr = departDate.slice(0, 7)
    const tpToken = process.env.TRAVELPAYOUTS_TOKEN
    if (!tpToken) {
      return NextResponse.json(
        { error: 'Flight search service temporarily unavailable' },
        { status: 503 }
      )
    }

    const tpUrl = `https://api.travelpayouts.com/v2/prices/month-matrix?origin=${origin}&destination=${destination}&month=${monthStr}&currency=usd&token=${tpToken}`
    const tpRes = await fetch(tpUrl, { signal: AbortSignal.timeout(8000) })

    if (!tpRes.ok) {
      throw new Error(`TravelPayouts HTTP ${tpRes.status}`)
    }

    const tpData = await tpRes.json()
    if (!tpData.success || !tpData.data) {
      throw new Error('TravelPayouts returned no data')
    }

    // Find the specific date in the month matrix
    const dayEntry = tpData.data.find((d: any) => d.depart_date === departDate)

    if (!dayEntry) {
      return NextResponse.json({
        success: true,
        source: 'travelpayouts',
        isLive: false,
        flight: null,
        message: 'No price data available for this date',
      })
    }

    return NextResponse.json({
      success: true,
      source: 'travelpayouts',
      isLive: false,
      flight: {
        price: dayEntry.value,
        airlines: [],
        stops: dayEntry.number_of_changes ?? null,
        duration: null,
        priceLevel: null,
        typicalRange: null,
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
