import { NextRequest, NextResponse } from 'next/server'
import { findCheapestDestinations, INTERESTS } from '@/lib/flight-providers/serpapi-explore'
import { getAllDestinations, getDestinationCost } from '@/lib/destination-costs'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import type { ExploreDestination } from '@/lib/flight-providers/serpapi-explore'

export const dynamic = 'force-dynamic'

// Map interest keywords to SerpApi interest kgmids
const INTEREST_MAP: Record<string, string> = {
  beaches: INTERESTS.beaches,
  outdoors: INTERESTS.outdoors,
  culture: INTERESTS.history,
  food: INTERESTS.popular,
  skiing: INTERESTS.skiing,
}

// Country code → flag emoji lookup for common travel destinations
const COUNTRY_FLAGS: Record<string, string> = {
  Thailand: '🇹🇭', Japan: '🇯🇵', Vietnam: '🇻🇳', Indonesia: '🇮🇩', Malaysia: '🇲🇾',
  Philippines: '🇵🇭', Cambodia: '🇰🇭', Myanmar: '🇲🇲', Laos: '🇱🇦', Singapore: '🇸🇬',
  India: '🇮🇳', Nepal: '🇳🇵', 'Sri Lanka': '🇱🇰', China: '🇨🇳', 'South Korea': '🇰🇷',
  Taiwan: '🇹🇼', 'Hong Kong': '🇭🇰', Macao: '🇲🇴',
  France: '🇫🇷', Spain: '🇪🇸', Italy: '🇮🇹', Germany: '🇩🇪', Portugal: '🇵🇹',
  Greece: '🇬🇷', Turkey: '🇹🇷', Netherlands: '🇳🇱', Belgium: '🇧🇪', Switzerland: '🇨🇭',
  Austria: '🇦🇹', 'Czech Republic': '🇨🇿', Czechia: '🇨🇿', Poland: '🇵🇱', Hungary: '🇭🇺',
  Croatia: '🇭🇷', Romania: '🇷🇴', Bulgaria: '🇧🇬', Sweden: '🇸🇪', Norway: '🇳🇴',
  Denmark: '🇩🇰', Finland: '🇫🇮', Iceland: '🇮🇸', Ireland: '🇮🇪',
  'United Kingdom': '🇬🇧', UK: '🇬🇧',
  'United States': '🇺🇸', USA: '🇺🇸', Canada: '🇨🇦', Mexico: '🇲🇽',
  Colombia: '🇨🇴', Peru: '🇵🇪', Brazil: '🇧🇷', Argentina: '🇦🇷', Chile: '🇨🇱',
  Ecuador: '🇪🇨', Bolivia: '🇧🇴', Uruguay: '🇺🇾', 'Costa Rica': '🇨🇷', Panama: '🇵🇦',
  Guatemala: '🇬🇹', Cuba: '🇨🇺',
  Morocco: '🇲🇦', Egypt: '🇪🇬', 'South Africa': '🇿🇦', Kenya: '🇰🇪', Tanzania: '🇹🇿',
  Ethiopia: '🇪🇹', Ghana: '🇬🇭', Nigeria: '🇳🇬',
  Australia: '🇦🇺', 'New Zealand': '🇳🇿', Fiji: '🇫🇯',
  UAE: '🇦🇪', 'United Arab Emirates': '🇦🇪', Jordan: '🇯🇴', Israel: '🇮🇱',
  Oman: '🇴🇲', Qatar: '🇶🇦', Georgia: '🇬🇪',
  Montenegro: '🇲🇪', Serbia: '🇷🇸', Albania: '🇦🇱', 'North Macedonia': '🇲🇰',
  'Dominican Republic': '🇩🇴', Jamaica: '🇯🇲',
}

/**
 * Pick a sensible default origin based on approximate time-of-day heuristic:
 * - Americas awake hours → JFK
 * - Europe/Africa awake hours → LHR
 * - Asia/Oceania awake hours → BKK
 */
function defaultOrigin(): string {
  const hour = new Date().getUTCHours()
  if (hour >= 12 && hour < 21) return 'JFK' // ~7am-4pm EST
  if (hour >= 6 && hour < 15) return 'LHR'  // ~6am-3pm GMT
  return 'BKK'                                // ~1am-10am ICT (evening/night UTC)
}

export async function GET(request: NextRequest) {
  // Rate limit: 10/min
  const ip = getClientIp(request)
  const rl = rateLimit(`inspire:${ip}`, 10, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rl.resetMs / 1000)),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const origin = (searchParams.get('origin') || defaultOrigin()).toUpperCase()
  const budgetParam = searchParams.get('budget')
  const maxPrice = budgetParam ? parseInt(budgetParam, 10) : undefined
  const interest = searchParams.get('interest') || undefined
  const interestKgmid = interest ? INTEREST_MAP[interest] : undefined

  try {
    // Try SerpApi first
    const destinations = await findCheapestDestinations({
      origin,
      maxPrice: maxPrice || undefined,
      interest: interestKgmid,
    })

    if (destinations.length > 0) {
      // Enrich with daily cost data from our database
      const enriched = destinations.slice(0, 30).map((d) => {
        const costData = getDestinationCost(d.airportCode)
        const midCosts = costData?.dailyCosts.mid
        const dailyTotal = midCosts
          ? midCosts.hotel + midCosts.food + midCosts.transport + midCosts.activities
          : null

        return {
          name: d.name,
          country: d.country,
          airportCode: d.airportCode,
          flightPrice: d.flightPrice,
          hotelPrice: d.hotelPrice,
          startDate: d.startDate,
          endDate: d.endDate,
          airline: d.airline,
          thumbnail: d.thumbnail,
          dailyCost: dailyTotal,
          budgetTier: dailyTotal
            ? dailyTotal < 50
              ? 'budget'
              : dailyTotal < 120
                ? 'mid-range'
                : 'comfort'
            : null,
          flag: COUNTRY_FLAGS[d.country] || null,
        }
      })

      return NextResponse.json(
        { destinations: enriched, origin, source: 'live' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      )
    }

    // Fall through to fallback
    throw new Error('No live destinations returned')
  } catch {
    // Fallback: use destination-costs database
    const allDests = getAllDestinations()

    // Shuffle deterministically based on the hour so it changes periodically
    const hourSeed = new Date().getUTCHours()
    const shuffled = [...allDests].sort(
      (a, b) => hashCode(a.code + hourSeed) - hashCode(b.code + hourSeed)
    )

    const fallback = shuffled.slice(0, 25).map((d) => {
      const mid = d.dailyCosts.mid
      const dailyTotal = mid.hotel + mid.food + mid.transport + mid.activities

      return {
        name: d.city,
        country: d.country,
        airportCode: d.code,
        flightPrice: null,
        hotelPrice: mid.hotel,
        startDate: null,
        endDate: null,
        airline: null,
        thumbnail: null,
        dailyCost: dailyTotal,
        budgetTier:
          dailyTotal < 50 ? 'budget' : dailyTotal < 120 ? 'mid-range' : 'comfort',
        flag: COUNTRY_FLAGS[d.country] || null,
      }
    })

    return NextResponse.json(
      { destinations: fallback, origin, source: 'database' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    )
  }
}

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}
