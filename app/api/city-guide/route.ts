import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export interface CityGuideData {
  city: string
  hub_code: string
  hours: number
  can_leave_airport: string
  visa_info: string
  airport_to_city: string
  best_area: string
  top_activities: Array<{
    name: string
    description: string
    time_needed: string
    estimated_cost: string
  }>
  food_picks: Array<{
    name: string
    type: string
    price_range: string
    must_try: string
  }>
  practical_tips: string[]
  currency: string
  language_tip: string
}

// 7-day TTL for city guide cache
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const hours = parseInt(searchParams.get('hours') || '12', 10)
    const hub_code = searchParams.get('hub_code') || ''

    if (!city) {
      return NextResponse.json(
        { error: 'Missing required parameter: city' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `city-guide:${city.toLowerCase()}:${hours}`
    const cached = getCached<CityGuideData>(cacheKey)
    if (cached) {
      console.log(`[City-Guide] Cache hit for ${city}`)
      return NextResponse.json(cached)
    }

    const systemPrompt = `You are a seasoned travel expert who specializes in airport layovers and short city visits. You give practical, honest, concise advice that helps travelers make the most of limited time. You MUST respond with valid JSON only — no markdown, no extra text.`

    const userPrompt = `Generate a concise layover guide for someone with ${hours} hours in ${city}${hub_code ? ` (airport code: ${hub_code})` : ''}.

Return this EXACT JSON structure:
{
  "city": "${city}",
  "hub_code": "${hub_code}",
  "hours": ${hours},
  "can_leave_airport": "Yes/No with brief explanation — e.g. 'Yes, most nationalities can enter visa-free for up to 96 hours' or 'Depends on nationality — check transit visa requirements'",
  "visa_info": "Concise visa/transit info — who needs a visa, who doesn't, any transit-without-visa programs",
  "airport_to_city": "How to get from the airport to the city center — best transport option, time, cost in USD",
  "best_area": "The best neighborhood or area to visit near the airport or in the city center for a short layover",
  "top_activities": [
    {
      "name": "Activity name",
      "description": "One-sentence description",
      "time_needed": "e.g. '2 hours'",
      "estimated_cost": "e.g. '$15' or 'Free'"
    }
  ],
  "food_picks": [
    {
      "name": "Restaurant or food type",
      "type": "e.g. 'Street food', 'Casual dining', 'Fine dining'",
      "price_range": "e.g. '$5-10'",
      "must_try": "Signature dish to order"
    }
  ],
  "practical_tips": [
    "Tip about luggage storage at the airport",
    "Tip about SIM cards or WiFi",
    "Tip about safety or scams to avoid",
    "Tip about timing or rush hour"
  ],
  "currency": "Local currency name and rough exchange rate to USD",
  "language_tip": "Key phrases or whether English is widely spoken"
}

Include exactly 3-5 top_activities and 3 food_picks. Make the guide practical and specific — include real place names, realistic prices in USD, and honest assessments. Focus on what's actually doable in ${hours} hours including airport transit time.`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.6, 2000)
    const result = parseAIJSON<CityGuideData>(aiResponse.content)

    // Cache for 7 days
    setCache(cacheKey, result, CACHE_TTL)

    console.log(`[City-Guide] Generated and cached for ${city} (${hours}h), provider: ${aiResponse.provider}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[City-Guide] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate city guide' },
      { status: 500 }
    )
  }
}
