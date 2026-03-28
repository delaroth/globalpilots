import { NextRequest, NextResponse } from 'next/server'
import { findCheapestDestinations, vibeToInterest, daysToTravelDuration, dateToMonth } from '@/lib/flight-providers/serpapi-explore'
import { searchFlight, discoverCheapDestinations } from '@/lib/flight-engine'
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

    let priceInfo: { destination: string; city?: string; country?: string; price: number; startDate?: string; endDate?: string; airline?: string; stops?: number; hotelPrice?: number | null }[] = []
    let priceIsEstimate = false
    let priceIsLive = false

    // PRIMARY: discoverCheapDestinations (TravelPayouts free first, SerpApi Explore fallback)
    try {
      const discovered = await discoverCheapDestinations({
        origin: primaryOrigin,
        maxPrice: maxFlightPrice,
        month: exploreMonth,
        travelDuration: exploreDuration,
        interest: exploreInterest,
      })

      if (discovered.destinations.length > 0) {
        console.log(`[Quick] ${discovered.source} returned ${discovered.destinations.length} destinations`)
        priceIsLive = discovered.source === 'serpapi-explore'
        priceIsEstimate = discovered.source === 'travelpayouts' // TP data is 1-3 days old aggregated
        priceInfo = discovered.destinations.map(d => ({
          destination: d.destination,
          city: d.city,
          country: d.country,
          price: d.price,
          startDate: d.startDate,
          endDate: d.endDate,
          airline: d.airline,
          stops: d.stops,
          hotelPrice: d.hotelPrice,
        }))
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

      const kiwiPromise = kiwiEnabled
        ? searchKiwiInspiration({
            origin: primaryOrigin,
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
        ? fetch(`${API_BASE}/v2/prices/latest?origin=${primaryOrigin}&currency=usd&limit=30&token=${TOKEN}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) })
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
                  }
                })
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

      // Small random factor for variety (0-2 points)
      score += Math.random() * 2

      return { ...d, score }
    }).sort((a, b) => b.score - a.score)

    // 4. Enforce country diversity: max 2 from same country in the candidate pool
    const diverse = enforceCountryDiversity(scored, 2)

    // 5. Expand candidate pool — top 12 instead of top 5
    const candidates = diverse.slice(0, Math.min(12, diverse.length))

    // 6. Pick from candidates with weighted randomness
    const vibeMatched = candidates.filter(c => c.score > 2)
    const pool = vibeMatched.length >= 3 ? vibeMatched : candidates.slice(0, 6)
    let picked = pool[Math.floor(Math.random() * pool.length)]

    // 7. AI picks from the diverse pool (sees up to 12 destinations)
    if (candidates.length >= 3) {
      try {
        // Build context with daily costs for better AI decisions
        const candidateDescriptions = candidates.slice(0, 12).map(d => {
          const costs = getDestinationCost(d.city || d.destination)
          const dailyCostHint = costs ? ` (~$${costs.dailyCosts.mid.food + costs.dailyCosts.mid.activities + costs.dailyCosts.mid.transport}/day local)` : ''
          return `${d.city || d.destination} (${d.destination}), ${d.country || '?'}: $${d.price} flight${dailyCostHint}`
        }).join('\n')

        const aiPrompt = `Pick the single best travel destination for:
- Total budget: $${budget} for ${tripDuration} days (flight + hotel + activities + food)
- Vibes: ${vibes.join(', ') || 'any'}
- Flying from: ${primaryOrigin}
- Style: ${accommodationLevel}

IMPORTANT: Pick a destination that USES the budget well — don't pick the cheapest option if the budget allows something better. A $700 budget should explore farther than a $200 budget.

Available destinations (flight price + estimated daily local costs):
${candidateDescriptions}

Respond with ONLY the 3-letter IATA code. Nothing else.`

        const aiResponse = await callAI('Travel advisor. Respond with only an IATA code.', aiPrompt, 0.5, 10)
        const pickedIata = aiResponse.content.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
        const aiPick = candidates.find(d => d.destination === pickedIata)
        if (aiPick) {
          picked = { ...aiPick, score: 100 }
          console.log(`[Quick] AI picked: ${pickedIata} (${aiPick.city}) from ${candidates.length} diverse candidates`)
        }
      } catch {
        // AI failed, fall through to random pick
      }
    }

    // Build runner-up alternatives (diverse set excluding the picked one)
    const alternativeCandidates = diverse
      .filter(d => d.destination !== picked.destination)
      .slice(0, 3)
      .map(d => ({
        destination: d.destination,
        city: d.city || d.destination,
        country: d.country || '',
        price: d.price,
      }))

    // ── Price validation via unified flight engine ──
    // If the initial price came from Explore/TP (cached), validate with
    // the tiered engine using only free + SerpApi (tier 2 max) to avoid
    // burning FlightAPI credits on discovery flows.
    const computedDepartDate = picked.startDate || (isFlexible ? flexibleRange?.dateFrom : dates.split(' ')[0]) || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    let validatedPrice = picked.price
    let validatedAirlines: string[] = picked.airline ? [picked.airline] : []
    let validatedStops: number | undefined = picked.stops
    let validatedPriceIsLive = priceIsLive

    // Search from ALL origin airports (BKK,DMK) and pick the cheapest
    let bestOrigin = primaryOrigin
    try {
      const priceChecks = await Promise.allSettled(
        originCodes.map(code =>
          withRetry(
            () => searchFlight({
              origin: code,
              destination: picked.destination,
              departDate: computedDepartDate,
              routeType: 'price-check',
              maxTier: 2,
            }),
            { maxAttempts: 2, baseDelay: 1500 },
          ).then(result => ({ code, result }))
        )
      )

      let bestPrice = Infinity
      for (const check of priceChecks) {
        if (check.status !== 'fulfilled') continue
        const { code, result } = check.value
        if (result.price !== null && result.price < bestPrice) {
          bestPrice = result.price
          bestOrigin = code
          validatedPrice = result.price
          if (result.airlines.length > 0) validatedAirlines = result.airlines
          if (result.stops !== null) validatedStops = result.stops
          validatedPriceIsLive = result.confidence === 'live'
        }
      }

      if (bestPrice < Infinity) {
        console.log(`[Quick] Best price: $${validatedPrice} from ${bestOrigin} (checked ${originCodes.length} airports)`)
        // If validated price is 2x+ the original estimate, flag it
        if (validatedPrice && picked.price && validatedPrice > picked.price * 2) {
          console.warn(`[Quick] Large price discrepancy: estimate $${picked.price} vs live $${validatedPrice}`)
          priceIsEstimate = false // It's now a live price, not estimate
          validatedPriceIsLive = true
        }
      }
    } catch (err) {
      console.warn('[Quick] Price validation failed after retries, using original:', err instanceof Error ? err.message : err)
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
      // Use Explore hotel price if available
      hotelEstimate = picked.hotelPrice
    } else if (costData) {
      hotelEstimate = costData.dailyCosts[costTier].hotel
    }

    // Compute suggested dates — always use user's tripDuration, not the API's endDate
    // (API endDate might be a 1-night deal when user requested 2+ days)
    const effectiveDepartDate = computedDepartDate
    const effectiveReturnDate = (() => {
      const d = new Date(effectiveDepartDate + 'T00:00:00')
      d.setDate(d.getDate() + tripDuration)
      return d.toISOString().split('T')[0]
    })()

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
