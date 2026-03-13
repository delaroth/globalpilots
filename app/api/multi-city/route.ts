import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { buildFlightLink } from '@/lib/affiliate'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface MultiCityRequest {
  origin: string
  totalBudget: number
  totalDays: number
  numCities: number
  region?: string
  vibe?: string[]
  departureDate?: string
  departureTimeframe?: string
  accommodationLevel?: string
  budgetPriority?: string
}

interface CityStop {
  code: string
  name: string
  country: string
  days: number
  estimatedFlightCost: number
  estimatedDailyCost: number
  highlights: string[]
}

interface MultiCityResponse {
  cities: CityStop[]
  totalEstimatedCost: number
  route: string
  bookingLinks: { from: string; to: string; label: string; url: string }[]
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute for this expensive AI endpoint
    const clientIp = getClientIp(request)
    const rl = rateLimit(`multi-city:${clientIp}`, 10, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: MultiCityRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }
    const { origin, totalBudget, totalDays, numCities, region, vibe, departureDate, departureTimeframe } = body
    const accommodationLevel = body.accommodationLevel || 'mid-range'
    const budgetPriority = body.budgetPriority || 'balanced'

    // Validation
    if (!origin || !totalBudget || !totalDays || !numCities) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, totalBudget, totalDays, numCities' },
        { status: 400 }
      )
    }

    if (!/^[A-Z]{3}$/.test(origin)) {
      return NextResponse.json(
        { error: 'origin must be a 3-letter IATA airport code' },
        { status: 400 }
      )
    }

    if (numCities < 2 || numCities > 10) {
      return NextResponse.json(
        { error: 'numCities must be between 2 and 10' },
        { status: 400 }
      )
    }

    if (totalDays < 5 || totalDays > 365) {
      return NextResponse.json(
        { error: 'totalDays must be between 5 and 365' },
        { status: 400 }
      )
    }

    if (totalBudget < 200) {
      return NextResponse.json(
        { error: 'Budget must be at least $200 for a multi-city trip' },
        { status: 400 }
      )
    }

    // Check cache (1 hour TTL)
    const cacheKey = `multi-city:${origin}:${totalBudget}:${totalDays}:${numCities}:${region || 'any'}:${(vibe || []).sort().join(',')}:${departureDate || ''}:${departureTimeframe || ''}:${accommodationLevel}:${budgetPriority}`
    const cached = getCached<MultiCityResponse>(cacheKey)
    if (cached) {
      console.log('[Multi-City] Cache hit')
      return NextResponse.json(cached)
    }

    // Build AI prompts
    const systemPrompt = `You are an expert multi-city travel planner. You specialize in creating optimized multi-stop itineraries that minimize backtracking, maximize value for money, and create diverse travel experiences. You MUST respond with valid JSON only, no additional text or markdown.`

    const vibeText = vibe && vibe.length > 0 ? vibe.join(', ') : 'any'
    const regionText = region && region !== 'Any' ? region : 'anywhere in the world'

    // Build departure timing context for the AI
    let departureTiming = ''
    if (departureDate) {
      departureTiming = `The traveler wants to depart on exactly ${departureDate}. Plan the trip starting on this date.`
    } else if (departureTimeframe) {
      const timeframeDescriptions: Record<string, string> = {
        'this-month': 'within the current month',
        'next-month': 'sometime next month',
        'next-3-months': 'within the next 3 months',
        'next-6-months': 'within the next 6 months',
        'anytime': 'anytime this year (flexible on timing)',
      }
      departureTiming = `The traveler is flexible and wants to depart ${timeframeDescriptions[departureTimeframe] || 'within the next 3 months'}. Suggest the best time to depart within this window considering weather, festivals, and flight prices.`
    }

    // Travel pace guidance based on trip length
    const avgDaysPerCity = Math.round(totalDays / numCities)
    let paceGuidance = ''
    if (totalDays > 90) {
      paceGuidance = `
- This is an EXTENDED trip (${totalDays} days). Plan for slow-travel/digital nomad style.
- Minimum ${Math.max(5, avgDaysPerCity - 5)} days per city — longer stays are better.
- Budget allocation: approximately 25% for all flights, 75% for daily costs (factor in monthly accommodation discounts).
- Focus on livability: coworking spaces, local neighborhoods, weekly markets.
- estimatedDailyCost should reflect long-stay discounts (30-40% cheaper than short stays).`
    } else if (totalDays > 30) {
      paceGuidance = `
- This is a LONG trip (${totalDays} days). Plan for relaxed travel, not rushed.
- Minimum 3-5 days per city.
- Budget allocation: approximately 30% for all flights, 70% for daily costs (factor in weekly accommodation discounts).
- estimatedDailyCost should reflect medium-stay discounts (15-25% cheaper than short stays).`
    } else {
      paceGuidance = `
- Minimum 2 days per city.
- Budget allocation: approximately 40% for all flights, 60% for daily costs.`
    }

    // Accommodation constraint
    const accomMaxPerNight: Record<string, number> = {
      'hostel': 30, 'budget': 60, 'mid-range': 120, 'upscale': 250, 'luxury': 500
    }
    const accomDescriptions: Record<string, string> = {
      'hostel': 'hostels, guesthouses, or very budget accommodation ($10-30/night)',
      'budget': 'budget hotels or Airbnbs ($30-60/night)',
      'mid-range': 'comfortable mid-range hotels ($60-120/night)',
      'upscale': 'upscale hotels with good amenities ($120-250/night)',
      'luxury': 'luxury or boutique hotels ($250+/night)',
    }

    // Budget split from priority
    const prioritySplits: Record<string, { flights: number; hotels: number; activities: number }> = {
      'flights': { flights: 50, hotels: 25, activities: 25 },
      'balanced': { flights: 35, hotels: 35, activities: 30 },
      'hotels': { flights: 20, hotels: 50, activities: 30 },
      'activities': { flights: 25, hotels: 25, activities: 50 },
    }
    const split = prioritySplits[budgetPriority] || prioritySplits['balanced']
    const maxNightly = accomMaxPerNight[accommodationLevel] || 120

    const userPrompt = `Plan a ${numCities}-city trip starting and ending at ${origin} with these constraints:
- Total budget: $${totalBudget} USD (covers all flights between cities + daily expenses)
- Total duration: ${totalDays} days
- Number of cities to visit: ${numCities}
- Region preference: ${regionText}
- Travel vibes: ${vibeText}
${departureTiming ? `- Departure timing: ${departureTiming}` : ''}

PLANNING RULES:
1. The route must START from ${origin} and the last flight should return to ${origin}
2. Optimize city order to MINIMIZE backtracking and total flight distance
3. Allocate days per city proportionally — bigger/more interesting cities get more days
${paceGuidance}
5. estimatedFlightCost is the cost of the flight TO that city from the previous city (or from origin for the first city)
6. estimatedDailyCost includes accommodation, food, local transport, and basic activities per day
7. Choose cities that are geographically logical together — no zigzagging across continents
8. Each city should offer a different experience or highlight
9. Total of all flight costs + (dailyCost * days for each city) MUST NOT exceed $${totalBudget}
10. Accommodation level: ${accomDescriptions[accommodationLevel] || 'mid-range hotels'}. The estimatedDailyCost should reflect this — hotel portion MUST NOT exceed $${maxNightly}/night.
11. Budget priority: Allocate approximately ${split.flights}% of total budget to flights, ${split.hotels}% to accommodation, and ${split.activities}% to activities/food/transport.
12. With "${budgetPriority}" priority: ${budgetPriority === 'flights' ? 'Prioritize reaching interesting faraway destinations even if accommodation is simpler.' : budgetPriority === 'hotels' ? 'Prioritize comfortable stays, even if that means closer destinations.' : budgetPriority === 'activities' ? 'Prioritize destinations with rich experiences, tours, and food scenes.' : 'Balance flight distance, accommodation quality, and activities evenly.'}

Return this EXACT JSON structure (no wrapping, no markdown):
{
  "cities": [
    {
      "code": "IATA code",
      "name": "City Name",
      "country": "Country",
      "days": number of days to spend,
      "estimatedFlightCost": cost of flight TO this city in USD,
      "estimatedDailyCost": daily cost in USD,
      "highlights": ["Top highlight 1", "Top highlight 2", "Top highlight 3"]
    }
  ],
  "totalEstimatedCost": total cost number,
  "returnFlightCost": cost of return flight from last city back to ${origin},
  "reasoning": "2-3 sentences explaining why this route and these cities were chosen"
}`

    console.log('[Multi-City] Calling AI for trip planning...')
    const maxTokens = numCities <= 5 ? 2500 : numCities <= 7 ? 3500 : 4500
    const aiResponse = await callAI(systemPrompt, userPrompt, 0.8, maxTokens)
    const aiResult = parseAIJSON<{
      cities: CityStop[]
      totalEstimatedCost: number
      returnFlightCost?: number
      reasoning: string
    }>(aiResponse.content)

    // Build the route string
    const cityNames = aiResult.cities.map(c => c.code)
    const routeString = `${origin} → ${cityNames.join(' → ')} → ${origin}`

    // Generate affiliate booking links for each flight leg
    // Calculate start date from departure preferences
    let startDate: Date
    if (departureDate) {
      // Exact date provided
      startDate = new Date(departureDate + 'T00:00:00')
    } else if (departureTimeframe) {
      // Calculate a reasonable start date from the timeframe
      const now = new Date()
      switch (departureTimeframe) {
        case 'this-month':
          // 2 weeks from now (or sooner if end of month)
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() + 14)
          break
        case 'next-month':
          // 1st of next month
          startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        case 'next-3-months':
          // 1 month from now
          startDate = new Date(now)
          startDate.setMonth(startDate.getMonth() + 1)
          break
        case 'next-6-months':
          // 2 months from now
          startDate = new Date(now)
          startDate.setMonth(startDate.getMonth() + 2)
          break
        case 'anytime':
          // 1 month from now
          startDate = new Date(now)
          startDate.setMonth(startDate.getMonth() + 1)
          break
        default:
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() + 14)
      }
    } else {
      // Fallback: 2 weeks from now
      startDate = new Date()
      startDate.setDate(startDate.getDate() + 14)
    }

    const bookingLinks: { from: string; to: string; label: string; url: string }[] = []
    let currentDate = new Date(startDate)

    // First leg: origin to first city
    if (aiResult.cities.length > 0) {
      const firstCity = aiResult.cities[0]
      const dateStr = currentDate.toISOString().split('T')[0]
      bookingLinks.push({
        from: origin,
        to: firstCity.code,
        label: `${origin} → ${firstCity.code} (${firstCity.name})`,
        url: buildFlightLink(origin, firstCity.code, dateStr),
      })
      currentDate.setDate(currentDate.getDate() + firstCity.days)
    }

    // Intermediate legs
    for (let i = 1; i < aiResult.cities.length; i++) {
      const fromCity = aiResult.cities[i - 1]
      const toCity = aiResult.cities[i]
      const dateStr = currentDate.toISOString().split('T')[0]
      bookingLinks.push({
        from: fromCity.code,
        to: toCity.code,
        label: `${fromCity.code} (${fromCity.name}) → ${toCity.code} (${toCity.name})`,
        url: buildFlightLink(fromCity.code, toCity.code, dateStr),
      })
      currentDate.setDate(currentDate.getDate() + toCity.days)
    }

    // Return leg: last city back to origin
    if (aiResult.cities.length > 0) {
      const lastCity = aiResult.cities[aiResult.cities.length - 1]
      const dateStr = currentDate.toISOString().split('T')[0]
      bookingLinks.push({
        from: lastCity.code,
        to: origin,
        label: `${lastCity.code} (${lastCity.name}) → ${origin} (Return)`,
        url: buildFlightLink(lastCity.code, origin, dateStr),
      })
    }

    const response: MultiCityResponse = {
      cities: aiResult.cities,
      totalEstimatedCost: aiResult.totalEstimatedCost,
      route: routeString,
      bookingLinks,
      reasoning: aiResult.reasoning,
    }

    // Cache for 1-2 hours (longer trips cached longer)
    const cacheTTL = totalDays > 30 ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000
    setCache(cacheKey, response, cacheTTL)

    console.log('[Multi-City] Successfully planned route:', routeString)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Multi-City] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to plan multi-city trip. Please try again.'
    return NextResponse.json(
      { error: clientMessage },
      { status: statusCode }
    )
  }
}
