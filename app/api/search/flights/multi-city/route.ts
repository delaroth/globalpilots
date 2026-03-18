import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleFlights, getSerpApiUsage } from '@/lib/flight-providers/serpapi'
import { searchFlight } from '@/lib/flight-engine'

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

interface LegInput {
  from: string
  to: string
  date: string
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute before searching again.' },
      { status: 429 }
    )
  }

  let body: { legs?: LegInput[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { legs } = body
  if (!legs || !Array.isArray(legs) || legs.length < 2 || legs.length > 5) {
    return NextResponse.json(
      { error: 'Provide between 2 and 5 flight legs' },
      { status: 400 }
    )
  }

  // Validate each leg
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]
    if (!leg.from || !leg.to || !leg.date) {
      return NextResponse.json(
        { error: `Leg ${i + 1}: missing from, to, or date` },
        { status: 400 }
      )
    }
    if (!/^[A-Z]{3}$/.test(leg.from) || !/^[A-Z]{3}$/.test(leg.to)) {
      return NextResponse.json(
        { error: `Leg ${i + 1}: from and to must be 3-letter IATA codes` },
        { status: 400 }
      )
    }
    if (leg.from === leg.to) {
      return NextResponse.json(
        { error: `Leg ${i + 1}: origin and destination must be different` },
        { status: 400 }
      )
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(leg.date)) {
      return NextResponse.json(
        { error: `Leg ${i + 1}: date must be YYYY-MM-DD` },
        { status: 400 }
      )
    }
  }

  try {
    // Search each leg via the tiered flight engine (TravelPayouts + SerpApi, no FlightAPI)
    const legPromises = legs.map(async (leg) => {
      const bookingUrl = `https://www.google.com/travel/flights?q=flights+from+${leg.from}+to+${leg.to}+on+${leg.date}`

      try {
        const result = await searchFlight({
          origin: leg.from,
          destination: leg.to,
          departDate: leg.date,
          routeType: 'price-check',
          maxTier: 2, // free + SerpApi — no FlightAPI credits for multi-city search
        })

        if (result.price === null) {
          return {
            from: leg.from,
            to: leg.to,
            date: leg.date,
            price: null,
            airlines: [],
            stops: null,
            duration: null,
            isLive: false,
            source: result.source,
            bookingUrl,
          }
        }

        return {
          from: leg.from,
          to: leg.to,
          date: leg.date,
          price: result.price,
          airlines: result.airlines,
          stops: result.stops,
          duration: result.duration,
          isLive: result.confidence === 'live',
          source: result.source,
          bookingUrl,
        }
      } catch (err) {
        console.warn(`[Multi-city] Leg ${leg.from}→${leg.to} failed:`, err instanceof Error ? err.message : err)
        return {
          from: leg.from,
          to: leg.to,
          date: leg.date,
          price: null,
          airlines: [],
          stops: null,
          duration: null,
          isLive: false,
          source: 'error',
          bookingUrl,
        }
      }
    })

    const legResults = await Promise.all(legPromises)
    const totalPrice = legResults.reduce((sum, l) => sum + (l.price || 0), 0)
    const usage = getSerpApiUsage()

    console.log(`[Multi-city] ${legs.length} legs searched, total $${totalPrice} (${usage.remaining} SerpApi searches remaining)`)

    return NextResponse.json({
      success: true,
      legs: legResults,
      totalPrice,
      usage: {
        remaining: usage.remaining,
        limit: usage.limit,
      },
    })
  } catch (error) {
    console.error('[Multi-city] Error:', error)
    return NextResponse.json(
      { error: 'Multi-city search failed. Please try again.' },
      { status: 502 }
    )
  }
}
