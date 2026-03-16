import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

// Simple in-memory rate limiting
const requestLog: Map<string, number[]> = new Map()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const requests = requestLog.get(ip) || []
  const recent = requests.filter(t => now - t < RATE_WINDOW)
  requestLog.set(ip, recent)
  if (recent.length >= RATE_LIMIT) return true
  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

/**
 * GET /api/price-calendar?origin=BKK&destination=NRT&month=2026-04
 * Returns daily flight prices for a month using TravelPayouts month-matrix API
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait a moment.' },
      { status: 429 }
    )
  }

  const origin = request.nextUrl.searchParams.get('origin')?.toUpperCase()
  const destination = request.nextUrl.searchParams.get('destination')?.toUpperCase()
  const month = request.nextUrl.searchParams.get('month') // YYYY-MM

  if (!origin || !destination || !month) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, month' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json(
      { error: 'origin and destination must be 3-letter IATA codes' },
      { status: 400 }
    )
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: 'month must be in YYYY-MM format' },
      { status: 400 }
    )
  }

  if (!TOKEN) {
    return NextResponse.json(
      { error: 'Service not configured' },
      { status: 500 }
    )
  }

  try {
    const url = `https://api.travelpayouts.com/v2/prices/month-matrix?origin=${origin}&destination=${destination}&month=${month}&currency=usd&token=${TOKEN}`

    const response = await fetch(url, {
      next: { revalidate: 7200 }, // Cache 2 hours
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PriceCalendar] API error:', response.status, errorText.substring(0, 200))
      throw new Error(`TravelPayouts API returned ${response.status}`)
    }

    const data = await response.json()
    const rawPrices = data.data || []

    // Find the lowest price
    let lowestPrice = Infinity
    for (const entry of rawPrices) {
      if (entry.value && entry.value < lowestPrice) {
        lowestPrice = entry.value
      }
    }

    // Transform to our format
    const prices = rawPrices
      .filter((entry: { depart_date: string; value: number }) => entry.depart_date && entry.value)
      .map((entry: { depart_date: string; value: number }) => ({
        date: entry.depart_date,
        price: entry.value,
        isLowest: entry.value === lowestPrice,
      }))

    return NextResponse.json(
      { prices },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
        },
      }
    )
  } catch (err) {
    console.error('[PriceCalendar] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch price data', prices: [] },
      { status: 502 }
    )
  }
}
