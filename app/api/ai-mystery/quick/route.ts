import { NextRequest, NextResponse } from 'next/server'
import { findCheapestDestinations, vibeToInterest, daysToTravelDuration, dateToMonth } from '@/lib/flight-providers/serpapi-explore'
import { getDestinationCost } from '@/lib/destination-costs'
import { calculateBudgetAllocation, PackageComponents, getBudgetTier } from '@/lib/budget-allocation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { getCached } from '@/lib/cache'
import { searchKiwiInspiration } from '@/lib/kiwi'
import { AFFILIATE_FLAGS } from '@/lib/affiliate'
import { trackFeatureUse } from '@/lib/analytics'
import { getCachedDestination, cacheDestination, incrementRevealCount, buildBasicInfo } from '@/lib/destination-cache'

export const dynamic = 'force-dynamic'

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN
const API_BASE = 'https://api.travelpayouts.com'

interface QuickRequest {
  origin: string
  budget: number
  vibes: string[]
  dates: string
  tripDuration?: number
  exclude?: string[]
  accommodationLevel?: string
  budgetPriority?: string
  customSplit?: { flights: number; hotels: number; activities: number }
  packageComponents?: PackageComponents
}

// Hardcoded fallback destinations by region for thin-cache scenarios
const FALLBACK_DESTINATIONS: Record<string, { iata: string; city: string; country: string; priceRange: [number, number] }[]> = {
  'SE Asia': [
    { iata: 'HKT', city: 'Phuket', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'KBV', city: 'Krabi', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'DPS', city: 'Bali', country: 'Indonesia', priceRange: [60, 150] },
    { iata: 'HAN', city: 'Hanoi', country: 'Vietnam', priceRange: [80, 180] },
    { iata: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', priceRange: [80, 180] },
    { iata: 'CMB', city: 'Colombo', country: 'Sri Lanka', priceRange: [100, 200] },
    { iata: 'NRT', city: 'Tokyo', country: 'Japan', priceRange: [180, 400] },
    { iata: 'ICN', city: 'Seoul', country: 'South Korea', priceRange: [180, 400] },
  ],
  'Middle East': [
    { iata: 'MCT', city: 'Muscat', country: 'Oman', priceRange: [60, 120] },
    { iata: 'AMM', city: 'Amman', country: 'Jordan', priceRange: [60, 120] },
    { iata: 'CAI', city: 'Cairo', country: 'Egypt', priceRange: [80, 150] },
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', priceRange: [120, 250] },
    { iata: 'ATH', city: 'Athens', country: 'Greece', priceRange: [120, 250] },
  ],
  'Europe': [
    { iata: 'PRG', city: 'Prague', country: 'Czech Republic', priceRange: [40, 100] },
    { iata: 'BUD', city: 'Budapest', country: 'Hungary', priceRange: [40, 100] },
    { iata: 'KRK', city: 'Krakow', country: 'Poland', priceRange: [40, 100] },
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', priceRange: [50, 120] },
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', priceRange: [80, 200] },
  ],
  'North America': [
    { iata: 'CUN', city: 'Cancun', country: 'Mexico', priceRange: [100, 250] },
    { iata: 'SJO', city: 'San Jose', country: 'Costa Rica', priceRange: [150, 300] },
    { iata: 'BOG', city: 'Bogota', country: 'Colombia', priceRange: [150, 350] },
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', priceRange: [250, 500] },
  ],
}

function getOriginRegion(origin: string): string {
  const seAsia = ['BKK', 'SIN', 'KUL', 'CGK', 'MNL', 'HKT', 'CNX', 'HAN', 'SGN', 'DPS', 'PNH', 'REP']
  const middleEast = ['DXB', 'DOH', 'AUH', 'BAH', 'KWI', 'MCT', 'AMM', 'TLV', 'CAI']
  const europe = ['LHR', 'CDG', 'AMS', 'BCN', 'FCO', 'FRA', 'MUC', 'MAD', 'LIS', 'ATH', 'PRG', 'BUD', 'WAW', 'VIE', 'ZRH', 'CPH', 'OSL', 'ARN', 'BER', 'MXP', 'IST']
  const northAmerica = ['JFK', 'LAX', 'ORD', 'DFW', 'ATL', 'MIA', 'SFO', 'SEA', 'BOS', 'DEN', 'LAS', 'YYZ', 'YVR', 'MEX']

  if (seAsia.includes(origin)) return 'SE Asia'
  if (middleEast.includes(origin)) return 'Middle East'
  if (europe.includes(origin)) return 'Europe'
  if (northAmerica.includes(origin)) return 'North America'
  return 'SE Asia'
}

function calculateFlexibleDateRange(timeframe: string): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  switch (timeframe) {
    case 'this-month': {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { dateFrom: formatDate(today), dateTo: formatDate(endOfMonth) }
    }
    case 'next-month': {
      const firstOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      return { dateFrom: formatDate(firstOfNext), dateTo: formatDate(endOfNext) }
    }
    case 'next-3-months': {
      const threeMonths = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      return { dateFrom: formatDate(today), dateTo: formatDate(threeMonths) }
    }
    case 'next-6-months': {
      const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
      return { dateFrom: formatDate(today), dateTo: formatDate(sixMonths) }
    }
    case 'anytime':
    default: {
      const oneYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      return { dateFrom: formatDate(today), dateTo: formatDate(oneYear) }
    }
  }
}

/** Fuzzy cache key — matches the main route so cache hits work cross-endpoint */
function buildFuzzyCacheKey(origin: string, budget: number, vibes: string[], dates: string, tripDuration: number, components: PackageComponents, exclude: string[], accommodationLevel: string, budgetPriority: string): string {
  const bucketSize = Math.max(50, Math.round(budget * 0.15))
  const budgetBucket = Math.round(budget / bucketSize) * bucketSize
  const sortedVibes = vibes.map(v => v.toLowerCase().trim()).sort().join(',')
  return `mystery:${origin}:${budgetBucket}:${sortedVibes}:${dates}:${tripDuration}:${JSON.stringify(components)}:${exclude.sort().join(',')}:${accommodationLevel}:${budgetPriority}`
}

/** Vibe-matching score for a destination name/country */
function vibeScore(cityName: string, country: string, vibes: string[]): number {
  const text = `${cityName} ${country}`.toLowerCase()
  const vibeKeywords: Record<string, string[]> = {
    beach: ['beach', 'island', 'coast', 'tropical', 'bali', 'phuket', 'krabi', 'cancun', 'maldives', 'samui', 'caribbean'],
    city: ['city', 'urban', 'metro', 'tokyo', 'london', 'paris', 'new york', 'bangkok', 'singapore', 'istanbul', 'seoul', 'berlin'],
    adventure: ['adventure', 'mountain', 'trek', 'hike', 'nepal', 'patagonia', 'costa rica', 'iceland', 'safari', 'queenstown'],
    food: ['food', 'cuisine', 'culinary', 'italy', 'japan', 'thailand', 'vietnam', 'mexico', 'peru', 'india', 'korea', 'france'],
    nature: ['nature', 'forest', 'jungle', 'wildlife', 'national park', 'costa rica', 'new zealand', 'norway', 'iceland'],
  }
  let score = 0
  for (const vibe of vibes) {
    const keywords = vibeKeywords[vibe.toLowerCase()] || []
    for (const kw of keywords) {
      if (text.includes(kw)) score += 1
    }
  }
  return score
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 15 requests per minute (cheaper than AI endpoint)
    const clientIp = getClientIp(request)
    const rl = rateLimit(`ai-mystery-quick:${clientIp}`, 15, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: QuickRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { origin, budget, vibes, dates, tripDuration = 3, exclude = [] } = body
    const accommodationLevel = body.accommodationLevel || 'mid-range'
    const budgetPriority = body.budgetPriority || 'balanced'
    const components: PackageComponents = body.packageComponents || {
      includeFlight: true,
      includeHotel: true,
      includeItinerary: true,
      includeTransportation: false,
    }

    // Basic validation
    if (!origin || !budget || !vibes || vibes.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters: origin, budget, vibes' }, { status: 400 })
    }
    if (typeof budget !== 'number' || budget < 100 || budget > 50000) {
      return NextResponse.json({ error: 'Budget must be between 100 and 50000' }, { status: 400 })
    }
    if (!/^[A-Z]{3}$/.test(origin)) {
      return NextResponse.json({ error: 'origin must be a 3-letter IATA code' }, { status: 400 })
    }

    // Check full cache first — if we have a full AI result, return it immediately
    const cacheKey = buildFuzzyCacheKey(origin, budget, vibes, dates, tripDuration, components, exclude, accommodationLevel, budgetPriority)
    const fullCached = getCached<any>(cacheKey)
    if (fullCached) {
      console.log('[Quick] Full cache hit — returning complete data')
      return NextResponse.json({ ...fullCached, _cacheHit: true }, {
        headers: { 'X-Cache-Hit': 'true' },
      })
    }

    // Budget allocation — uses customSplit if provided, otherwise priority preset
    const allocation = calculateBudgetAllocation(budget, tripDuration, components, {
      budgetPriority,
      customSplit: body.customSplit,
    })

    const maxFlightPrice = allocation.flight

    // Derive Explore params
    const isFlexible = dates.startsWith('flexible:')
    const flexibleTimeframe = isFlexible ? dates.replace('flexible:', '') : null
    const flexibleRange = flexibleTimeframe ? calculateFlexibleDateRange(flexibleTimeframe) : null

    const exploreMonth = isFlexible
      ? dateToMonth(flexibleRange?.dateFrom)
      : dateToMonth(dates.split(' ')[0])
    const exploreDuration = daysToTravelDuration(tripDuration)
    const exploreInterest = vibeToInterest(vibes)

    let priceInfo: { destination: string; city?: string; country?: string; price: number; startDate?: string; endDate?: string; airline?: string; stops?: number; hotelPrice?: number | null }[] = []
    let priceIsEstimate = false
    let priceIsLive = false

    // PRIMARY: SerpApi Explore
    try {
      const exploreDestinations = await findCheapestDestinations({
        origin,
        maxPrice: maxFlightPrice,
        month: exploreMonth,
        travelDuration: exploreDuration,
        interest: exploreInterest,
      })

      if (exploreDestinations.length > 0) {
        console.log(`[Quick] SerpApi Explore returned ${exploreDestinations.length} destinations`)
        priceIsLive = true
        priceInfo = exploreDestinations.map(d => ({
          destination: d.airportCode,
          city: d.name,
          country: d.country,
          price: d.flightPrice,
          startDate: d.startDate,
          endDate: d.endDate,
          airline: d.airline,
          stops: d.stops,
          hotelPrice: d.hotelPrice,
        }))
      }
    } catch (err) {
      console.error('[Quick] SerpApi Explore failed:', err instanceof Error ? err.message : err)
    }

    // FALLBACK: Kiwi + TravelPayouts
    if (priceInfo.length === 0) {
      console.log('[Quick] Explore empty, falling back to Kiwi + TravelPayouts')

      let kiwiDateFrom: string
      let kiwiDateTo: string
      if (flexibleRange) {
        kiwiDateFrom = flexibleRange.dateFrom
        kiwiDateTo = flexibleRange.dateTo
      } else {
        const departDate = dates.split(' ')[0] || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
        kiwiDateFrom = departDate
        kiwiDateTo = new Date(new Date(departDate).getTime() + 30 * 86400000).toISOString().split('T')[0]
      }

      const kiwiEnabled = AFFILIATE_FLAGS.kiwi && !!process.env.KIWI_API_KEY
      const tpEnabled = !!TOKEN

      const kiwiPromise = kiwiEnabled
        ? searchKiwiInspiration({
            origin,
            dateFrom: kiwiDateFrom,
            dateTo: kiwiDateTo,
            maxPrice: maxFlightPrice,
          }).then(results => results.map(r => ({
            destination: r.flyTo,
            city: r.cityTo,
            country: r.countryTo?.name,
            price: r.price,
          })))
        : Promise.resolve([] as typeof priceInfo)

      const tpPromise = tpEnabled
        ? fetch(`${API_BASE}/v2/prices/latest?origin=${origin}&currency=usd&limit=30&token=${TOKEN}`, { next: { revalidate: 3600 } })
            .then(async res => {
              if (!res.ok) return []
              const data = await res.json()
              return (data.data || [])
                .filter((d: any) => d.value <= maxFlightPrice)
                .slice(0, 20)
                .map((d: any) => ({ destination: d.destination, price: d.value }))
                .sort((a: any, b: any) => a.price - b.price)
            })
        : Promise.resolve([] as typeof priceInfo)

      const [kiwiResult, tpResult] = await Promise.allSettled([kiwiPromise, tpPromise])
      const kiwiData = kiwiResult.status === 'fulfilled' ? kiwiResult.value : []
      const tpData = tpResult.status === 'fulfilled' ? tpResult.value : []

      if (kiwiData.length > 0) {
        priceInfo = kiwiData
      } else if (tpData.length > 0) {
        priceInfo = tpData
      }
    }

    // Thin-cache fallback
    if (priceInfo.length < 5) {
      priceIsEstimate = true
      priceIsLive = false
      const region = getOriginRegion(origin)
      const fallbacks = FALLBACK_DESTINATIONS[region] || FALLBACK_DESTINATIONS['SE Asia']
      priceInfo = fallbacks
        .filter(f => f.priceRange[0] <= maxFlightPrice)
        .map(f => ({
          destination: f.iata,
          city: f.city,
          country: f.country,
          price: Math.round((f.priceRange[0] + f.priceRange[1]) / 2),
        }))
    }

    // Filter out excluded destinations
    if (exclude.length > 0) {
      const excludeSet = new Set(exclude.map(e => e.toUpperCase()))
      priceInfo = priceInfo.filter(d => !excludeSet.has(d.destination.toUpperCase()))
    }

    if (priceInfo.length === 0) {
      return NextResponse.json(
        { error: 'No destinations found within your budget. Try increasing your budget.' },
        { status: 400 }
      )
    }

    // Pick best destination matching vibes
    // Score each destination, then pick from top 5 (weighted random for variety)
    const scored = priceInfo.map(d => ({
      ...d,
      score: vibeScore(d.city || d.destination, d.country || '', vibes),
    })).sort((a, b) => b.score - a.score)

    // Take top 5 or all if fewer
    const candidates = scored.slice(0, Math.min(5, scored.length))

    // If we have vibe-matched ones (score > 0), prefer them; otherwise random from top 5
    const vibeMatched = candidates.filter(c => c.score > 0)
    const pool = vibeMatched.length > 0 ? vibeMatched : candidates
    const picked = pool[Math.floor(Math.random() * pool.length)]

    // Estimate hotel price
    const costData = getDestinationCost(picked.destination)
    const accomTierMap: Record<string, 'budget' | 'mid' | 'comfort'> = {
      'hostel': 'budget',
      'budget': 'budget',
      'mid-range': 'mid',
      'upscale': 'comfort',
      'luxury': 'comfort',
    }
    const costTier = accomTierMap[accommodationLevel] || 'mid'
    let hotelEstimate = allocation.hotel_per_night

    if (picked.hotelPrice && picked.hotelPrice > 0) {
      // Use Explore hotel price if available
      hotelEstimate = picked.hotelPrice
    } else if (costData) {
      hotelEstimate = costData.dailyCosts[costTier].hotel
    }

    // Compute suggested dates
    const effectiveDepartDate = picked.startDate || (isFlexible ? flexibleRange?.dateFrom : dates.split(' ')[0]) || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    const effectiveReturnDate = picked.endDate || (() => {
      const d = new Date(effectiveDepartDate + 'T00:00:00')
      d.setDate(d.getDate() + tripDuration)
      return d.toISOString().split('T')[0]
    })()

    const result = {
      destination: picked.city || picked.destination,
      country: picked.country || '',
      iata: picked.destination,
      city_code_IATA: picked.destination,
      estimated_flight_cost: picked.price,
      indicativeFlightPrice: picked.price,
      estimated_hotel_per_night: hotelEstimate,
      flightPrice: picked.price,
      airline: picked.airline || undefined,
      stops: picked.stops ?? undefined,
      startDate: effectiveDepartDate,
      endDate: effectiveReturnDate,
      suggestedDepartureDate: effectiveDepartDate,
      suggestedReturnDate: effectiveReturnDate,
      priceIsLive,
      priceIsEstimate,
      googleFlightsPrice: priceIsLive ? picked.price : undefined,
      googleFlightsAirlines: picked.airline ? [picked.airline] : undefined,
      googleFlightsStops: picked.stops ?? undefined,
      hotelEstimate,
      budgetTier: getBudgetTier(budget, tripDuration),
    }

    console.log(`[Quick] Picked destination: ${result.destination} (${result.iata}) — flight $${result.estimated_flight_cost}, hotel $${result.estimated_hotel_per_night}/night`)

    // --- Destination cache: check for cached basic info or build it ---
    let cachedBasicInfo: any = null
    try {
      const cached = await getCachedDestination(result.iata)
      if (cached) {
        cachedBasicInfo = cached.basicInfo
      } else {
        // Cache miss — build basic info from static data and cache it
        const basicInfo = buildBasicInfo(result.iata, result.destination, result.country)
        cachedBasicInfo = basicInfo
        cacheDestination({
          iata: result.iata,
          city: result.destination,
          country: result.country,
          basicInfo,
          aiContent: null,
          flightStats: null,
          revealCount: 1,
        }).catch(() => {})
      }
      // Fire-and-forget: increment reveal count
      incrementRevealCount(result.iata).catch(() => {})
    } catch {
      // Cache is non-critical — continue without it
    }

    // Fire-and-forget: track the mystery search
    trackFeatureUse('mystery_search', {
      origin,
      budget,
      vibes,
      destination_found: result.iata,
    })

    return NextResponse.json({ ...result, cachedBasicInfo })
  } catch (error) {
    console.error('[Quick] Error:', error)
    return NextResponse.json(
      { error: 'Failed to find destination. Please try again.' },
      { status: 500 }
    )
  }
}
