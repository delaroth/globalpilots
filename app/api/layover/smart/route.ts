import { NextRequest, NextResponse } from 'next/server'
import { searchStopoverRoutes } from '@/lib/flight-engine'
import { discoverStopovers } from '@/lib/flight-providers/serpapi-layover'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import type { BudgetTier } from '@/lib/destination-costs'
import { trackFeatureUse } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  // Rate limit removed — SerpApi has its own quota protection

  const sp = request.nextUrl.searchParams
  const origin = sp.get('origin')?.toUpperCase()
  const destination = sp.get('destination')?.toUpperCase()
  const departDate = sp.get('depart_date')
  const maxTravelDays = parseInt(sp.get('max_days') || '14', 10)
  const passportRaw = sp.get('passport')?.toUpperCase() || 'US'
  // Support comma-separated passports (e.g. "US,DE,GB") — use first as primary
  const passportCountries = passportRaw.split(',').map(s => s.trim()).filter(Boolean)
  const passportCountry = passportCountries[0] || 'US'
  const budgetTier = (sp.get('budget') || 'mid') as BudgetTier

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

  if (maxTravelDays < 1 || maxTravelDays > 90) {
    return NextResponse.json({ error: 'max_days must be between 1 and 90' }, { status: 400 })
  }

  const searchDate = departDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  try {
    // Primary: new unified flight engine with tiered API strategy
    const result = await searchStopoverRoutes({
      origin,
      destination,
      departDate: searchDate,
      maxTravelDays,
      passportCountry,
      passportCountries,
      budgetTier,
    })

    // Fire-and-forget tracking
    trackFeatureUse('stopover_search', {
      origin,
      destination,
      stopovers_found: result.stopovers?.length ?? 0,
      engine: 'flight-engine',
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('[Smart Layover] Flight engine failed, falling back to legacy:', error)

    // Fallback: legacy serpapi-layover engine
    try {
      const legacyResult = await discoverStopovers({
        origin,
        destination,
        departDate: searchDate,
        maxTravelDays,
        passportCountry,
        passportCountries,
        budgetTier,
      })

      trackFeatureUse('stopover_search', {
        origin,
        destination,
        stopovers_found: legacyResult.stopovers?.length ?? 0,
        engine: 'legacy-fallback',
      })

      return NextResponse.json(legacyResult, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      })
    } catch (legacyError) {
      console.error('[Smart Layover] Legacy fallback also failed:', legacyError)
      return NextResponse.json(
        { error: 'Failed to search stopovers. Please try again.' },
        { status: 502 }
      )
    }
  }
}
