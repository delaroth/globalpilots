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

// Personalized response — only itinerary + hotels + transport
interface DetailsResponse {
  itinerary: { day: number; activities: string[] }[]
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
  day1: string[]
  day2: string[]
  day3: string[]
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

    const actualHotelPerNight = hotelEstimate || allocation.hotel_per_night

    const accomMaxPerNight: Record<string, number> = {
      'hostel': 30, 'budget': 60, 'mid-range': 120, 'upscale': 250, 'luxury': 500
    }
    const hotelBudget = accomMaxPerNight[accommodationLevel] || 120

    const dailyActivityBudget = Math.floor(allocation.activities / tripDuration)

    console.log(`[Details] Generating personalized AI content for ${destination} (${iata}) — 2 parallel calls`)

    // ── Call A: Itinerary (~800 tokens max) ──
    const itineraryPromise = (components.includeItinerary !== false)
      ? callAI(
          `Travel planner for ${destination}, ${country}. JSON only.`,
          `Generate a ${tripDuration}-day itinerary for ${destination}.
Budget: $${dailyActivityBudget}/day for activities. Style: ${vibes.join(', ')}.
Return JSON: {"daily_itinerary":[{"day":1,"activities":[{"time":"09:00 AM","activity":"...","estimated_cost":0}],"total_day_cost":0}],"itinerary":[{"day":1,"activities":["Activity 1","Activity 2","Activity 3"]}]}
Keep activity descriptions under 10 words each. ${tripDuration} days total. Daily costs must not exceed $${dailyActivityBudget}.`,
          0.9,
          800,
        ).then(res => {
          const parsed = parseAIJSON<{ daily_itinerary?: DetailsResponse['daily_itinerary']; itinerary?: DetailsResponse['itinerary'] }>(res.content)
          return parsed
        }).catch(err => {
          console.warn('[Details] Itinerary call failed:', err.message)
          return null
        })
      : Promise.resolve(null)

    // ── Call B: Hotels + Transport (~400 tokens max) ──
    const hotelsPromise = (components.includeHotel || components.includeTransportation)
      ? callAI(
          `Hotel advisor for ${destination}, ${country}. JSON only.`,
          `Recommend 3 ${accommodationLevel} hotels in ${destination} under $${hotelBudget}/night.
Also suggest airport-to-city transport.
Return JSON: {"hotel_recommendations":[{"name":"Hotel Name","estimated_price_per_night":0,"neighborhood":"Area","why_recommended":"Short reason"}],"local_transportation":{"airport_to_city":"How to get there","daily_transport":"Best way around","estimated_daily_cost":0}}`,
          0.9,
          400,
        ).then(res => {
          const parsed = parseAIJSON<{
            hotel_recommendations?: DetailsResponse['hotel_recommendations']
            local_transportation?: DetailsResponse['local_transportation']
          }>(res.content)
          return parsed
        }).catch(err => {
          console.warn('[Details] Hotels call failed:', err.message)
          return null
        })
      : Promise.resolve(null)

    // ── Run both in parallel ──
    const [itineraryResult, hotelsResult] = await Promise.allSettled([itineraryPromise, hotelsPromise])

    const itineraryData = itineraryResult.status === 'fulfilled' ? itineraryResult.value : null
    const hotelsData = hotelsResult.status === 'fulfilled' ? hotelsResult.value : null

    // Build the combined result
    const result: Partial<DetailsResponse> = {}

    // Itinerary data
    if (itineraryData) {
      result.daily_itinerary = itineraryData.daily_itinerary
      result.itinerary = itineraryData.itinerary

      // Derive day1/day2/day3 from itinerary for backward compat
      if (result.itinerary && result.itinerary.length > 0) {
        result.day1 = result.itinerary[0]?.activities || []
        result.day2 = result.itinerary[1]?.activities || []
        result.day3 = result.itinerary[2]?.activities || []
      }
    }

    // Hotels + transport data
    if (hotelsData) {
      if (components.includeHotel) {
        result.hotel_recommendations = hotelsData.hotel_recommendations
      }
      if (components.includeTransportation) {
        result.local_transportation = hotelsData.local_transportation
      }
    }

    // Budget breakdown — calculated in code, not AI-generated
    result.budgetBreakdown = {
      flights: flightPrice,
      hotel: actualHotelPerNight * tripDuration,
      activities: allocation.activities,
      food: allocation.food_estimate,
      total: flightPrice + (actualHotelPerNight * tripDuration) + allocation.activities + allocation.food_estimate,
    }

    result.budget_breakdown = {
      flight: flightPrice,
      hotel_total: actualHotelPerNight * tripDuration,
      hotel_per_night: actualHotelPerNight,
      activities: allocation.activities,
      local_transport: allocation.local_transport,
      food_estimate: allocation.food_estimate,
      buffer: allocation.buffer,
    }

    // Cache the full result (merge with quick data will happen client-side,
    // but we also cache under the fuzzy key for future full-cache hits)
    const cacheKey = buildFuzzyCacheKey(origin, budget, vibes, dates, tripDuration, components, accommodationLevel, budgetPriority)
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

    console.log(`[Details] Personalized AI content generated for ${destination} (itinerary: ${itineraryData ? 'ok' : 'failed'}, hotels: ${hotelsData ? 'ok' : 'failed'})`)

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
