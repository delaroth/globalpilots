import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { MysteryResponseSchema } from '@/lib/ai-schemas'
import { getCached, setCache } from '@/lib/cache'
import { calculateBudgetAllocation, PackageComponents, formatAllocationForAI, getBudgetTier } from '@/lib/budget-allocation'
import { supabase } from '@/lib/supabase'
import { AFFILIATE_FLAGS } from '@/lib/affiliate'
import { searchKiwiInspiration } from '@/lib/kiwi'
import { findCheapestDestinations, vibeToInterest, daysToTravelDuration, dateToMonth } from '@/lib/flight-providers/serpapi-explore'
import { discoverCheapDestinations } from '@/lib/flight-engine'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

interface MysteryRequest {
  origin: string
  budget: number
  vibes: string[]
  dates: string
  tripDuration?: number
  packageComponents?: PackageComponents
  email?: string
  exclude?: string[]
  accommodationLevel?: string
  budgetPriority?: string
  customSplit?: { flights: number; hotels: number; activities: number }
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

interface MysteryResponse {
  destination: string
  country: string
  iata: string
  city_code_IATA: string
  indicativeFlightPrice: number
  estimated_flight_cost: number
  estimated_hotel_per_night: number
  whyThisPlace: string
  why_its_perfect: string
  budgetBreakdown: {
    flights: number
    hotel: number
    activities: number
    food: number
    total: number
  }
  itinerary: { day: number; activities: string[] }[]
  bestTimeToGo: string
  localTip: string
  priceIsEstimate?: boolean
  day1: string[]
  day2: string[]
  day3: string[]
  best_local_food: string[]
  insider_tip: string
  budget_breakdown?: {
    flight: number
    hotel_total: number
    hotel_per_night: number
    activities: number
    local_transport: number
    food_estimate: number
    buffer: number
  }
  hotel_recommendations?: { name: string; estimated_price_per_night: number; neighborhood: string; why_recommended: string }[]
  daily_itinerary?: { day: number; activities: { time: string; activity: string; estimated_cost: number }[]; total_day_cost: number }[]
  local_transportation?: { airport_to_city: string; daily_transport: string; estimated_daily_cost: number }
  suggestedDepartureDate?: string
  suggestedReturnDate?: string
  blog_post_slug?: string
  // Google Flights real-time pricing (from SerpApi)
  googleFlightsPrice?: number
  googleFlightsPriceLevel?: string
  googleFlightsTypicalRange?: [number, number]
  googleFlightsPriceHistory?: [number, number][]
  googleFlightsAirlines?: string[]
  googleFlightsStops?: number
  googleFlightsDuration?: string
  googleFlightsCarbonEmissions?: { thisFlightKg: number; typicalKg: number; differencePercent: number }
  googleFlightsAirlineLogos?: string[]
  priceIsLive?: boolean
}

// Hardcoded fallback destinations by region for thin-cache scenarios
const FALLBACK_DESTINATIONS: Record<string, { iata: string; city: string; country: string; priceRange: [number, number] }[]> = {
  'SE Asia': [
    { iata: 'HKT', city: 'Phuket', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'KBV', city: 'Krabi', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'USM', city: 'Ko Samui', country: 'Thailand', priceRange: [30, 80] },
    { iata: 'REP', city: 'Siem Reap', country: 'Cambodia', priceRange: [50, 120] },
    { iata: 'DPS', city: 'Bali', country: 'Indonesia', priceRange: [60, 150] },
    { iata: 'HAN', city: 'Hanoi', country: 'Vietnam', priceRange: [80, 180] },
    { iata: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', priceRange: [80, 180] },
    { iata: 'CMB', city: 'Colombo', country: 'Sri Lanka', priceRange: [100, 200] },
    { iata: 'NRT', city: 'Tokyo', country: 'Japan', priceRange: [180, 400] },
    { iata: 'ICN', city: 'Seoul', country: 'South Korea', priceRange: [180, 400] },
    { iata: 'SYD', city: 'Sydney', country: 'Australia', priceRange: [200, 450] },
    { iata: 'DXB', city: 'Dubai', country: 'UAE', priceRange: [200, 400] },
  ],
  'Middle East': [
    { iata: 'MCT', city: 'Muscat', country: 'Oman', priceRange: [60, 120] },
    { iata: 'AMM', city: 'Amman', country: 'Jordan', priceRange: [60, 120] },
    { iata: 'CAI', city: 'Cairo', country: 'Egypt', priceRange: [80, 150] },
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', priceRange: [120, 250] },
    { iata: 'ATH', city: 'Athens', country: 'Greece', priceRange: [120, 250] },
    { iata: 'MXP', city: 'Milan', country: 'Italy', priceRange: [150, 300] },
    { iata: 'BKK', city: 'Bangkok', country: 'Thailand', priceRange: [200, 400] },
    { iata: 'SIN', city: 'Singapore', country: 'Singapore', priceRange: [200, 400] },
    { iata: 'LHR', city: 'London', country: 'UK', priceRange: [250, 500] },
  ],
  'Europe': [
    { iata: 'PRG', city: 'Prague', country: 'Czech Republic', priceRange: [40, 100] },
    { iata: 'BUD', city: 'Budapest', country: 'Hungary', priceRange: [40, 100] },
    { iata: 'KRK', city: 'Krakow', country: 'Poland', priceRange: [40, 100] },
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', priceRange: [50, 120] },
    { iata: 'OPO', city: 'Porto', country: 'Portugal', priceRange: [50, 120] },
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', priceRange: [80, 200] },
    { iata: 'CAI', city: 'Cairo', country: 'Egypt', priceRange: [100, 250] },
    { iata: 'DXB', city: 'Dubai', country: 'UAE', priceRange: [150, 350] },
    { iata: 'BKK', city: 'Bangkok', country: 'Thailand', priceRange: [300, 600] },
    { iata: 'NRT', city: 'Tokyo', country: 'Japan', priceRange: [350, 650] },
  ],
  'North America': [
    { iata: 'CUN', city: 'Cancun', country: 'Mexico', priceRange: [100, 250] },
    { iata: 'SJO', city: 'San Jose', country: 'Costa Rica', priceRange: [150, 300] },
    { iata: 'BOG', city: 'Bogota', country: 'Colombia', priceRange: [150, 350] },
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', priceRange: [250, 500] },
    { iata: 'LHR', city: 'London', country: 'UK', priceRange: [300, 600] },
    { iata: 'NRT', city: 'Tokyo', country: 'Japan', priceRange: [400, 800] },
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
  return 'SE Asia' // default
}

// ── Fuzzy cache helpers ─────────────────────────────────────────

/** Canonical vibe keys sorted for comparison */
function normalizeVibes(vibes: string[]): string[] {
  return vibes.map(v => v.toLowerCase().trim()).sort()
}

/**
 * Build a fuzzy cache key that normalizes budget to ±15% buckets.
 * We store under a canonical key and also check nearby budget buckets on read.
 */
function buildFuzzyCacheKey(origin: string, budget: number, vibes: string[], dates: string, tripDuration: number, components: PackageComponents, exclude: string[], accommodationLevel: string, budgetPriority: string): string {
  // Bucket budget to nearest 15% band: round to nearest step of budget*0.15
  const bucketSize = Math.max(50, Math.round(budget * 0.15))
  const budgetBucket = Math.round(budget / bucketSize) * bucketSize
  const sortedVibes = normalizeVibes(vibes).join(',')
  return `mystery:${origin}:${budgetBucket}:${sortedVibes}:${dates}:${tripDuration}:${JSON.stringify(components)}:${exclude.sort().join(',')}:${accommodationLevel}:${budgetPriority}`
}

/**
 * Try to find a fuzzy cache hit: same origin, similar vibes, budget within ±15%
 * Returns the cached result or null.
 */
function getFuzzyCache(origin: string, budget: number, vibes: string[], dates: string, tripDuration: number, components: PackageComponents, exclude: string[], accommodationLevel: string, budgetPriority: string): MysteryResponse | null {
  // Try the exact bucket first
  const primaryKey = buildFuzzyCacheKey(origin, budget, vibes, dates, tripDuration, components, exclude, accommodationLevel, budgetPriority)
  const primary = getCached<MysteryResponse>(primaryKey)
  if (primary) return primary

  // Try adjacent budget buckets (±1 bucket)
  const bucketSize = Math.max(50, Math.round(budget * 0.15))
  for (const offset of [-bucketSize, bucketSize]) {
    const nearbyBudget = budget + offset
    if (nearbyBudget < 100) continue
    const nearbyKey = buildFuzzyCacheKey(origin, nearbyBudget, vibes, dates, tripDuration, components, exclude, accommodationLevel, budgetPriority)
    const nearby = getCached<MysteryResponse>(nearbyKey)
    if (nearby) return nearby
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute for this expensive AI endpoint
    const clientIp = getClientIp(request)
    const rl = await rateLimitAsync(`ai-mystery:${clientIp}`, 10, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: MysteryRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }
    const { origin, budget, vibes, dates, tripDuration = 3, packageComponents, email, exclude = [] } = body
    const accommodationLevel = body.accommodationLevel || 'mid-range'
    const budgetPriority = body.budgetPriority || 'balanced'

    if (!origin || !budget || !vibes || vibes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, budget, vibes' },
        { status: 400 }
      )
    }

    if (typeof budget !== 'number' || budget < 100 || budget > 50000) {
      return NextResponse.json(
        { error: 'Budget must be a number between 100 and 50000' },
        { status: 400 }
      )
    }

    // Accept multi-airport codes (BKK,DMK) — use primary for search
    if (!/^[A-Z]{3}(,[A-Z]{3})*$/.test(origin)) {
      return NextResponse.json(
        { error: 'origin must be a 3-letter IATA airport code' },
        { status: 400 }
      )
    }
    const primaryOrigin = origin.split(',')[0]

    const components: PackageComponents = packageComponents || {
      includeFlight: true,
      includeHotel: true,
      includeItinerary: true,
      includeTransportation: false,
    }

    const allocation = calculateBudgetAllocation(budget, tripDuration, components, {
      budgetPriority,
      customSplit: body.customSplit,
    })
    const budgetTier = getBudgetTier(budget, tripDuration)

    const allocationText = formatAllocationForAI(allocation, tripDuration)

    console.log('[AI-Mystery] Budget allocation:', allocationText)

    // ── Fuzzy cache check ────────────────────────────────────────
    const cached = getFuzzyCache(origin, budget, vibes, dates, tripDuration, components, exclude, accommodationLevel, budgetPriority)
    if (cached) {
      console.log('[AI-Mystery] Fuzzy cache hit')
      if (email) {
        await captureEmail(email, 'mystery').catch(err => console.error('[AI-Mystery] Email capture failed:', err))
      }
      return NextResponse.json(cached, {
        headers: { 'X-Cache-Hit': 'true' },
      })
    }

    let priceInfo: { destination: string; city?: string; country?: string; price: number; startDate?: string; endDate?: string; airline?: string; stops?: number }[] = []
    let priceIsEstimate = false
    let priceIsLive = false

    // Parse flexible date ranges
    const isFlexible = dates.startsWith('flexible:')
    const flexibleTimeframe = isFlexible ? dates.replace('flexible:', '') : null
    const flexibleRange = flexibleTimeframe ? calculateFlexibleDateRange(flexibleTimeframe) : null

    // ── Flight price fetching ────────────────────────────────────
    // PRIMARY: SerpApi Explore (1 call → 20-50 destinations with live prices, dates, airlines)
    // FALLBACK: Kiwi + TravelPayouts (if Explore returns empty / quota exhausted)
    const maxFlightPrice = allocation.flight

    // Derive Explore params from user inputs
    const exploreMonth = isFlexible
      ? dateToMonth(flexibleRange?.dateFrom)
      : dateToMonth(dates.split(' ')[0])
    const exploreDuration = daysToTravelDuration(tripDuration)
    const exploreInterest = vibeToInterest(vibes)

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
        console.log(`[AI-Mystery] Using ${discovered.source} results (${discovered.destinations.length} destinations)`)
        // SerpApi Explore returns live data; TravelPayouts is cached
        priceIsLive = discovered.source === 'serpapi-explore'
        priceInfo = discovered.destinations.map(d => ({
          destination: d.destination,
          city: d.city,
          country: d.country,
          price: d.price,
          startDate: d.startDate,
          endDate: d.endDate,
          airline: d.airline,
          stops: d.stops,
        }))
      }
    } catch (err) {
      console.error('[AI-Mystery] discoverCheapDestinations failed:', err instanceof Error ? err.message : err)
    }

    // FALLBACK: Kiwi + TravelPayouts if Explore returned nothing
    if (priceInfo.length === 0) {
      console.log('[AI-Mystery] Explore empty, falling back to Kiwi + TravelPayouts')

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
        : Promise.resolve([] as { destination: string; city?: string; country?: string; price: number }[])

      const tpPromise = tpEnabled
        ? fetch(`${API_BASE}/v2/prices/latest?origin=${primaryOrigin}&currency=usd&limit=30&token=${TOKEN}`, { next: { revalidate: 3600 } })
            .then(async res => {
              if (!res.ok) return []
              const data = await res.json()
              const destinations = data.data || []
              return destinations
                .filter((d: any) => d.value <= maxFlightPrice)
                .slice(0, 20)
                .map((d: any) => ({ destination: d.destination, price: d.value }))
                .sort((a: any, b: any) => a.price - b.price)
            })
        : Promise.resolve([] as { destination: string; city?: string; country?: string; price: number }[])

      const [kiwiResult, tpResult] = await Promise.allSettled([kiwiPromise, tpPromise])

      const kiwiData = kiwiResult.status === 'fulfilled' ? kiwiResult.value : []
      const tpData = tpResult.status === 'fulfilled' ? tpResult.value : []

      if (kiwiResult.status === 'rejected') {
        console.error('[AI-Mystery] Kiwi failed:', kiwiResult.reason)
      }
      if (tpResult.status === 'rejected') {
        console.error('[AI-Mystery] TravelPayouts failed:', tpResult.reason)
      }

      if (kiwiData.length > 0) {
        console.log(`[AI-Mystery] Using Kiwi results (${kiwiData.length} destinations)`)
        priceInfo = kiwiData
      } else if (tpData.length > 0) {
        console.log(`[AI-Mystery] Using TravelPayouts results (${tpData.length} destinations)`)
        priceInfo = tpData
      }
    }

    // Thin-cache fallback: use hardcoded destinations with estimated prices
    if (priceInfo.length < 5) {
      console.log('[AI-Mystery] Thin cache detected, using hardcoded fallback')
      priceIsEstimate = true
      priceIsLive = false
      const region = getOriginRegion(primaryOrigin)
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

    // Filter out excluded destinations (from re-roll)
    if (exclude.length > 0) {
      const excludeSet = new Set(exclude.map(e => e.toUpperCase()))
      priceInfo = priceInfo.filter(d => !excludeSet.has(d.destination.toUpperCase()))
      console.log(`[AI-Mystery] Excluded ${exclude.join(', ')}, ${priceInfo.length} destinations remaining`)
    }

    if (priceInfo.length === 0) {
      return NextResponse.json(
        { error: 'No destinations found within your budget. Try increasing your budget.' },
        { status: 400 }
      )
    }

    // ── Build AI prompt (optimized for ~30% fewer tokens) ────────
    const systemPrompt = `Travel expert. Respond with valid JSON only.`

    const notes: string[] = []
    if (priceIsLive) notes.push('Flight prices are LIVE from Google Flights. Destinations include best dates (startDate/endDate), airline, and stops — use these to suggest optimal departure/return dates.')
    if (priceIsEstimate) notes.push('Flight prices are estimates — flag with priceIsEstimate.')
    if (exclude.length > 0) notes.push(`Do NOT suggest: ${exclude.join(', ')}. Pick a DIFFERENT destination.`)
    if (flexibleRange) notes.push(`Flexible dates ${flexibleRange.dateFrom} to ${flexibleRange.dateTo}. Include suggestedDepartureDate and suggestedReturnDate (YYYY-MM-DD).`)

    const accomMaxPerNight: Record<string, number> = {
      'hostel': 30, 'budget': 60, 'mid-range': 120, 'upscale': 250, 'luxury': 500
    }

    const priorityHint: Record<string, string> = {
      'flights': 'Fly FURTHER to distant destinations.',
      'hotels': 'Closer is fine if hotel is great.',
      'activities': 'Pick destinations known for food/culture/tours.',
      'balanced': 'Balance distance, accommodation, experiences.',
    }

    // Only request optional sections the user selected
    const optionalSections: string[] = []
    if (components.includeHotel) {
      optionalSections.push(`"hotel_recommendations": [{"name":"Budget/mid-range hotel type + neighborhood","estimated_price_per_night":N,"neighborhood":"Area name","why_recommended":"Short reason"},...]`)
    }
    if (components.includeItinerary) {
      optionalSections.push(`"daily_itinerary": [{"day":N,"activities":[{"time":"HH:MM AM","activity":"Well-known landmark or activity type","estimated_cost":N}],"total_day_cost":N},...]`)
    }
    if (components.includeTransportation) {
      optionalSections.push(`"local_transportation": {"airport_to_city":"...","daily_transport":"...","estimated_daily_cost":N}`)
    }
    if (flexibleRange || priceIsLive) {
      optionalSections.push(`"suggestedDepartureDate": "YYYY-MM-DD", "suggestedReturnDate": "YYYY-MM-DD"`)
    }

    const userPrompt = `Budget: $${budget} USD, ${tripDuration} days, tier: ${budgetTier}
Allocation: ${allocationText}
Origin: ${origin} | Dates: ${isFlexible ? `Flexible (${flexibleTimeframe})` : dates}
Vibes: ${vibes.join(', ')} | Priority: ${budgetPriority} — ${priorityHint[budgetPriority] || priorityHint['balanced']}
Accommodation: ${accommodationLevel} (max $${accomMaxPerNight[accommodationLevel] || 120}/night)
Package: ${[components.includeFlight && 'Flight', components.includeHotel && 'Hotel', components.includeItinerary && 'Itinerary', components.includeTransportation && 'Transport'].filter(Boolean).join('+')}
Destinations: ${JSON.stringify(priceInfo)}
${notes.length > 0 ? notes.join('\n') : ''}
RULES: flight<=$${allocation.flight}, hotel/night<=$${allocation.hotel_per_night}, daily activities<=$${Math.floor(allocation.activities / tripDuration)}, total<=$${budget}
For activities use well-known landmarks/markets/temples — NOT invented places. For food use dish names not restaurant names. All costs are estimates.

Pick ONE destination matching vibes. Explain WHY it matches (not just "affordable"). Return JSON:
{
  "destination":"City","country":"Country","iata":"XXX","city_code_IATA":"XXX",
  "indicativeFlightPrice":N,"estimated_flight_cost":N,"estimated_hotel_per_night":N,
  "whyThisPlace":"2-3 sentences","why_its_perfect":"same",
  "budgetBreakdown":{"flights":N,"hotel":N,"activities":N,"food":N,"total":N},
  "itinerary":[{"day":1,"activities":["...","...","..."]},...for each day],
  "bestTimeToGo":"Month range","localTip":"One insider tip",
  "best_local_food":["Dish1","Dish2","Dish3"],"insider_tip":"same as localTip",
  ${optionalSections.length > 0 ? optionalSections.join(',\n  ') + ',' : ''}
  "budget_breakdown":{"flight":${allocation.flight},"hotel_total":${allocation.hotel_total},"hotel_per_night":${allocation.hotel_per_night},"activities":${allocation.activities},"local_transport":${allocation.local_transport},"food_estimate":${allocation.food_estimate},"buffer":${allocation.buffer}}
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 2500)
    const result = parseAIJSON(aiResponse.content, MysteryResponseSchema)

    // ── Apply live pricing from Explore data ────────────────────────
    if (priceIsLive) {
      // Explore data is already live from Google — no need for a 2nd SerpApi call
      const iata = result.iata || result.city_code_IATA
      const matchedExplore = priceInfo.find(d => d.destination === iata)
      if (matchedExplore) {
        result.googleFlightsPrice = matchedExplore.price
        result.googleFlightsAirlines = matchedExplore.airline ? [matchedExplore.airline] : undefined
        result.googleFlightsStops = matchedExplore.stops
        result.indicativeFlightPrice = matchedExplore.price
        result.estimated_flight_cost = matchedExplore.price
        if (matchedExplore.startDate) result.suggestedDepartureDate = matchedExplore.startDate
        if (matchedExplore.endDate) result.suggestedReturnDate = matchedExplore.endDate
      }
      result.priceIsLive = true
    }

    // Add priceIsEstimate flag
    if (priceIsEstimate) {
      result.priceIsEstimate = true
    }

    // Ensure backward compat fields exist
    if (!result.city_code_IATA) result.city_code_IATA = result.iata
    if (!result.iata) result.iata = result.city_code_IATA
    if (!result.estimated_flight_cost) result.estimated_flight_cost = result.indicativeFlightPrice
    if (!result.indicativeFlightPrice) result.indicativeFlightPrice = result.estimated_flight_cost
    if (!result.why_its_perfect) result.why_its_perfect = result.whyThisPlace
    if (!result.whyThisPlace) result.whyThisPlace = result.why_its_perfect
    if (!result.insider_tip) result.insider_tip = result.localTip
    if (!result.localTip) result.localTip = result.insider_tip

    // Derive day1/day2/day3 from itinerary if AI didn't provide them separately
    if (result.itinerary && result.itinerary.length > 0) {
      if (!result.day1 || result.day1.length === 0) {
        result.day1 = result.itinerary[0]?.activities || []
      }
      if (!result.day2 || result.day2.length === 0) {
        result.day2 = result.itinerary[1]?.activities || []
      }
      if (!result.day3 || result.day3.length === 0) {
        result.day3 = result.itinerary[2]?.activities || []
      }
    }

    // Capture email
    if (email) {
      await captureEmail(email, 'mystery').catch(err => console.error('[AI-Mystery] Email capture failed:', err))
    }

    // Trigger blog post generation in background
    generateBlogPost(result.city_code_IATA || result.iata, result.destination, result.country)
      .then(slug => {
        if (slug) console.log('[AI-Mystery] Blog post generated:', slug)
      })
      .catch(err => console.error('[AI-Mystery] Blog generation failed:', err))

    // Cache for 1 hour using fuzzy key
    const cacheKey = buildFuzzyCacheKey(origin, budget, vibes, dates, tripDuration, components, exclude, accommodationLevel, budgetPriority)
    setCache(cacheKey, result, 60 * 60 * 1000)

    return NextResponse.json(result, {
      headers: { 'X-Cache-Hit': 'false' },
    })
  } catch (error) {
    console.error('[AI-Mystery] Error:', error)
    // Don't leak internal error details to client
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate destination. Please try again.'
    return NextResponse.json(
      { error: clientMessage },
      { status: statusCode }
    )
  }
}

async function captureEmail(email: string, source: string): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('email_subscribers')
      .upsert({
        email,
        source,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
    if (error) console.error('[AI-Mystery] Email capture error:', error)
    else console.log('[AI-Mystery] Email captured:', email)
  } catch (err) {
    console.error('[AI-Mystery] Email capture exception:', err)
  }
}

async function generateBlogPost(destinationCode: string, destinationName: string, country: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationCode, destinationName, country })
    })
    if (response.ok) {
      const data = await response.json()
      return data.slug || null
    }
    return null
  } catch (err) {
    console.error('[AI-Mystery] Blog generation exception:', err)
    return null
  }
}
