import { NextRequest, NextResponse } from 'next/server'
import { searchKiwiFlights } from '@/lib/kiwi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!process.env.KIWI_API_KEY) {
    return NextResponse.json(
      { error: 'Kiwi not yet active' },
      { status: 503 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination') || 'anywhere'
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const maxPrice = searchParams.get('max_price')
  const limit = searchParams.get('limit')

  if (!origin || !dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, date_from, date_to' },
      { status: 400 }
    )
  }

  try {
    const results = await searchKiwiFlights({
      origin,
      destination,
      dateFrom,
      dateTo,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      limit: limit ? parseInt(limit) : 20,
    })

    // Return in same shape as /api/travelpayouts/latest for UI compatibility
    const data = results.map(r => ({
      value: r.price,
      origin: r.flyFrom,
      destination: r.flyTo,
      gate: r.cityTo,
      depart_date: r.departureDate,
      return_date: r.returnDate || '',
      number_of_changes: 0,
      distance: 0,
      actual: true,
      trip_class: 0,
      show_to_affiliates: true,
      found_at: new Date().toISOString(),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Kiwi API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kiwi search failed' },
      { status: 500 }
    )
  }
}
