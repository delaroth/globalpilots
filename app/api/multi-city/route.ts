import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { buildFlightLink } from '@/lib/affiliate'

export const dynamic = 'force-dynamic'

interface MultiCityRequest {
  origin: string
  totalBudget: number
  totalDays: number
  numCities: number
  region?: string
  vibe?: string[]
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
    const body: MultiCityRequest = await request.json()
    const { origin, totalBudget, totalDays, numCities, region, vibe } = body

    // Validation
    if (!origin || !totalBudget || !totalDays || !numCities) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, totalBudget, totalDays, numCities' },
        { status: 400 }
      )
    }

    if (numCities < 2 || numCities > 5) {
      return NextResponse.json(
        { error: 'numCities must be between 2 and 5' },
        { status: 400 }
      )
    }

    if (totalDays < 5 || totalDays > 30) {
      return NextResponse.json(
        { error: 'totalDays must be between 5 and 30' },
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
    const cacheKey = `multi-city:${origin}:${totalBudget}:${totalDays}:${numCities}:${region || 'any'}:${(vibe || []).sort().join(',')}`
    const cached = getCached<MultiCityResponse>(cacheKey)
    if (cached) {
      console.log('[Multi-City] Cache hit')
      return NextResponse.json(cached)
    }

    // Build AI prompts
    const systemPrompt = `You are an expert multi-city travel planner. You specialize in creating optimized multi-stop itineraries that minimize backtracking, maximize value for money, and create diverse travel experiences. You MUST respond with valid JSON only, no additional text or markdown.`

    const vibeText = vibe && vibe.length > 0 ? vibe.join(', ') : 'any'
    const regionText = region && region !== 'Any' ? region : 'anywhere in the world'

    const userPrompt = `Plan a ${numCities}-city trip starting and ending at ${origin} with these constraints:
- Total budget: $${totalBudget} USD (covers all flights between cities + daily expenses)
- Total duration: ${totalDays} days
- Number of cities to visit: ${numCities}
- Region preference: ${regionText}
- Travel vibes: ${vibeText}

PLANNING RULES:
1. The route must START from ${origin} and the last flight should return to ${origin}
2. Optimize city order to MINIMIZE backtracking and total flight distance
3. Allocate days per city proportionally — bigger/more interesting cities get more days (minimum 2 days per city)
4. Budget allocation: approximately 40% for all flights combined, 60% for daily costs (accommodation + food + activities)
5. estimatedFlightCost is the cost of the flight TO that city from the previous city (or from origin for the first city)
6. estimatedDailyCost includes accommodation, food, local transport, and basic activities per day
7. Choose cities that are geographically logical together — no zigzagging across continents
8. Each city should offer a different experience or highlight
9. Total of all flight costs + (dailyCost * days for each city) MUST NOT exceed $${totalBudget}

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
    const aiResponse = await callAI(systemPrompt, userPrompt, 0.8, 2500)
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
    // Use a date 2 weeks from now as default departure
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 14)

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

    // Cache for 1 hour
    setCache(cacheKey, response, 60 * 60 * 1000)

    console.log('[Multi-City] Successfully planned route:', routeString)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Multi-City] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to plan multi-city trip' },
      { status: 500 }
    )
  }
}
