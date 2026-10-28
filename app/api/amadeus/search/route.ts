import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'
import { searchFlights, isAmadeusAvailable } from '@/lib/amadeus'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Paid upstream API — cap per IP
  const rl = await rateLimitAsync(`amadeus:${getClientIp(request)}`, 20, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  const params = request.nextUrl.searchParams
  const origin = params.get('origin')
  const destination = params.get('destination')
  const departureDate = params.get('departure_date')
  const returnDate = params.get('return_date')
  const adults = Math.min(Math.max(parseInt(params.get('adults') || '1') || 1, 1), 9)
  const max = Math.min(Math.max(parseInt(params.get('max') || '5') || 5, 1), 50)

  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departure_date' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json(
      { error: 'origin and destination must be 3-letter IATA codes' },
      { status: 400 }
    )
  }

  if (!isAmadeusAvailable()) {
    return NextResponse.json(
      { error: 'Flight search service not available' },
      { status: 503 }
    )
  }

  try {
    const result = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults,
      max,
    })

    return NextResponse.json({
      offers: result.offers,
      source: result.source,
      count: result.offers.length,
    })
  } catch (err) {
    console.error('[Amadeus API] Search error:', err)
    return NextResponse.json(
      { error: 'Flight search failed. Please try again.' },
      { status: 502 }
    )
  }
}
