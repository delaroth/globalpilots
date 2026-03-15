import { NextRequest, NextResponse } from 'next/server'
import { searchHotels } from '@/lib/flight-providers/serpapi-hotels'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(request)
  const rl = rateLimit(`hotels:${ip}`, 10, 60_000)

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before searching again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) },
      }
    )
  }

  const params = request.nextUrl.searchParams
  const destination = params.get('destination')
  const checkIn = params.get('check_in')
  const checkOut = params.get('check_out')
  const adults = params.get('adults')
  const maxPrice = params.get('max_price')
  const currency = params.get('currency')

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Missing required parameters: destination, check_in, check_out' },
      { status: 400 }
    )
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
    return NextResponse.json(
      { error: 'check_in and check_out must be in YYYY-MM-DD format' },
      { status: 400 }
    )
  }

  // Validate check_out is after check_in
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: 'check_out must be after check_in' },
      { status: 400 }
    )
  }

  // Validate destination length (prevent abuse)
  if (destination.length > 200) {
    return NextResponse.json(
      { error: 'destination is too long' },
      { status: 400 }
    )
  }

  try {
    console.log(`[Hotels API] Searching: ${destination}, ${checkIn} to ${checkOut}`)

    const result = await searchHotels({
      destination,
      checkIn,
      checkOut,
      adults: adults ? parseInt(adults, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      currency: currency || undefined,
    })

    if (result.hotels.length === 0) {
      return NextResponse.json({
        success: true,
        hotels: [],
        cheapestPrice: 0,
        averagePrice: 0,
        message: 'No hotels found for this destination and date range.',
        source: result.source,
      })
    }

    console.log(`[Hotels API] Returning ${result.hotels.length} hotels, cheapest: $${result.cheapestPrice}/night`)

    return NextResponse.json({
      success: true,
      hotels: result.hotels,
      cheapestPrice: result.cheapestPrice,
      averagePrice: result.averagePrice,
      source: result.source,
      fetchedAt: result.fetchedAt,
    })
  } catch (error) {
    console.error('[Hotels API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search hotels. Please try again.' },
      { status: 502 }
    )
  }
}
