import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface ItineraryRequest {
  destination: string
  days: number
  vibe: string
}

interface ItineraryResponse {
  destination: string
  days: number
  vibe: string
  itinerary: Array<{
    day: number
    title: string
    activities: string[]
    meals: string[]
  }>
  tips: string[]
  budget_estimate: {
    accommodation_per_night: number
    food_per_day: number
    activities_per_day: number
    total: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute for this AI endpoint
    const clientIp = getClientIp(request)
    const rl = rateLimit(`ai-itinerary:${clientIp}`, 10, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: ItineraryRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }
    const { destination, days, vibe } = body

    if (!destination || !days || !vibe) {
      return NextResponse.json(
        { error: 'Missing required parameters: destination, days, vibe' },
        { status: 400 }
      )
    }

    if (typeof days !== 'number' || days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 30' },
        { status: 400 }
      )
    }

    if (typeof destination !== 'string' || destination.length > 100) {
      return NextResponse.json(
        { error: 'Invalid destination' },
        { status: 400 }
      )
    }

    // Check cache first - use destination+vibe as key
    // In production, this should be Supabase
    const cacheKey = `itinerary:${destination.toLowerCase()}:${vibe.toLowerCase()}:${days}`
    const cached = getCached<ItineraryResponse>(cacheKey)
    if (cached) {
      console.log('[AI-Itinerary] Cache hit')
      return NextResponse.json(cached)
    }

    // Call AI to generate itinerary
    const systemPrompt = `You are an expert travel planner. Create detailed, realistic itineraries. You MUST respond with valid JSON only.`

    const userPrompt = `Create a ${days}-day itinerary for ${destination} with a ${vibe} vibe.

Return this EXACT JSON structure:
{
  "destination": "${destination}",
  "days": ${days},
  "vibe": "${vibe}",
  "itinerary": [
    {
      "day": 1,
      "title": "Day title (e.g., 'Arrival & Old Town')",
      "activities": ["Morning activity", "Afternoon activity", "Evening activity"],
      "meals": ["Breakfast spot", "Lunch spot", "Dinner spot"]
    }
    // ... repeat for each day
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "budget_estimate": {
    "accommodation_per_night": realistic number,
    "food_per_day": realistic number,
    "activities_per_day": realistic number,
    "total": total for all days
  }
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.7, 2000)
    const result = parseAIJSON<ItineraryResponse>(aiResponse.content)

    // Cache permanently (or for a very long time)
    // In production, save to Supabase instead
    setCache(cacheKey, result, 365 * 24 * 60 * 60 * 1000) // 1 year

    console.log(`[AI-Itinerary] Generated and cached for ${destination}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI-Itinerary] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate itinerary. Please try again.'
    return NextResponse.json(
      { error: clientMessage },
      { status: statusCode }
    )
  }
}
