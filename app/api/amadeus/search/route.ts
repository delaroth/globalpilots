import { NextRequest, NextResponse } from 'next/server'
import { searchFlights, isAmadeusAvailable } from '@/lib/amadeus'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const origin = params.get('origin')
  const destination = params.get('destination')
  const departureDate = params.get('departure_date')
  const returnDate = params.get('return_date')
  const adults = parseInt(params.get('adults') || '1')
  const max = parseInt(params.get('max') || '5')

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
      { error: 'Amadeus API not configured' },
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
    const message = err instanceof Error ? err.message : 'Amadeus search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
