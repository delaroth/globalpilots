import { NextRequest, NextResponse } from 'next/server'
import { findCheapestDestinations } from '@/lib/flight-providers/serpapi-explore'
import { getDestinationCost, getAllDestinations } from '@/lib/destination-costs'
import { majorAirports } from '@/lib/geolocation'
import { getCached, setCache } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getCityName(code: string): string {
  const airport = majorAirports.find(a => a.code === code)
  return airport ? airport.city : code
}

function getCountryName(code: string): string {
  const airport = majorAirports.find(a => a.code === code)
  return airport ? airport.country : ''
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export async function GET(request: NextRequest) {
  // Rate limit: 10/min
  const ip = getClientIp(request)
  const rl = rateLimit(`deals:${ip}`, 10, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) },
      }
    )
  }

  const params = request.nextUrl.searchParams
  const origin = (params.get('origin') || 'JFK').toUpperCase()
  const monthParam = params.get('month')
  const month = monthParam ? parseInt(monthParam, 10) : 0

  if (!/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json({ error: 'origin must be a 3-letter IATA code' }, { status: 400 })
  }

  if (month < 0 || month > 12) {
    return NextResponse.json({ error: 'month must be 0-12 (0 = anytime)' }, { status: 400 })
  }

  // Check cache (2 hours)
  const cacheKey = `deals:${origin}:${month}`
  const cached = getCached<any>(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600' },
    })
  }

  try {
    // SerpApi Explore with month filter
    const destinations = await findCheapestDestinations({
      origin,
      month: month || undefined,
    })

    if (destinations.length > 0) {
      const enriched = destinations
        .filter(d => d.airportCode && d.airportCode !== origin && d.flightPrice > 0)
        .slice(0, 24)
        .map(d => {
          const costData = getDestinationCost(d.airportCode)
          const midCosts = costData?.dailyCosts.mid
          const dailyTotal = midCosts
            ? midCosts.hotel + midCosts.food + midCosts.transport + midCosts.activities
            : null

          return {
            airportCode: d.airportCode,
            name: d.name || getCityName(d.airportCode),
            country: d.country || getCountryName(d.airportCode),
            flightPrice: d.flightPrice,
            hotelPrice: d.hotelPrice,
            startDate: d.startDate,
            endDate: d.endDate,
            airline: d.airline,
            stops: d.stops,
            thumbnail: d.thumbnail,
            dailyCost: dailyTotal,
            bestMonths: costData?.bestMonths || [],
            isBestMonth: month ? (costData?.bestMonths?.includes(month) ?? false) : false,
          }
        })

      const response = {
        origin,
        month,
        monthName: month ? MONTH_NAMES[month] : 'Anytime',
        deals: enriched,
        count: enriched.length,
        source: 'live',
      }

      // Cache for 2 hours
      setCache(cacheKey, response, 2 * 60 * 60 * 1000)

      return NextResponse.json(response, {
        headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600' },
      })
    }

    // Fallback: use destination-costs data for seasonal recommendations
    throw new Error('No live deals')
  } catch {
    // Fallback to destination-costs database
    const allDests = getAllDestinations()

    const seasonalDeals = allDests
      .filter(d => month === 0 || d.bestMonths.includes(month))
      .map(d => {
        const mid = d.dailyCosts.mid
        const dailyTotal = mid.hotel + mid.food + mid.transport + mid.activities

        return {
          airportCode: d.code,
          name: d.city,
          country: d.country,
          flightPrice: null,
          hotelPrice: mid.hotel,
          startDate: null,
          endDate: null,
          airline: null,
          stops: null,
          thumbnail: null,
          dailyCost: dailyTotal,
          bestMonths: d.bestMonths,
          isBestMonth: month ? d.bestMonths.includes(month) : false,
        }
      })
      .sort((a, b) => a.dailyCost - b.dailyCost)
      .slice(0, 24)

    const response = {
      origin,
      month,
      monthName: month ? MONTH_NAMES[month] : 'Anytime',
      deals: seasonalDeals,
      count: seasonalDeals.length,
      source: 'database',
    }

    setCache(cacheKey, response, 2 * 60 * 60 * 1000)

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600' },
    })
  }
}
