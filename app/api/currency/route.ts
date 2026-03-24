import { NextResponse } from 'next/server'
import { fetchAllRates, SUPPORTED_CURRENCIES } from '@/lib/currency'

export const dynamic = 'force-dynamic'

/**
 * GET /api/currency
 * Returns all exchange rates (USD base) + supported currency list.
 * Heavily cached — rates update every 6 hours.
 */
export async function GET() {
  const rates = await fetchAllRates()

  if (!rates) {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 502 }
    )
  }

  return NextResponse.json(
    {
      base: 'USD',
      rates,
      currencies: SUPPORTED_CURRENCIES,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    }
  )
}
