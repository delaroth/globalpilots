import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { calculateBudgetAllocation, PackageComponents, formatAllocationForAI, getBudgetTier } from '@/lib/budget-allocation'
import { supabase } from '@/lib/supabase'
import { AFFILIATE_FLAGS } from '@/lib/affiliate'
import { searchKiwiInspiration } from '@/lib/kiwi'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

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

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute for this expensive AI endpoint
    const clientIp = getClientIp(request)
    const rl = rateLimit(`ai-mystery:${clientIp}`, 10, 60 * 1000)
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

    if (!/^[A-Z]{3}$/.test(origin)) {
      return NextResponse.json(
        { error: 'origin must be a 3-letter IATA airport code' },
        { status: 400 }
      )
    }

    const components: PackageComponents = packageComponents || {
      includeFlight: true,
      includeHotel: true,
      includeItinerary: true,
      includeTransportation: false,
    }

    const allocation = calculateBudgetAllocation(budget, tripDuration, components)
    const budgetTier = getBudgetTier(budget, tripDuration)
    const allocationText = formatAllocationForAI(allocation, tripDuration)

    console.log('[AI-Mystery] Budget allocation:', allocationText)

    // Check cache (include exclude list to avoid serving cached excluded destinations)
    const cacheKey = `mystery:${origin}:${budget}:${vibes.join(',')}:${dates}:${tripDuration}:${JSON.stringify(components)}:${exclude.sort().join(',')}`
    const cached = getCached<MysteryResponse>(cacheKey)
    if (cached) {
      console.log('[AI-Mystery] Cache hit')
      if (email) {
        await captureEmail(email, 'mystery').catch(err => console.error('[AI-Mystery] Email capture failed:', err))
      }
      return NextResponse.json(cached)
    }

    let priceInfo: { destination: string; city?: string; country?: string; price: number }[] = []
    let priceIsEstimate = false

    // Parse flexible date ranges
    const isFlexible = dates.startsWith('flexible:')
    const flexibleTimeframe = isFlexible ? dates.replace('flexible:', '') : null
    const flexibleRange = flexibleTimeframe ? calculateFlexibleDateRange(flexibleTimeframe) : null

    // Try Kiwi first if enabled
    if (AFFILIATE_FLAGS.kiwi && process.env.KIWI_API_KEY) {
      try {
        console.log('[AI-Mystery] Using Kiwi inspiration search')
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

        const kiwiResults = await searchKiwiInspiration({
          origin,
          dateFrom: kiwiDateFrom,
          dateTo: kiwiDateTo,
          maxPrice: Math.floor(budget * 0.45),
        })

        priceInfo = kiwiResults.map(r => ({
          destination: r.flyTo,
          city: r.cityTo,
          country: r.countryTo?.name,
          price: r.price,
        }))
      } catch (err) {
        console.error('[AI-Mystery] Kiwi failed, falling back to TravelPayouts:', err)
      }
    }

    // TravelPayouts fallback
    if (priceInfo.length === 0 && TOKEN) {
      try {
        const pricesUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&currency=usd&limit=30&token=${TOKEN}`
        const pricesResponse = await fetch(pricesUrl, { next: { revalidate: 3600 } })

        if (pricesResponse.ok) {
          const pricesData = await pricesResponse.json()
          const destinations = pricesData.data || []

          // Apply budget filter: flight ≤ 45% of total budget
          const maxFlightPrice = budget * 0.45
          priceInfo = destinations
            .filter((d: any) => d.value <= maxFlightPrice)
            .slice(0, 20)
            .map((d: any) => ({
              destination: d.destination,
              price: d.value,
            }))
            .sort((a: any, b: any) => a.price - b.price)
        }
      } catch (err) {
        console.error('[AI-Mystery] TravelPayouts failed:', err)
      }
    }

    // Thin-cache fallback: use hardcoded destinations with estimated prices
    if (priceInfo.length < 5) {
      console.log('[AI-Mystery] Thin cache detected, using hardcoded fallback')
      priceIsEstimate = true
      const region = getOriginRegion(origin)
      const fallbacks = FALLBACK_DESTINATIONS[region] || FALLBACK_DESTINATIONS['SE Asia']
      const maxFlightPrice = budget * 0.45

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

    // Build AI prompt
    const systemPrompt = `You are a travel expert specializing in budget-conscious mystery vacation planning. You MUST respond with valid JSON only, no additional text.`

    const estimateNote = priceIsEstimate
      ? '\nIMPORTANT: The flight prices below are estimated ranges, not live data. Pick the best destination for the user\'s vibes and flag the price as an estimate.'
      : ''

    const excludeNote = exclude.length > 0
      ? `\nDo NOT suggest these destinations (already shown to user): ${exclude.join(', ')}. Pick a DIFFERENT destination.`
      : ''

    const flexibleDateNote = flexibleRange
      ? `\nThe user has flexible dates within the range ${flexibleRange.dateFrom} to ${flexibleRange.dateTo} (timeframe: ${flexibleTimeframe}). Suggest the optimal departure and return dates within this range for the destination you pick, considering weather, events, and best value. Include "suggestedDepartureDate" and "suggestedReturnDate" (YYYY-MM-DD format) in your response.`
      : ''

    const userPrompt = `Given:
- Total Budget: ${budget} USD for ${tripDuration} days
- Budget Tier: ${budgetTier}
- Budget Allocation: ${allocationText}
- Departing from: ${origin}
- Travel dates: ${isFlexible ? `Flexible (${flexibleTimeframe}), range: ${flexibleRange?.dateFrom} to ${flexibleRange?.dateTo}` : dates}
- Vibes: ${vibes.join(', ')}
- Package includes: ${components.includeFlight ? 'Flight' : ''} ${components.includeHotel ? 'Hotel' : ''} ${components.includeItinerary ? 'Itinerary' : ''} ${components.includeTransportation ? 'Transport' : ''}
- Available destinations with flight prices: ${JSON.stringify(priceInfo)}${estimateNote}${excludeNote}${flexibleDateNote}

CRITICAL BUDGET RULES:
1. Flight cost MUST be <= $${allocation.flight}
2. Hotel per night MUST be <= $${allocation.hotel_per_night}
3. Daily activities MUST fit within $${Math.floor(allocation.activities / tripDuration)} per day
4. NEVER exceed the total budget of $${budget}

Select ONE destination that matches the vibes perfectly. Explain WHY it matches the specific vibes, not just "it's affordable".

Return this EXACT JSON structure:
{
  "destination": "City name",
  "country": "Country name",
  "iata": "3-letter IATA code",
  "city_code_IATA": "same IATA code",
  "indicativeFlightPrice": flight price from list,
  "estimated_flight_cost": same flight price,
  "estimated_hotel_per_night": realistic hotel price,
  "whyThisPlace": "2-3 sentences about why this destination matches their vibes specifically",
  "why_its_perfect": "same explanation",
  "budgetBreakdown": {
    "flights": flight cost,
    "hotel": total hotel cost for ${tripDuration} nights,
    "activities": activity budget,
    "food": food budget,
    "total": total of all above
  },
  "itinerary": [
    { "day": 1, "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "day": 2, "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "day": 3, "activities": ["Activity 1", "Activity 2", "Activity 3"] }
  ],
  "bestTimeToGo": "Month range",
  "localTip": "One insider tip",
  "day1": ["Activity 1", "Activity 2", "Activity 3"],
  "day2": ["Activity 1", "Activity 2", "Activity 3"],
  "day3": ["Activity 1", "Activity 2", "Activity 3"],
  "best_local_food": ["Dish 1", "Dish 2", "Dish 3"],
  "insider_tip": "Same insider tip",
  ${components.includeHotel ? `"hotel_recommendations": [
    { "name": "Hotel name", "estimated_price_per_night": price, "neighborhood": "Area", "why_recommended": "Why" },
    { "name": "Hotel 2", "estimated_price_per_night": price, "neighborhood": "Area", "why_recommended": "Why" }
  ],` : ''}
  ${components.includeItinerary ? `"daily_itinerary": [
    { "day": 1, "activities": [{ "time": "9:00 AM", "activity": "Activity", "estimated_cost": cost }, { "time": "1:00 PM", "activity": "Activity", "estimated_cost": cost }, { "time": "6:00 PM", "activity": "Activity", "estimated_cost": cost }], "total_day_cost": sum },
    { "day": 2, "activities": [{ "time": "9:00 AM", "activity": "Activity", "estimated_cost": cost }, { "time": "1:00 PM", "activity": "Activity", "estimated_cost": cost }, { "time": "6:00 PM", "activity": "Activity", "estimated_cost": cost }], "total_day_cost": sum },
    { "day": 3, "activities": [{ "time": "9:00 AM", "activity": "Activity", "estimated_cost": cost }, { "time": "1:00 PM", "activity": "Activity", "estimated_cost": cost }, { "time": "6:00 PM", "activity": "Activity", "estimated_cost": cost }], "total_day_cost": sum }
  ],` : ''}
  ${components.includeTransportation ? `"local_transportation": { "airport_to_city": "Method and cost", "daily_transport": "Recommended method", "estimated_daily_cost": cost },` : ''}
  ${flexibleRange ? `"suggestedDepartureDate": "YYYY-MM-DD within the flexible range",
  "suggestedReturnDate": "YYYY-MM-DD within the flexible range",` : ''}
  "budget_breakdown": {
    "flight": ${allocation.flight},
    "hotel_total": ${allocation.hotel_total},
    "hotel_per_night": ${allocation.hotel_per_night},
    "activities": ${allocation.activities},
    "local_transport": ${allocation.local_transport},
    "food_estimate": ${allocation.food_estimate},
    "buffer": ${allocation.buffer}
  }
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 2500)
    const result = parseAIJSON<MysteryResponse>(aiResponse.content)

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

    // Cache for 1 hour
    setCache(cacheKey, result, 60 * 60 * 1000)

    return NextResponse.json(result)
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
