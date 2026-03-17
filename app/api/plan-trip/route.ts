import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface PlanTripRequest {
  destination: string
  destinationCode: string
  country: string
  origin: string
  budget: number
  tripDuration: number
  vibes: string[]
  accommodationLevel: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 8 requests per minute
    const clientIp = getClientIp(request)
    const rl = rateLimit(`plan-trip:${clientIp}`, 8, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: PlanTripRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const {
      destination,
      destinationCode,
      country,
      origin,
      budget,
      tripDuration = 5,
      vibes = [],
      accommodationLevel = 'mid-range',
    } = body

    if (!destination || !destinationCode || !origin || !budget) {
      return NextResponse.json(
        { error: 'Missing required parameters: destination, destinationCode, origin, budget' },
        { status: 400 }
      )
    }

    // Step 1: Try to get live flight price
    let flightPrice: number | null = null
    let flightSource = 'estimate'

    try {
      // Get a date ~3 weeks from now for pricing
      const departDate = new Date()
      departDate.setDate(departDate.getDate() + 21)
      const departStr = departDate.toISOString().split('T')[0]

      const returnDate = new Date(departDate)
      returnDate.setDate(returnDate.getDate() + tripDuration)
      const returnStr = returnDate.toISOString().split('T')[0]

      // Use internal flight search
      const flightUrl = new URL('/api/search/flights', request.url)
      flightUrl.searchParams.set('origin', origin)
      flightUrl.searchParams.set('destination', destinationCode)
      flightUrl.searchParams.set('departDate', departStr)
      flightUrl.searchParams.set('returnDate', returnStr)

      const flightRes = await fetch(flightUrl.toString(), {
        signal: AbortSignal.timeout(10000),
      })

      if (flightRes.ok) {
        const flightData = await flightRes.json()
        if (flightData.flight?.price) {
          flightPrice = flightData.flight.price
          flightSource = flightData.source || 'live'
        }
      }
    } catch (err) {
      console.warn('[Plan Trip] Flight price fetch failed, will use AI estimate:', err instanceof Error ? err.message : err)
    }

    // Step 2: Calculate budget allocation
    const accomMaxPerNight: Record<string, number> = {
      'budget': 40, 'mid-range': 100, 'comfort': 180,
    }
    const maxPerNight = accomMaxPerNight[accommodationLevel] || 100
    const estimatedHotelTotal = maxPerNight * tripDuration
    const estimatedFlight = flightPrice || Math.round(budget * 0.35)
    const remainingBudget = budget - estimatedFlight - estimatedHotelTotal
    const dailyActivities = Math.max(20, Math.floor(remainingBudget / tripDuration * 0.6))

    // Step 3: Generate AI trip plan
    const vibeText = vibes.length > 0 ? vibes.join(', ') : 'general exploration'

    const systemPrompt = `Expert travel planner for ${destination}, ${country}. Respond with valid JSON only.`

    const userPrompt = `Create a complete trip plan for ${destination}, ${country} (${destinationCode}).

Budget: $${budget} USD total for ${tripDuration} days
Origin: ${origin}
Travel style: ${accommodationLevel}
Vibes/interests: ${vibeText}
${flightPrice ? `Known flight price: ~$${flightPrice}` : `Estimated flight: ~$${estimatedFlight}`}
Max hotel: $${maxPerNight}/night
Daily activity budget: ~$${dailyActivities}

Return JSON:
{
  "whyThisPlace": "2-3 sentences about why ${destination} is great for ${vibeText}",
  "bestTimeToGo": "Best months to visit",
  "localTip": "One practical insider tip",
  "best_local_food": ["Dish1", "Dish2", "Dish3", "Dish4"],
  "budgetBreakdown": {
    "flights": ${flightPrice || estimatedFlight},
    "hotel": ${estimatedHotelTotal},
    "activities": N,
    "food": N,
    "total": N
  },
  "hotel_recommendations": [
    {"name": "...", "estimated_price_per_night": N, "neighborhood": "...", "why_recommended": "..."},
    {"name": "...", "estimated_price_per_night": N, "neighborhood": "...", "why_recommended": "..."}
  ],
  "daily_itinerary": [
    {"day": 1, "activities": [{"time": "9:00 AM", "activity": "...", "estimated_cost": N}, ...], "total_day_cost": N},
    ... for each of ${tripDuration} days
  ],
  "local_transportation": {
    "airport_to_city": "How to get from airport to city center + cost",
    "daily_transport": "Best way to get around",
    "estimated_daily_cost": N
  }
}

RULES:
- Keep total costs within $${budget} budget
- Be specific with restaurant names, landmarks, neighborhoods
- Include free activities and paid activities
- Activities should match the ${vibeText} interests`

    console.log(`[Plan Trip] Generating AI plan for ${destination} (${destinationCode})`)

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 3000)
    const result = parseAIJSON<any>(aiResponse.content)

    // Ensure backward compat
    if (!result.insider_tip) result.insider_tip = result.localTip
    if (!result.why_its_perfect) result.why_its_perfect = result.whyThisPlace

    // Build itinerary day arrays for display
    if (result.daily_itinerary && result.daily_itinerary.length > 0) {
      result.day1 = result.daily_itinerary[0]?.activities?.map((a: any) => `${a.time} — ${a.activity}`) || []
      result.day2 = result.daily_itinerary[1]?.activities?.map((a: any) => `${a.time} — ${a.activity}`) || []
      result.day3 = result.daily_itinerary[2]?.activities?.map((a: any) => `${a.time} — ${a.activity}`) || []
    }

    console.log(`[Plan Trip] AI plan generated for ${destination}`)

    return NextResponse.json({
      destination,
      country,
      iata: destinationCode,
      city_code_IATA: destinationCode,
      estimated_flight_cost: flightPrice || estimatedFlight,
      indicativeFlightPrice: flightPrice || estimatedFlight,
      estimated_hotel_per_night: maxPerNight,
      flightSource,
      priceIsLive: flightSource !== 'estimate',
      ...result,
    })
  } catch (error) {
    console.error('[Plan Trip] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate trip plan. Please try again.'
    return NextResponse.json({ error: clientMessage }, { status: statusCode })
  }
}
