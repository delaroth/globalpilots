import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { calculateBudgetAllocation, PackageComponents, formatAllocationForAI, getBudgetTier } from '@/lib/budget-allocation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { searchHotels } from '@/lib/flight-providers/serpapi-hotels'

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
    user_budget: number
    estimated_total?: number
    over_budget: boolean
  }
  hotel_recommendations?: HotelRec[]
  daily_itinerary?: { day: number; activities: { time: string; activity: string; estimated_cost: number }[]; total_day_cost: number }[]
  local_transportation?: { airport_to_city: string; daily_transport: string; estimated_daily_cost: number }
  day1: string[]
  day2: string[]
  day3: string[]
}

interface HotelRec {
  name: string
  estimated_price_per_night: number
  neighborhood: string
  why_recommended: string
  link?: string
  rating?: number
  reviews?: number
  type?: string
  is_real_data?: boolean
}

/** Fuzzy cache key — matches the main route format */
function buildFuzzyCacheKey(origin: string, budget: number, vibes: string[], dates: string, tripDuration: number, components: PackageComponents, accommodationLevel: string, budgetPriority: string): string {
  const bucketSize = Math.max(50, Math.round(budget * 0.15))
  const budgetBucket = Math.round(budget / bucketSize) * bucketSize
  const sortedVibes = vibes.map(v => v.toLowerCase().trim()).sort().join(',')
  // Note: exclude is empty for details since the destination is already picked
  return `mystery:${origin}:${budgetBucket}:${sortedVibes}:${dates}:${tripDuration}:${JSON.stringify(components)}::${accommodationLevel}:${budgetPriority}`
}

/** Extract departure date from the dates string, or default to 14 days from now */
function extractDepartDate(dates: string): string {
  if (dates.startsWith('flexible:')) {
    // Flexible mode: use 14 days from now as the check-in
    const d = new Date(Date.now() + 14 * 86400000)
    return d.toISOString().split('T')[0]
  }
  // Specific date: extract YYYY-MM-DD from start of string
  const match = dates.match(/^\d{4}-\d{2}-\d{2}/)
  if (match) return match[0]
  // Fallback
  const d = new Date(Date.now() + 14 * 86400000)
  return d.toISOString().split('T')[0]
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

    const accomMaxPerNight: Record<string, number> = {
      'hostel': 30, 'budget': 60, 'mid-range': 120, 'upscale': 250, 'luxury': 500
    }
    const maxHotelBudget = accomMaxPerNight[accommodationLevel] || 120
    // For hotel SEARCH, use a reasonable minimum so we find results
    // even on tight budgets ($10 dorm beds exist in SE Asia)
    const hotelSearchMaxPrice = Math.max(10, Math.min(maxHotelBudget, allocation.hotel_per_night * 2 || maxHotelBudget))

    const dailyActivityBudget = Math.floor(allocation.activities / tripDuration)

    // Extract dates for hotel search
    const checkIn = extractDepartDate(dates)
    const checkOutDate = new Date(new Date(checkIn).getTime() + tripDuration * 86400000)
    const checkOut = checkOutDate.toISOString().split('T')[0]

    console.log(`[Details] Generating content for ${destination} (${iata}) — itinerary AI + real hotel search + transport AI`)

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

    // ── Call B: REAL hotel search via SerpApi (replaces AI hallucinations) ──
    const hotelsPromise = components.includeHotel
      ? searchHotels({
          destination: `${destination}, ${country}`,
          checkIn,
          checkOut,
          adults: 1,
          maxPrice: hotelSearchMaxPrice,
          currency: 'USD',
        }).then(result => {
          if (result.hotels.length > 0) {
            console.log(`[Details] SerpApi Hotels: ${result.hotels.length} real hotels found, cheapest $${result.cheapestPrice}/night`)
            // Take top 3 by price (already sorted by lowest price)
            return result.hotels.slice(0, 3).map(h => ({
              name: h.name,
              estimated_price_per_night: h.price,
              neighborhood: h.neighborhood || '',
              why_recommended: [
                h.rating > 0 ? `${h.rating}/5 rating` : '',
                h.reviews > 0 ? `(${h.reviews.toLocaleString()} reviews)` : '',
                h.type !== 'Hotel' ? h.type : '',
                h.amenities.slice(0, 3).join(', '),
              ].filter(Boolean).join(' · ') || 'Good value option',
              link: h.link || '',
              rating: h.rating,
              reviews: h.reviews,
              type: h.type,
              is_real_data: true,
            }))
          }
          console.log('[Details] SerpApi Hotels: no results, falling back to AI')
          return null
        }).catch(err => {
          console.warn('[Details] SerpApi Hotels failed, falling back to AI:', err.message)
          return null
        })
      : Promise.resolve(null)

    // ── Call C: Transport only (~200 tokens max) ──
    const transportPromise = components.includeTransportation
      ? callAI(
          `Transport advisor for ${destination}, ${country}. JSON only.`,
          `Suggest airport-to-city transport for ${destination}.
Return JSON: {"local_transportation":{"airport_to_city":"How to get there","daily_transport":"Best way around","estimated_daily_cost":0}}`,
          0.9,
          200,
        ).then(res => {
          const parsed = parseAIJSON<{ local_transportation?: DetailsResponse['local_transportation'] }>(res.content)
          return parsed?.local_transportation || null
        }).catch(err => {
          console.warn('[Details] Transport call failed:', err.message)
          return null
        })
      : Promise.resolve(null)

    // ── Run all in parallel ──
    const [itineraryResult, hotelsResult, transportResult] = await Promise.allSettled([
      itineraryPromise,
      hotelsPromise,
      transportPromise,
    ])

    const itineraryData = itineraryResult.status === 'fulfilled' ? itineraryResult.value : null
    const realHotels = hotelsResult.status === 'fulfilled' ? hotelsResult.value : null
    const transportData = transportResult.status === 'fulfilled' ? transportResult.value : null

    // If SerpApi returned no hotels, fall back to AI hotel recommendations
    let hotelRecommendations: HotelRec[] | null = realHotels
    if (!hotelRecommendations && components.includeHotel) {
      console.log('[Details] Falling back to AI hotels')
      try {
        const aiHotels = await callAI(
          `Hotel advisor for ${destination}, ${country}. JSON only.`,
          `Recommend 3 ${accommodationLevel} hotels in ${destination} under $${hotelSearchMaxPrice}/night.
Return JSON: {"hotel_recommendations":[{"name":"Hotel Name","estimated_price_per_night":0,"neighborhood":"Area","why_recommended":"Short reason"}]}`,
          0.9,
          300,
        )
        const parsed = parseAIJSON<{ hotel_recommendations?: DetailsResponse['hotel_recommendations'] }>(aiHotels.content)
        hotelRecommendations = parsed?.hotel_recommendations?.map(h => ({ ...h, is_real_data: false })) || null
      } catch (err) {
        console.warn('[Details] AI hotels fallback also failed:', err instanceof Error ? err.message : err)
      }
    }

    // Build the combined result
    const result: Partial<DetailsResponse> & Record<string, unknown> = {}

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

    // Hotels
    if (hotelRecommendations) {
      result.hotel_recommendations = hotelRecommendations
    }

    // Transport
    if (transportData) {
      result.local_transportation = transportData
    }

    // Real hotel price (from SerpApi or quick route estimate) — for display in recommendations
    const realAvgHotelPerNight = realHotels && realHotels.length > 0
      ? Math.round(realHotels.reduce((sum, h) => sum + h.estimated_price_per_night, 0) / realHotels.length)
      : null

    // For the BUDGET breakdown, use the allocation (what the user can afford)
    // For estimated REAL cost, use the real/estimated prices
    const budgetHotelPerNight = allocation.hotel_per_night
    const realHotelPerNight = realAvgHotelPerNight || hotelEstimate || allocation.hotel_per_night

    // Estimated real cost vs user's budget
    const estimatedTotal = flightPrice + (realHotelPerNight * tripDuration) + allocation.activities + allocation.food_estimate + allocation.local_transport + allocation.buffer
    const overBudget = estimatedTotal > budget

    // Budget breakdown — uses ALLOCATION amounts (what fits in the budget)
    result.budgetBreakdown = {
      flights: flightPrice,
      hotel: budgetHotelPerNight * tripDuration,
      activities: allocation.activities,
      food: allocation.food_estimate,
      total: budget,
    }

    result.budget_breakdown = {
      flight: flightPrice,
      hotel_total: budgetHotelPerNight * tripDuration,
      hotel_per_night: budgetHotelPerNight,
      activities: allocation.activities,
      local_transport: allocation.local_transport,
      food_estimate: allocation.food_estimate,
      buffer: allocation.buffer,
      user_budget: budget,
      estimated_total: overBudget ? estimatedTotal : undefined,
      over_budget: overBudget,
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
      estimated_hotel_per_night: budgetHotelPerNight,
      priceIsLive: true,
      ...result,
    }
    setCache(cacheKey, fullResult, 60 * 60 * 1000)

    const hotelSource = realHotels ? 'serpapi-real' : 'ai-fallback'
    console.log(`[Details] Content generated for ${destination} (itinerary: ${itineraryData ? 'ok' : 'failed'}, hotels: ${hotelSource}, transport: ${transportData ? 'ok' : 'skipped'})${overBudget ? ` [OVER BUDGET: $${estimatedTotal} vs $${budget}]` : ''}`)

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
