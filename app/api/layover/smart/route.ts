import { NextRequest, NextResponse } from 'next/server'
import { discoverStopovers } from '@/lib/flight-providers/serpapi-layover'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import type { BudgetTier } from '@/lib/destination-costs'
import { trackFeatureUse } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const limited = rateLimit(ip, 10, 60000) // 10 req/min
  if (limited) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }

  const sp = request.nextUrl.searchParams
  const origin = sp.get('origin')?.toUpperCase()
  const destination = sp.get('destination')?.toUpperCase()
  const departDate = sp.get('depart_date')
  const maxTravelDays = parseInt(sp.get('max_days') || '14', 10)
  const passportCountry = sp.get('passport')?.toUpperCase() || 'US'
  const budgetTier = (sp.get('budget') || 'mid') as BudgetTier
  const maxStopoverDays = sp.get('stopover_days') ? parseInt(sp.get('stopover_days')!, 10) : undefined

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Missing required: origin, destination (IATA codes)' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json(
      { error: 'origin and destination must be 3-letter IATA codes' },
      { status: 400 }
    )
  }

  if (origin === destination) {
    return NextResponse.json({ error: 'Origin and destination must be different' }, { status: 400 })
  }

  if (maxTravelDays < 3 || maxTravelDays > 60) {
    return NextResponse.json({ error: 'max_days must be between 3 and 60' }, { status: 400 })
  }

  const searchDate = departDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  try {
    const result = await discoverStopovers({
      origin,
      destination,
      departDate: searchDate,
      maxTravelDays,
      passportCountry,
      budgetTier,
      maxStopoverDays,
    })

    // Fire-and-forget tracking
    trackFeatureUse('stopover_search', {
      origin,
      destination,
      stopovers_found: result.stopovers?.length ?? 0,
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('[Smart Layover] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search stopovers. Please try again.' },
      { status: 502 }
    )
  }
}
