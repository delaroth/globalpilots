import { NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
// CityGuideSchema skipped — CityGuideData has complex fields not AI-generated
import { getCached, setCache } from '@/lib/cache'
import type { CityGuideData } from '../route'

export const dynamic = 'force-dynamic'

// Major hub cities to pre-cache
const HUB_CITIES = [
  { city: 'Dubai', hub_code: 'DXB' },
  { city: 'Singapore', hub_code: 'SIN' },
  { city: 'Istanbul', hub_code: 'IST' },
  { city: 'Doha', hub_code: 'DOH' },
  { city: 'Bangkok', hub_code: 'BKK' },
  { city: 'Kuala Lumpur', hub_code: 'KUL' },
  { city: 'Hong Kong', hub_code: 'HKG' },
  { city: 'Tokyo', hub_code: 'NRT' },
  { city: 'Seoul', hub_code: 'ICN' },
  { city: 'London', hub_code: 'LHR' },
  { city: 'Paris', hub_code: 'CDG' },
  { city: 'Amsterdam', hub_code: 'AMS' },
  { city: 'Frankfurt', hub_code: 'FRA' },
]

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

async function generateGuide(city: string, hub_code: string, hours: number): Promise<CityGuideData> {
  const systemPrompt = `You are a seasoned travel expert who specializes in airport layovers and short city visits. You give practical, honest, concise advice that helps travelers make the most of limited time. You MUST respond with valid JSON only — no markdown, no extra text.`

  const userPrompt = `Generate a concise layover guide for someone with ${hours} hours in ${city} (airport code: ${hub_code}).

Return this EXACT JSON structure:
{
  "city": "${city}",
  "hub_code": "${hub_code}",
  "hours": ${hours},
  "can_leave_airport": "Yes/No with brief explanation",
  "visa_info": "Concise visa/transit info",
  "airport_to_city": "Best transport option, time, cost in USD",
  "best_area": "Best neighborhood for a short layover",
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
      "type": "e.g. 'Street food'",
      "price_range": "e.g. '$5-10'",
      "must_try": "Signature dish to order"
    }
  ],
  "practical_tips": [
    "Tip about luggage storage",
    "Tip about SIM cards or WiFi",
    "Tip about safety",
    "Tip about timing"
  ],
  "currency": "Local currency and exchange rate to USD",
  "language_tip": "Key phrases or whether English is widely spoken"
}

Include exactly 4 top_activities and 3 food_picks. Be practical and specific — include real place names, realistic USD prices, and honest assessments.`

  const aiResponse = await callAI(systemPrompt, userPrompt, 0.6, 2000)
  return parseAIJSON<CityGuideData>(aiResponse.content)
}

export async function POST() {
  const results: { city: string; status: 'cached' | 'generated' | 'error'; error?: string }[] = []

  for (const { city, hub_code } of HUB_CITIES) {
    const cacheKey = `city-guide:${city.toLowerCase()}:12`

    // Skip if already cached
    const existing = getCached<CityGuideData>(cacheKey)
    if (existing) {
      results.push({ city, status: 'cached' })
      continue
    }

    try {
      const guide = await generateGuide(city, hub_code, 12)
      setCache(cacheKey, guide, CACHE_TTL)
      results.push({ city, status: 'generated' })
      console.log(`[City-Guide Warmup] Generated guide for ${city}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      results.push({ city, status: 'error', error: msg })
      console.error(`[City-Guide Warmup] Failed for ${city}:`, msg)
    }

    // Small delay between calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const generated = results.filter(r => r.status === 'generated').length
  const cached = results.filter(r => r.status === 'cached').length
  const errors = results.filter(r => r.status === 'error').length

  return NextResponse.json({
    summary: { total: HUB_CITIES.length, generated, cached, errors },
    results,
  })
}
