import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { calculateBudgetAllocation, PackageComponents, formatAllocationForAI, getBudgetTier } from '@/lib/budget-allocation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface DetailsRequest {
  destination: string
  country: string
  iata: string
  origin: string
  budget: number
  vibes: string[]
  dates: string
  tripDuration?: number
  flightPrice: number
  accommodationLevel?: string
  budgetPriority?: string
  customSplit?: { flights: number; hotels: number; activities: number }
  packageComponents?: PackageComponents
  hotelEstimate?: number
}

interface DetailsResponse {
  whyThisPlace: string
  why_its_perfect: string
  itinerary: { day: number; activities: string[] }[]
  bestTimeToGo: string
  localTip: string
  insider_tip: string
  best_local_food: string[]
  day1: string[]
  day2: string[]
  day3: string[]
  budgetBreakdown: {
    flights: number
    hotel: number
    activities: number
    food: number
    total: number
  }
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
}

/** Fuzzy cache key — matches the main route format */
function buildFuzzyCacheKey(origin: string, budget: number, vibes: string[], dates: string, tripDuration: number, components: PackageComponents, accommodationLevel: string, budgetPriority: string): string {
  const bucketSize = Math.max(50, Math.round(budget * 0.15))
  const budgetBucket = Math.round(budget / bucketSize) * bucketSize
  const sortedVibes = vibes.map(v => v.toLowerCase().trim()).sort().join(',')
  // Note: exclude is empty for details since the destination is already picked
  return `mystery:${origin}:${budgetBucket}:${sortedVibes}:${dates}:${tripDuration}:${JSON.stringify(components)}::${accommodationLevel}:${budgetPriority}`
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute (AI calls are expensive)
    const clientIp = getClientIp(request)
    const rl = rateLimit(`ai-mystery-details:${clientIp}`, 10, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: DetailsRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const {
      destination,
      country,
      iata,
      origin,
      budget,
      vibes,
      dates,
      tripDuration = 3,
      flightPrice,
      hotelEstimate,
    } = body
    const accommodationLevel = body.accommodationLevel || 'mid-range'
    const budgetPriority = body.budgetPriority || 'balanced'
    const components: PackageComponents = body.packageComponents || {
      includeFlight: true,
      includeHotel: true,
      includeItinerary: true,
      includeTransportation: false,
    }

    // Validation
    if (!destination || !country || !iata || !origin || !budget || !vibes || vibes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Budget allocation — uses customSplit if provided, otherwise priority preset
    const allocation = calculateBudgetAllocation(budget, tripDuration, components, {
      budgetPriority,
      customSplit: body.customSplit,
    })
    const budgetTier = getBudgetTier(budget, tripDuration)

    const allocationText = formatAllocationForAI(allocation, tripDuration)

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
      optionalSections.push(`"hotel_recommendations": [{"name":"...","estimated_price_per_night":N,"neighborhood":"...","why_recommended":"..."},...]`)
    }
    if (components.includeItinerary) {
      optionalSections.push(`"daily_itinerary": [{"day":N,"activities":[{"time":"HH:MM AM","activity":"...","estimated_cost":N}],"total_day_cost":N},...]`)
    }
    if (components.includeTransportation) {
      optionalSections.push(`"local_transportation": {"airport_to_city":"...","daily_transport":"...","estimated_daily_cost":N}`)
    }

    // Build a focused prompt — destination is already known, no discovery needed
    const systemPrompt = `Travel expert for ${destination}, ${country}. Respond with valid JSON only.`

    const actualHotelPerNight = hotelEstimate || allocation.hotel_per_night

    const userPrompt = `Generate a detailed travel plan for ${destination}, ${country} (${iata}).

Budget: $${budget} USD, ${tripDuration} days, tier: ${budgetTier}
Allocation: ${allocationText}
Origin: ${origin} | Dates: ${dates}
Vibes: ${vibes.join(', ')} | Priority: ${budgetPriority} — ${priorityHint[budgetPriority] || priorityHint['balanced']}
Accommodation: ${accommodationLevel} (max $${accomMaxPerNight[accommodationLevel] || 120}/night)
Package: ${[components.includeFlight && 'Flight', components.includeHotel && 'Hotel', components.includeItinerary && 'Itinerary', components.includeTransportation && 'Transport'].filter(Boolean).join('+')}
Known: Flight ~$${flightPrice}, Hotel ~$${actualHotelPerNight}/night

RULES: daily activities<=$${Math.floor(allocation.activities / tripDuration)}, total<=$${budget}

Explain WHY ${destination} matches the "${vibes.join(', ')}" vibe. Return JSON:
{
  "whyThisPlace":"2-3 sentences why this destination is perfect for these vibes",
  "why_its_perfect":"same as whyThisPlace",
  "budgetBreakdown":{"flights":${flightPrice},"hotel":${actualHotelPerNight * tripDuration},"activities":N,"food":N,"total":N},
  "itinerary":[{"day":1,"activities":["...","...","..."]},...for each of ${tripDuration} days],
  "bestTimeToGo":"Month range","localTip":"One insider tip",
  "best_local_food":["Dish1","Dish2","Dish3"],"insider_tip":"same as localTip",
  ${optionalSections.length > 0 ? optionalSections.join(',\n  ') + ',' : ''}
  "budget_breakdown":{"flight":${flightPrice},"hotel_total":${actualHotelPerNight * tripDuration},"hotel_per_night":${actualHotelPerNight},"activities":${allocation.activities},"local_transport":${allocation.local_transport},"food_estimate":${allocation.food_estimate},"buffer":${allocation.buffer}}
}`

    console.log(`[Details] Generating AI content for ${destination} (${iata})`)

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 2500)
    const result = parseAIJSON<DetailsResponse>(aiResponse.content)

    // Ensure backward compat fields
    if (!result.why_its_perfect) result.why_its_perfect = result.whyThisPlace
    if (!result.whyThisPlace) result.whyThisPlace = result.why_its_perfect
    if (!result.insider_tip) result.insider_tip = result.localTip
    if (!result.localTip) result.localTip = result.insider_tip

    // Derive day1/day2/day3 from itinerary
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

    // Cache the full result (merge with quick data will happen client-side,
    // but we also cache under the fuzzy key for future full-cache hits)
    const cacheKey = buildFuzzyCacheKey(origin, budget, vibes, dates, tripDuration, components, accommodationLevel, budgetPriority)
    // Build a complete response that matches the main /api/ai-mystery format
    const fullResult = {
      destination,
      country,
      iata,
      city_code_IATA: iata,
      indicativeFlightPrice: flightPrice,
      estimated_flight_cost: flightPrice,
      estimated_hotel_per_night: actualHotelPerNight,
      priceIsLive: true,
      ...result,
    }
    setCache(cacheKey, fullResult, 60 * 60 * 1000)

    console.log(`[Details] AI content generated for ${destination}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Details] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate trip details. Please try again.'
    return NextResponse.json({ error: clientMessage }, { status: statusCode })
  }
}
