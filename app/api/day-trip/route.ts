import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { searchDestinations, type DestinationCost } from '@/lib/destination-costs'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface DayTripRequest {
  destination: string
  budget: number
  days: number
  interests: string[]
  currency?: string
}

interface ActivityItem {
  time: string
  activity: string
  cost: number
  transport?: string
}

interface MealItem {
  meal: string
  suggestion: string
  priceRange: string
  cost: number
}

interface DayItinerary {
  day: number
  morning: ActivityItem[]
  afternoon: ActivityItem[]
  evening: ActivityItem[]
  meals: MealItem[]
  dailyTotal: number
}

interface DayTripResponse {
  itinerary: DayItinerary[]
  tips: string[]
  totalEstimatedCost: number
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute
    const clientIp = getClientIp(request)
    const rl = rateLimit(`day-trip:${clientIp}`, 10, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: DayTripRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const {
      destination,
      budget,
      days = 1,
      interests,
      currency = 'USD',
    } = body

    // Validation
    if (!destination || !budget || !interests || interests.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: destination, budget, and interests are required.' },
        { status: 400 }
      )
    }

    if (days < 1 || days > 5) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 5.' },
        { status: 400 }
      )
    }

    if (budget < 5 || budget > 5000) {
      return NextResponse.json(
        { error: 'Daily budget must be between $5 and $5,000.' },
        { status: 400 }
      )
    }

    // Look up destination in cost data for baseline context
    const matches = searchDestinations(destination)
    const costData: DestinationCost | null = matches.length > 0 ? matches[0] : null

    const costContext = costData
      ? `Local cost data: budget tier ~$${costData.dailyCosts.budget.food + costData.dailyCosts.budget.activities + costData.dailyCosts.budget.transport}/day, mid tier ~$${costData.dailyCosts.mid.food + costData.dailyCosts.mid.activities + costData.dailyCosts.mid.transport}/day (excluding accommodation). Currency: ${costData.currency}. Saving tips: ${costData.savingTips.slice(0, 2).join('; ')}`
      : 'No local cost data available — use your knowledge of typical prices.'

    const systemPrompt = `You are an expert local travel guide for ${destination}. You create detailed, practical day trip itineraries. Respond with valid JSON only.`

    const userPrompt = `Generate a detailed ${days}-day itinerary for ${destination}.

Daily budget: $${budget} USD — focus on: ${interests.join(', ')}
Display currency: ${currency}
${costContext}

IMPORTANT RULES:
- Include morning, afternoon, and evening activities with specific times, estimated costs in USD, and how to get between locations
- For activities, use well-known landmarks, markets, temples, museums, parks — NOT obscure or invented place names
- For meals, describe the TYPE of food and the AREA to find it (e.g. "Street food pad thai near Khao San Road", "Seafood restaurants along the waterfront") — do NOT invent specific restaurant names
- All costs are ESTIMATES — use realistic local prices
- Include practical tips (best transport, areas to avoid, tipping customs, safety notes)
- Do NOT include flights or accommodation — this is a local day trip/exploration guide
- Keep total daily spending within the $${budget} budget
- Times should be realistic with travel time between locations

Return JSON with this exact structure:
{
  "itinerary": [
    {
      "day": 1,
      "morning": [
        { "time": "8:00 AM", "activity": "Description", "cost": 5, "transport": "How to get there" }
      ],
      "afternoon": [
        { "time": "12:30 PM", "activity": "Description", "cost": 10, "transport": "How to get there" }
      ],
      "evening": [
        { "time": "6:00 PM", "activity": "Description", "cost": 15, "transport": "How to get there" }
      ],
      "meals": [
        { "meal": "Breakfast", "suggestion": "Type of food + area (e.g. 'Street food stalls near X market — try local porridge')", "priceRange": "~$3-5", "cost": 4 },
        { "meal": "Lunch", "suggestion": "Type of food + area (e.g. 'Seafood restaurants near the pier — grilled fish')", "priceRange": "~$5-10", "cost": 7 },
        { "meal": "Dinner", "suggestion": "Type of food + area (e.g. 'Night market food stalls — local specialties')", "priceRange": "~$8-15", "cost": 12 }
      ],
      "dailyTotal": 53
    }
  ],
  "tips": [
    "Practical tip 1",
    "Practical tip 2",
    "Practical tip 3",
    "Practical tip 4",
    "Practical tip 5"
  ],
  "totalEstimatedCost": 53
}`

    console.log(`[DayTrip] Generating ${days}-day itinerary for ${destination}`)

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 3000)
    const result = parseAIJSON<DayTripResponse>(aiResponse.content)

    // Ensure the itinerary array exists and has the right structure
    if (!result.itinerary || !Array.isArray(result.itinerary)) {
      throw new Error('AI returned invalid itinerary format')
    }

    console.log(`[DayTrip] Generated ${result.itinerary.length}-day itinerary for ${destination}`)

    return NextResponse.json({
      ...result,
      destination,
      costData: costData ? {
        city: costData.city,
        country: costData.country,
        currency: costData.currency,
        dailyCosts: costData.dailyCosts,
        savingTips: costData.savingTips,
      } : null,
    })
  } catch (error) {
    console.error('[DayTrip] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate day trip itinerary. Please try again.'
    return NextResponse.json({ error: clientMessage }, { status: statusCode })
  }
}
