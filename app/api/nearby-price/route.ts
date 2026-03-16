import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/nearby-price?origin=DMK&destination=NRT&departDate=2026-04-15
 *
 * Uses TravelPayouts /v2/prices/latest to get a cached price for a route.
 * This is FREE (no SerpApi credits) and used by the NearbyAirportPrices component.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('departDate')

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 })
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  try {
    const url = `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&token=${token}&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })

    if (!res.ok) {
      return NextResponse.json({ price: null })
    }

    const data = await res.json()
    if (!data.success || !data.data || data.data.length === 0) {
      return NextResponse.json({ price: null })
    }

    const entry = data.data[0]
    return NextResponse.json({
      price: entry.value,
      departDate: entry.depart_date || null,
      returnDate: entry.return_date || null,
    })
  } catch {
    return NextResponse.json({ price: null })
  }
}
