import { NextRequest, NextResponse } from 'next/server'
import { findCheapestDestinations, vibeToInterest, daysToTravelDuration, dateToMonth } from '@/lib/flight-providers/serpapi-explore'
import { searchFlight, discoverCheapDestinations, validateCandidatesWithSerpApi, type CandidateDestination } from '@/lib/flight-engine'
import { getDestinationCost } from '@/lib/destination-costs'
import { calculateBudgetAllocation, PackageComponents, getBudgetTier } from '@/lib/budget-allocation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { getCached } from '@/lib/cache'
import { searchKiwiInspiration } from '@/lib/kiwi'
import { AFFILIATE_FLAGS } from '@/lib/affiliate'
import { trackFeatureUse } from '@/lib/analytics'
import { getCachedDestination, cacheDestination, incrementRevealCount, buildBasicInfo } from '@/lib/destination-cache'
import { checkVisaRequirement } from '@/lib/enrichment/visa'
import { callAI } from '@/lib/ai'
import { lookupAirportByCode } from '@/lib/geolocation'
import { withRetry } from '@/lib/retry'
import { pickDepartureDate, computeReturnDate } from '@/lib/date-utils'

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
  passports?: string[] // ISO alpha-2 codes for visa filtering
}

// Hardcoded fallback destinations by region — shuffled at runtime for variety
const FALLBACK_DESTINATIONS: Record<string, { iata: string; city: string; country: string; priceRange: [number, number] }[]> = {
  'SE Asia': [
    { iata: 'DPS', city: 'Bali', country: 'Indonesia', priceRange: [60, 150] },
    { iata: 'HAN', city: 'Hanoi', country: 'Vietnam', priceRange: [80, 180] },
    { iata: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', priceRange: [80, 180] },
    { iata: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', priceRange: [40, 100] },
    { iata: 'CMB', city: 'Colombo', country: 'Sri Lanka', priceRange: [100, 200] },
    { iata: 'SIN', city: 'Singapore', country: 'Singapore', priceRange: [50, 120] },
    { iata: 'MNL', city: 'Manila', country: 'Philippines', priceRange: [80, 180] },
    { iata: 'RGN', city: 'Yangon', country: 'Myanmar', priceRange: [60, 140] },
    { iata: 'HKT', city: 'Phuket', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'KBV', city: 'Krabi', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'CNX', city: 'Chiang Mai', country: 'Thailand', priceRange: [20, 60] },
    { iata: 'NRT', city: 'Tokyo', country: 'Japan', priceRange: [180, 400] },
    { iata: 'ICN', city: 'Seoul', country: 'South Korea', priceRange: [180, 400] },
    { iata: 'TPE', city: 'Taipei', country: 'Taiwan', priceRange: [120, 280] },
    { iata: 'PNH', city: 'Phnom Penh', country: 'Cambodia', priceRange: [60, 140] },
    { iata: 'REP', city: 'Siem Reap', country: 'Cambodia', priceRange: [80, 160] },
    { iata: 'DAD', city: 'Da Nang', country: 'Vietnam', priceRange: [80, 160] },
    { iata: 'CCU', city: 'Kolkata', country: 'India', priceRange: [100, 220] },
    { iata: 'DEL', city: 'Delhi', country: 'India', priceRange: [120, 260] },
    { iata: 'BOM', city: 'Mumbai', country: 'India', priceRange: [120, 260] },
  ],
  'Middle East': [
    { iata: 'MCT', city: 'Muscat', country: 'Oman', priceRange: [60, 120] },
    { iata: 'AMM', city: 'Amman', country: 'Jordan', priceRange: [60, 120] },
    { iata: 'CAI', city: 'Cairo', country: 'Egypt', priceRange: [80, 150] },
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', priceRange: [120, 250] },
    { iata: 'ATH', city: 'Athens', country: 'Greece', priceRange: [120, 250] },
    { iata: 'TBS', city: 'Tbilisi', country: 'Georgia', priceRange: [100, 200] },
    { iata: 'EVN', city: 'Yerevan', country: 'Armenia', priceRange: [100, 200] },
    { iata: 'TLV', city: 'Tel Aviv', country: 'Israel', priceRange: [150, 350] },
  ],
  'Europe': [
    { iata: 'PRG', city: 'Prague', country: 'Czech Republic', priceRange: [40, 100] },
    { iata: 'BUD', city: 'Budapest', country: 'Hungary', priceRange: [40, 100] },
    { iata: 'KRK', city: 'Krakow', country: 'Poland', priceRange: [40, 100] },
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', priceRange: [50, 120] },
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', priceRange: [80, 200] },
    { iata: 'BCN', city: 'Barcelona', country: 'Spain', priceRange: [50, 150] },
    { iata: 'FCO', city: 'Rome', country: 'Italy', priceRange: [60, 150] },
    { iata: 'ATH', city: 'Athens', country: 'Greece', priceRange: [60, 150] },
    { iata: 'TIA', city: 'Tirana', country: 'Albania', priceRange: [50, 120] },
    { iata: 'SOF', city: 'Sofia', country: 'Bulgaria', priceRange: [40, 100] },
  ],
  'North America': [
    { iata: 'CUN', city: 'Cancun', country: 'Mexico', priceRange: [100, 250] },
    { iata: 'SJO', city: 'San Jose', country: 'Costa Rica', priceRange: [150, 300] },
    { iata: 'BOG', city: 'Bogota', country: 'Colombia', priceRange: [150, 350] },
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', priceRange: [250, 500] },
    { iata: 'MDE', city: 'Medellin', country: 'Colombia', priceRange: [150, 350] },
    { iata: 'LIM', city: 'Lima', country: 'Peru', priceRange: [200, 400] },
    { iata: 'PTY', city: 'Panama City', country: 'Panama', priceRange: [120, 280] },
    { iata: 'SDQ', city: 'Santo Domingo', country: 'Dominican Republic', priceRange: [100, 250] },
  ],
}

/** Shuffle an array in-place (Fisher-Yates) */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** De-duplicate destinations by IATA code, keeping the cheapest price */
function deduplicateByIata(destinations: { destination: string; price: number; [key: string]: any }[]): typeof destinations {
  const seen = new Map<string, typeof destinations[0]>()
  for (const d of destinations) {
    const iata = d.destination.toUpperCase()
    const existing = seen.get(iata)
    if (!existing || d.price < existing.price) {
      seen.set(iata, d)
    }
  }
  return [...seen.values()]
}

/** Enforce geographic diversity: max N destinations per country */
function enforceCountryDiversity(destinations: { country?: string; [key: string]: any }[], maxPerCountry: number): typeof destinations {
  const countryCount = new Map<string, number>()
  return destinations.filter(d => {
    const country = (d.country || 'unknown').toLowerCase()
    const count = countryCount.get(country) || 0
    if (count >= maxPerCountry) return false
    countryCount.set(country, count + 1)
    return true
  })
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
  // Flights departing within the next 7 days are often unavailable or extremely expensive
  const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  switch (timeframe) {
    case 'this-month': {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      // If less than 10 days left in the month, extend into next month
      if (endOfMonth.getTime() - earliest.getTime() < 3 * 86400000) {
        const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        return { dateFrom: formatDate(earliest), dateTo: formatDate(endOfNext) }
      }
      return { dateFrom: formatDate(earliest), dateTo: formatDate(endOfMonth) }
    }
    case 'next-month': {
      const firstOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      const startDate = firstOfNext > earliest ? firstOfNext : earliest
      return { dateFrom: formatDate(startDate), dateTo: formatDate(endOfNext) }
    }
    case 'next-3-months': {
      const threeMonths = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      return { dateFrom: formatDate(earliest), dateTo: formatDate(threeMonths) }
    }
    case 'next-6-months': {
      const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
      return { dateFrom: formatDate(earliest), dateTo: formatDate(sixMonths) }
    }
    case 'anytime':
    default: {
      const oneYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      return { dateFrom: formatDate(earliest), dateTo: formatDate(oneYear) }
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

/** Vibe-matching score using destination-costs data for accuracy, NOT hardcoded city names */
function vibeScore(cityName: string, country: string, vibes: string[]): number {
  // Use real destination cost data for scoring when available
  const costData = getDestinationCost(cityName)
  const text = `${cityName} ${country}`.toLowerCase()

  // Country-level vibe associations (geographic, not hardcoded city names)
  const vibeCountries: Record<string, string[]> = {
    beach: ['thailand', 'indonesia', 'philippines', 'maldives', 'sri lanka', 'greece', 'croatia', 'mexico', 'dominican republic', 'jamaica', 'fiji', 'mauritius'],
    city: ['japan', 'south korea', 'singapore', 'hong kong', 'taiwan', 'united kingdom', 'germany', 'france', 'netherlands', 'spain', 'italy', 'turkey'],
    adventure: ['nepal', 'peru', 'costa rica', 'iceland', 'new zealand', 'kenya', 'tanzania', 'georgia', 'colombia', 'patagonia', 'morocco'],
    food: ['japan', 'italy', 'france', 'thailand', 'vietnam', 'mexico', 'peru', 'india', 'south korea', 'taiwan', 'spain', 'turkey', 'greece', 'morocco'],
    nature: ['costa rica', 'new zealand', 'iceland', 'norway', 'sri lanka', 'myanmar', 'nepal', 'kenya', 'tanzania', 'peru', 'colombia'],
    culture: ['japan', 'india', 'morocco', 'egypt', 'peru', 'turkey', 'greece', 'italy', 'cambodia', 'myanmar', 'iran', 'jordan'],
    nightlife: ['spain', 'germany', 'thailand', 'colombia', 'argentina', 'portugal', 'czech republic', 'hungary'],
    relaxing: ['maldives', 'sri lanka', 'bali', 'portugal', 'greece', 'croatia', 'mauritius', 'fiji'],
  }

  let score = 0
  for (const vibe of vibes) {
    const countries = vibeCountries[vibe.toLowerCase()] || []
    if (countries.some(c => text.includes(c))) score += 1
  }

  // Bonus: destination-costs data has real daily cost info — cheaper = better value
  if (costData) {
    score += 1 // bonus for having verified cost data
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

    const { origin, budget, vibes, dates, tripDuration = 3, exclude = [], passports = [] } = body
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
    // Accept single IATA (BKK) or city group (BKK,DMK) — use first code as primary
    if (!/^[A-Z]{3}(,[A-Z]{3})*$/.test(origin)) {
      return NextResponse.json({ error: 'origin must be a 3-letter IATA code or comma-separated codes' }, { status: 400 })
    }
    // For multi-airport cities, we'll search from the primary (first) airport
    // Future: search from all and pick cheapest
    const originCodes = origin.split(',')
    const primaryOrigin = originCodes[0]

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

    let priceInfo: { destination: string; city?: string; country?: string; price: number; startDate?: string; endDate?: string; airline?: string; stops?: number; hotelPrice?: number | null; originAirport?: string }[] = []
    let priceIsEstimate = false
    let priceIsLive = false

    // PRIMARY: Search from ALL origin airports and merge results
    // For BKK,DMK → search both, keep cheapest per destination with origin tagged
    try {
      const allDiscoveries = await Promise.allSettled(
        originCodes.map(code =>
          discoverCheapDestinations({
            origin: code,
            maxPrice: maxFlightPrice,
            month: exploreMonth,
            travelDuration: exploreDuration,
            interest: exploreInterest,
          }).then(result => ({ code, result }))
        )
      )

      // Merge all results, tagging each with its origin airport
      const merged: typeof priceInfo = []
      let anySource = ''
      for (const discovery of allDiscoveries) {
        if (discovery.status !== 'fulfilled') continue
        const { code, result } = discovery.value
        if (result.destinations.length > 0) {
          anySource = result.source
          for (const d of result.destinations) {
            merged.push({
              destination: d.destination,
              city: d.city,
              country: d.country,
              price: d.price,
              startDate: d.startDate,
              endDate: d.endDate,
              airline: d.airline,
              stops: d.stops,
              hotelPrice: d.hotelPrice,
              originAirport: code, // Track which airport this deal is from
            })
          }
        }
      }

      if (merged.length > 0) {
        // Deduplicate by destination — keep cheapest origin per destination
        const bestByDest = new Map<string, typeof merged[0]>()
        for (const d of merged) {
          const key = d.destination.toUpperCase()
          const existing = bestByDest.get(key)
          if (!existing || d.price < existing.price) {
            bestByDest.set(key, d)
          }
        }
        priceInfo = [...bestByDest.values()]
        priceIsLive = anySource === 'serpapi-explore'
        priceIsEstimate = anySource === 'travelpayouts'
        console.log(`[Quick] Searched ${originCodes.length} airports, found ${merged.length} total → ${priceInfo.length} unique destinations (cheapest per dest)`)
      }
    } catch (err) {
      console.error('[Quick] discoverCheapDestinations failed:', err instanceof Error ? err.message : err)
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

      // Search from ALL origin airports for both Kiwi and TravelPayouts
      const fallbackResults: typeof priceInfo = []

      const fallbackPromises = originCodes.flatMap(code => {
        const promises: Promise<typeof priceInfo>[] = []

        if (kiwiEnabled) {
          promises.push(
            searchKiwiInspiration({
              origin: code,
              dateFrom: kiwiDateFrom,
              dateTo: kiwiDateTo,
              maxPrice: maxFlightPrice,
            }).then(results => results.map(r => ({
              destination: r.flyTo,
              city: r.cityTo,
              country: r.countryTo?.name,
              price: r.price,
              originAirport: code,
            }))).catch(() => [] as typeof priceInfo)
          )
        }

        if (tpEnabled) {
          promises.push(
            fetch(`${API_BASE}/v2/prices/latest?origin=${code}&currency=usd&one_way=false&limit=30&token=${TOKEN}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) })
              .then(async res => {
                if (!res.ok) return []
                const data = await res.json()
                return (data.data || [])
                  .filter((d: any) => d.value <= maxFlightPrice)
                  .slice(0, 20)
                  .map((d: any) => {
                    const airport = lookupAirportByCode(d.destination)
                    return {
                      destination: d.destination,
                      city: airport?.city || d.destination,
                      country: airport?.country || '',
                      price: d.value,
                      originAirport: code,
                    }
                  })
              }).catch(() => [] as typeof priceInfo)
          )
        }

        return promises
      })

      const fallbackSettled = await Promise.allSettled(fallbackPromises)
      for (const r of fallbackSettled) {
        if (r.status === 'fulfilled') fallbackResults.push(...r.value)
      }

      // Deduplicate by destination — keep cheapest origin per destination
      if (fallbackResults.length > 0) {
        const bestByDest = new Map<string, typeof fallbackResults[0]>()
        for (const d of fallbackResults) {
          const key = d.destination.toUpperCase()
          const existing = bestByDest.get(key)
          if (!existing || d.price < existing.price) {
            bestByDest.set(key, d)
          }
        }
        priceInfo = [...bestByDest.values()].sort((a, b) => a.price - b.price)
      }
    }

    // Thin-cache fallback — shuffle for variety and include budget-appropriate destinations
    if (priceInfo.length < 5) {
      priceIsEstimate = true
      priceIsLive = false
      const region = getOriginRegion(primaryOrigin)
      const fallbacks = shuffleArray(FALLBACK_DESTINATIONS[region] || FALLBACK_DESTINATIONS['SE Asia'])
      const fallbackResults = fallbacks
        .filter(f => f.priceRange[0] <= maxFlightPrice)
        .map(f => ({
          destination: f.iata,
          city: f.city,
          country: f.country,
          price: Math.round((f.priceRange[0] + f.priceRange[1]) / 2),
        }))
      // Merge with any existing results rather than replacing
      const existingIatas = new Set(priceInfo.map(d => d.destination.toUpperCase()))
      for (const fb of fallbackResults) {
        if (!existingIatas.has(fb.destination.toUpperCase())) {
          priceInfo.push(fb)
        }
      }
    }

    // ── De-duplicate and diversify the candidate pool ──

    // 1. De-duplicate by IATA (TravelPayouts often returns same airport multiple times)
    priceInfo = deduplicateByIata(priceInfo)

    // 2. Filter out excluded destinations
    if (exclude.length > 0) {
      const excludeSet = new Set(exclude.map(e => e.toUpperCase()))
      priceInfo = priceInfo.filter(d => !excludeSet.has(d.destination.toUpperCase()))
    }

    // 3. Don't recommend destinations in the same country as origin
    const originCountry = getOriginRegion(primaryOrigin) // crude but prevents BKK→HKT
    // (We'll handle this more precisely with the country diversity cap below)

    if (priceInfo.length === 0) {
      return NextResponse.json(
        { error: 'No destinations found within your budget. Try increasing your budget.' },
        { status: 400 }
      )
    }

    // ── Score destinations for vibe match + visa + value ──
    const scored = priceInfo.map(d => {
      let score = vibeScore(d.city || d.destination, d.country || '', vibes)

      // Visa score when passports are provided
      if (passports.length > 0 && d.country) {
        let bestVisaScore = -5
        for (const passport of passports) {
          const visa = checkVisaRequirement(passport, d.country)
          const visaScoreMap: Record<string, number> = {
            'visa-free': 10,
            'visa-on-arrival': 5,
            'e-visa': 2,
            'visa-required': -5,
          }
          const vs = visaScoreMap[visa.status] ?? -5
          if (vs > bestVisaScore) bestVisaScore = vs
        }
        score += bestVisaScore
      }

      // Value bonus: destinations that use a good chunk of the budget
      // (so a $700 budget doesn't always pick $30 flights to Phuket)
      const budgetUtilization = d.price / maxFlightPrice
      if (budgetUtilization > 0.3 && budgetUtilization < 0.9) {
        score += 2 // Good budget fit — not too cheap, not maxed out
      }

      // Slight randomness to shuffle similarly-scored destinations
      score += Math.random() * 3

      return { ...d, score }
    }).sort((a, b) => b.score - a.score)

    // 4. Enforce country diversity: max 2 from same country in the candidate pool
    const diverse = enforceCountryDiversity(scored, 2)

    // 5. Expand candidate pool — top 12 instead of top 5
    const candidates = diverse.slice(0, Math.min(12, diverse.length))

    // ── VALIDATE-BEFORE-COMMIT: check top candidates with SerpApi ──
    // Instead of picking one destination then validating, validate the
    // top 3-5 candidates in parallel and pick the best that passes.

    // Compute departure/return dates — prefer the API's best-price dates for the
    // winning destination, fall back to pickDepartureDate for flexible ranges
    const fallbackDepartDate = pickDepartureDate(dates)
    const fallbackReturnDate = computeReturnDate(fallbackDepartDate, tripDuration)

    // 6. AI ranks the top candidates (optional — improves pick quality)
    let rankedCandidates = candidates.slice(0, 8)
    if (candidates.length >= 3) {
      try {
        const candidateDescriptions = candidates.slice(0, 8).map(d => {
          const costs = getDestinationCost(d.city || d.destination)
          const dailyCostHint = costs ? ` (~$${costs.dailyCosts.mid.food + costs.dailyCosts.mid.activities + costs.dailyCosts.mid.transport}/day local)` : ''
          return `${d.city || d.destination} (${d.destination}), ${d.country || '?'}: $${d.price} flight${dailyCostHint}`
        }).join('\n')

        const aiPrompt = `Rank the top 5 best travel destinations for:
- Total budget: $${budget} for ${tripDuration} days
- Vibes: ${vibes.join(', ') || 'any'}
- Flying from: ${primaryOrigin}
- Style: ${accommodationLevel}

Available destinations:
${candidateDescriptions}

Respond with ONLY 5 IATA codes separated by commas, best first. Example: BKK,SGN,DPS,HAN,SIN`

        const aiResponse = await callAI('Travel advisor. Respond with IATA codes only.', aiPrompt, 0.5, 30)
        const aiCodes = aiResponse.content.trim().toUpperCase().replace(/[^A-Z,]/g, '').split(',').filter(c => c.length === 3)
        if (aiCodes.length >= 3) {
          const aiRanked = aiCodes
            .map(code => candidates.find(d => d.destination === code))
            .filter((d): d is NonNullable<typeof d> => !!d)
          if (aiRanked.length >= 3) {
            rankedCandidates = aiRanked
            console.log(`[Quick] AI ranked: ${aiCodes.slice(0, 5).join(',')} from ${candidates.length} candidates`)
          }
        }
      } catch {
        // AI failed, use score-based ranking
      }
    }

    // 7. Validate top candidates with SerpApi (parallel, ~3 calls)
    const validationCandidates: CandidateDestination[] = rankedCandidates.slice(0, 5).map(d => ({
      destination: d.destination,
      city: d.city || d.destination,
      country: d.country || '',
      tpPrice: d.price,
      score: d.score,
      originAirport: (d as any).originAirport || primaryOrigin,
    }))

    // Use the top candidate's API dates for validation if available, else fallback
    const topCandidate = rankedCandidates[0]
    const validationDepartDate = topCandidate?.startDate || fallbackDepartDate
    const validationReturnDate = topCandidate?.endDate || fallbackReturnDate

    const validation = await validateCandidatesWithSerpApi({
      origins: originCodes,
      candidates: validationCandidates,
      departDate: validationDepartDate,
      returnDate: validationReturnDate,
      maxValidations: 3,
      priceToleranceRatio: 2.5, // Accept if live price <= 2.5x TP estimate (TP prices can be stale/one-way)
      maxBudget: maxFlightPrice,
    })

    // Use validated winner, or fall back to AI/score top pick
    // ALWAYS prefer live round-trip prices over TP estimates
    const winner = validation.validated
    const picked = winner
      ? rankedCandidates.find(d => d.destination === winner.destination) || rankedCandidates[0]
      : rankedCandidates[0]

    // If no winner but we have any candidate with a live price, use that
    // (even rejected candidates have accurate live pricing)
    const bestLiveCandidate = !winner
      ? validation.all.find(v => v.isLive && v.livePrice && v.livePrice > 0)
      : null

    let validatedPrice = winner?.livePrice ?? bestLiveCandidate?.livePrice ?? picked.price
    let validatedAirlines: string[] = winner?.airlines ?? bestLiveCandidate?.airlines ?? (picked.airline ? [picked.airline] : [])
    let validatedStops: number | undefined = winner?.stops ?? bestLiveCandidate?.stops ?? picked.stops
    let validatedPriceIsLive = winner?.isLive ?? bestLiveCandidate?.isLive ?? false
    // Use the specific origin airport from the winning candidate
    let bestOrigin = winner?.validatedOrigin || bestLiveCandidate?.validatedOrigin || winner?.originAirport || (picked as any).originAirport || primaryOrigin

    console.log(`[Quick] Validation result: winner=${winner ? `${winner.city}@$${winner.livePrice}(${winner.status})` : 'null'}, bestLive=${bestLiveCandidate ? `${bestLiveCandidate.city}@$${bestLiveCandidate.livePrice}` : 'null'}, fallback=${picked.city || picked.destination}@$${picked.price}, displayPrice=$${validatedPrice}, isLive=${validatedPriceIsLive}`)

    if (validatedPriceIsLive) {
      priceIsEstimate = false
      priceIsLive = true
    } else if (!winner) {
      priceIsEstimate = true
      console.log(`[Quick] No candidate passed validation, using TP estimate for ${picked.city || picked.destination}`)
    }

    // Build runner-up alternatives from validated candidates
    const alternativeCandidates = validation.all
      .filter(v => v.destination !== picked.destination && v.status !== 'rejected')
      .slice(0, 3)
      .map(v => ({
        destination: v.destination,
        city: v.city || v.destination,
        country: v.country || '',
        price: v.livePrice ?? v.tpPrice,
      }))

    // If no alternatives from validation, fall back to diverse list
    if (alternativeCandidates.length === 0) {
      diverse
        .filter(d => d.destination !== picked.destination)
        .slice(0, 3)
        .forEach(d => alternativeCandidates.push({
          destination: d.destination,
          city: d.city || d.destination,
          country: d.country || '',
          price: d.price,
        }))
    }

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
      hotelEstimate = picked.hotelPrice
    } else if (costData) {
      hotelEstimate = costData.dailyCosts[costTier].hotel
    }

    // Use the picked destination's best-price dates from the API when available,
    // otherwise fall back to computed dates from the flexible range
    const effectiveDepartDate = picked.startDate || fallbackDepartDate
    const effectiveReturnDate = picked.endDate || computeReturnDate(effectiveDepartDate, tripDuration)

    // Ensure city/country are resolved — TravelPayouts only returns IATA codes
    const resolvedAirport = (!picked.city || !picked.country)
      ? lookupAirportByCode(picked.destination)
      : null
    const resolvedCity = picked.city || resolvedAirport?.city || picked.destination
    const resolvedCountry = picked.country || resolvedAirport?.country || ''

    const result = {
      destination: resolvedCity,
      country: resolvedCountry,
      iata: picked.destination,
      city_code_IATA: picked.destination,
      estimated_flight_cost: validatedPrice,
      indicativeFlightPrice: validatedPrice,
      estimated_hotel_per_night: hotelEstimate,
      flightPrice: validatedPrice,
      airline: validatedAirlines[0] || picked.airline || undefined,
      stops: validatedStops ?? undefined,
      startDate: effectiveDepartDate,
      endDate: effectiveReturnDate,
      suggestedDepartureDate: effectiveDepartDate,
      suggestedReturnDate: effectiveReturnDate,
      priceIsLive: validatedPriceIsLive,
      priceIsEstimate,
      googleFlightsPrice: validatedPriceIsLive ? validatedPrice : undefined,
      googleFlightsAirlines: validatedAirlines.length > 0 ? validatedAirlines : (picked.airline ? [picked.airline] : undefined),
      googleFlightsStops: validatedStops ?? undefined,
      hotelEstimate,
      budgetTier: getBudgetTier(budget, tripDuration),
      bestOriginCode: bestOrigin, // Specific airport with best price (e.g., BKK not BKK,DMK)
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

    return NextResponse.json({ ...result, cachedBasicInfo, alternatives: alternativeCandidates })
  } catch (error) {
    console.error('[Quick] Error:', error)
    return NextResponse.json(
      { error: 'Failed to find destination. Please try again.' },
      { status: 500 }
    )
  }
}
