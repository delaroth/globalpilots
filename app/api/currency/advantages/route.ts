import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyAdvantages } from '@/lib/currency-advantage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/currency/advantages?base=USD
 * Returns destinations where the base currency gained >5% purchasing power vs 6 months ago
 */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.searchParams.get('base') || 'USD'

  try {
    const advantages = await getCurrencyAdvantages(base.toUpperCase())

    return NextResponse.json(
      { advantages },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (err) {
    console.error('[CurrencyAdvantages] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch currency advantages', advantages: [] },
      { status: 502 }
    )
  }
}
