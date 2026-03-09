import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

interface MysteryRequest {
  origin: string
  budget: number
  vibes: string[]
  dates: string
}

interface MysteryResponse {
  destination: string
  country: string
  city_code_IATA: string
  estimated_flight_cost: number
  estimated_hotel_per_night: number
  why_its_perfect: string
  day1: string[]
  day2: string[]
  day3: string[]
  best_local_food: string[]
  insider_tip: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MysteryRequest = await request.json()
    const { origin, budget, vibes, dates } = body

    if (!origin || !budget || !vibes || vibes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check cache first (1 hour TTL)
    const cacheKey = `mystery:${origin}:${budget}:${vibes.join(',')}:${dates}`
    const cached = getCached<MysteryResponse>(cacheKey)
    if (cached) {
      console.log('[AI-Mystery] Cache hit')
      return NextResponse.json(cached)
    }

    // Fetch real prices from TravelPayouts
    if (!TOKEN) {
      return NextResponse.json(
        { error: 'TravelPayouts API token not configured' },
        { status: 500 }
      )
    }

    const pricesUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&currency=usd&limit=20&token=${TOKEN}`
    const pricesResponse = await fetch(pricesUrl, {
      next: { revalidate: 3600 },
    })

    if (!pricesResponse.ok) {
      throw new Error('Failed to fetch price data')
    }

    const pricesData = await pricesResponse.json()
    const destinations = pricesData.data || []

    if (destinations.length === 0) {
      throw new Error('No destinations found')
    }

    // Format price data for AI
    const priceInfo = destinations
      .slice(0, 20)
      .map((d: any) => ({
        destination: d.destination,
        gate: d.gate,
        price: d.value,
      }))
      .sort((a: any, b: any) => a.price - b.price)

    // Call AI with real price data
    const systemPrompt = `You are a travel expert. You MUST respond with valid JSON only, no additional text.`

    const userPrompt = `Given:
- Budget: ${budget} USD (total trip cost)
- Departing from: ${origin}
- Travel dates: ${dates}
- Vibes: ${vibes.join(', ')}
- Real available destinations with prices: ${JSON.stringify(priceInfo)}

Select ONE destination from the available destinations list that:
1. Has a flight price that fits within the budget
2. Matches the selected vibes perfectly
3. Is surprising but perfect

Return this EXACT JSON structure:
{
  "destination": "City name",
  "country": "Country name",
  "city_code_IATA": "Use the exact code from the destinations list",
  "estimated_flight_cost": use the exact price from the list,
  "estimated_hotel_per_night": realistic number,
  "why_its_perfect": "2 sentences explaining why",
  "day1": ["Activity 1", "Activity 2", "Activity 3"],
  "day2": ["Activity 1", "Activity 2", "Activity 3"],
  "day3": ["Activity 1", "Activity 2", "Activity 3"],
  "best_local_food": ["Dish 1", "Dish 2", "Dish 3"],
  "insider_tip": "One insider tip"
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 1500)
    const result = parseAIJSON<MysteryResponse>(aiResponse.content)

    // Cache for 1 hour
    setCache(cacheKey, result, 60 * 60 * 1000)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI-Mystery] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate destination' },
      { status: 500 }
    )
  }
}
