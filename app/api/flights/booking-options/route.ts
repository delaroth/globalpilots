import { NextRequest, NextResponse } from 'next/server'
import { getBookingOptions } from '@/lib/flight-providers/serpapi-booking'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Rate limit: 5 requests per minute per IP
  const ip = getClientIp(request)
  const rl = rateLimit(`booking-options:${ip}`, 5, 60_000)

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before comparing prices again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) },
      }
    )
  }

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Missing required parameter: token (booking_token from flight search)' },
      { status: 400 }
    )
  }

  // Basic validation — booking tokens are long base64-ish strings
  if (token.length < 10 || token.length > 2000) {
    return NextResponse.json(
      { error: 'Invalid booking token format' },
      { status: 400 }
    )
  }

  try {
    console.log(`[Booking Options API] Fetching options for token: ${token.slice(0, 20)}...`)

    const result = await getBookingOptions(token)

    if (result.options.length === 0) {
      return NextResponse.json({
        success: true,
        options: [],
        lowestPrice: null,
        airlineDirectPrice: null,
        message: 'No booking options available. The flight may no longer be available.',
        source: result.source,
      })
    }

    console.log(`[Booking Options API] Returning ${result.options.length} options, cheapest: $${result.lowestPrice}`)

    return NextResponse.json({
      success: true,
      options: result.options,
      lowestPrice: result.lowestPrice,
      airlineDirectPrice: result.airlineDirectPrice,
      source: result.source,
      fetchedAt: result.fetchedAt,
    })
  } catch (error) {
    console.error('[Booking Options API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking options. Please try again.' },
      { status: 502 }
    )
  }
}
