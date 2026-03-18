import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { checkVisaRequirement } from '@/lib/enrichment/visa'
import { countryNameToCode } from '@/lib/enrichment/country-data'

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
    // Rate limit: 15 requests per minute for this AI endpoint
    const clientIp = getClientIp(request)
    const rl = rateLimit(`city-guide:${clientIp}`, 15, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

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

    if (city.length > 100) {
      return NextResponse.json(
        { error: 'City name is too long' },
        { status: 400 }
      )
    }

    if (isNaN(hours) || hours < 1 || hours > 72) {
      return NextResponse.json(
        { error: 'Hours must be between 1 and 72' },
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

    // Look up real visa data for common passport holders
    const passport = searchParams.get('passport') || 'US'
    // Try to resolve city name to country for visa lookup
    const countryCode = countryNameToCode(city) || ''
    let realVisaInfo = ''
    let canLeaveAirport = ''
    if (countryCode) {
      const visa = checkVisaRequirement(passport, city)
      const statusLabels: Record<string, string> = {
        'visa-free': 'Visa-free entry',
        'visa-on-arrival': 'Visa on arrival available',
        'e-visa': 'E-visa required (apply online before travel)',
        'visa-required': 'Visa required — apply at embassy before travel',
      }
      realVisaInfo = `${statusLabels[visa.status] || visa.status}${visa.maxStay ? ` for up to ${visa.maxStay} days` : ''}. ${visa.note || ''} NOTE: Visa requirements vary by nationality — always verify with your country\\'s embassy before travel.`
      canLeaveAirport = visa.status === 'visa-free' || visa.status === 'visa-on-arrival'
        ? `Yes — ${visa.status.replace(/-/g, ' ')} entry available${visa.maxStay ? ` (up to ${visa.maxStay} days)` : ''}. Verify requirements for your specific nationality.`
        : `Depends on nationality — ${passport} passport holders need ${visa.status.replace(/-/g, ' ')}. Check transit visa requirements for your passport.`
    }

    const systemPrompt = `You are a seasoned travel expert who specializes in airport layovers and short city visits. You give practical, honest, concise advice that helps travelers make the most of limited time. You MUST respond with valid JSON only — no markdown, no extra text.`

    const userPrompt = `Generate a concise layover guide for someone with ${hours} hours in ${city}${hub_code ? ` (airport code: ${hub_code})` : ''}.

Return this EXACT JSON structure:
{
  "city": "${city}",
  "hub_code": "${hub_code}",
  "hours": ${hours},
  "can_leave_airport": "${canLeaveAirport || 'Depends on nationality — check transit visa requirements before leaving the airport'}",
  "visa_info": "${realVisaInfo || 'Visa requirements vary by nationality — always check with your embassy before travel'}",
  "airport_to_city": "How to get from the airport to the city center — best transport option, time, cost in USD",
  "best_area": "The best neighborhood or area to visit near the airport or in the city center for a short layover",
  "top_activities": [
    {
      "name": "Activity or landmark name (use well-known places)",
      "description": "One-sentence description",
      "time_needed": "e.g. '2 hours'",
      "estimated_cost": "e.g. '~$15' or 'Free' (approximate)"
    }
  ],
  "food_picks": [
    {
      "name": "Type of food or cuisine (e.g. 'Street food pad thai stalls' not specific restaurant names)",
      "type": "e.g. 'Street food', 'Casual dining', 'Fine dining'",
      "price_range": "e.g. '~$5-10'",
      "must_try": "Dish to try"
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

IMPORTANT RULES:
- For activities, use well-known landmarks and areas (temples, markets, museums) — NOT invented or obscure names
- For food, describe the TYPE of food/cuisine and where to find it (e.g. "street food stalls near X market") rather than specific restaurant names that may not exist
- All costs are ESTIMATES — prefix with "~" to indicate approximate
- Focus on what's actually doable in ${hours} hours including airport transit time
- Include exactly 3-5 top_activities and 3 food_picks`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.6, 2000)
    const result = parseAIJSON<CityGuideData>(aiResponse.content)

    // Override visa fields with real data (AI may have ignored our pre-filled values)
    if (realVisaInfo) {
      result.visa_info = realVisaInfo
    }
    if (canLeaveAirport) {
      result.can_leave_airport = canLeaveAirport
    }

    // Cache for 7 days
    setCache(cacheKey, result, CACHE_TTL)

    console.log(`[City-Guide] Generated and cached for ${city} (${hours}h), provider: ${aiResponse.provider}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[City-Guide] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate city guide. Please try again.'
    return NextResponse.json(
      { error: clientMessage },
      { status: statusCode }
    )
  }
}
