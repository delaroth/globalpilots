import { NextRequest, NextResponse } from 'next/server'
import { searchFlights, isKiwiAvailable } from '@/lib/kiwi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isKiwiAvailable()) {
    return NextResponse.json(
      { error: 'Flight search service not available' },
      { status: 503 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departureDate = searchParams.get('departure_date')
  const returnDate = searchParams.get('return_date')
  const max = searchParams.get('max')

  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departure_date' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json(
      { error: 'origin must be a 3-letter IATA airport code' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json(
      { error: 'destination must be a 3-letter IATA airport code' },
      { status: 400 }
    )
  }

  try {
    const results = await searchFlights({
      origin,
      destination,
      departDate: departureDate,
      returnDate: returnDate || undefined,
      maxResults: max ? parseInt(max) : 10,
    })

    return NextResponse.json({
      success: true,
      source: 'kiwi-live',
      count: results.length,
      offers: results,
    })
  } catch (error) {
    console.error('[Kiwi Search API] Error:', error)
    return NextResponse.json(
      { error: 'Flight search failed. Please try again.' },
      { status: 502 }
    )
  }
}
