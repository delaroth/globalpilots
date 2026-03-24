import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { PredictResponseSchema } from '@/lib/ai-schemas'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

interface PredictResponse {
  action: 'BUY_NOW' | 'WAIT'
  reason: string
  confidence: 'low' | 'medium' | 'high'
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 15 requests per minute for this AI endpoint
    const clientIp = getClientIp(request)
    const rl = rateLimit(`ai-predict:${clientIp}`, 15, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination' },
        { status: 400 }
      )
    }

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      return NextResponse.json(
        { error: 'origin and destination must be 3-letter IATA codes' },
        { status: 400 }
      )
    }

    // Check cache first (6 hours TTL)
    const cacheKey = `predict:${origin}:${destination}`
    const cached = getCached<PredictResponse>(cacheKey)
    if (cached) {
      console.log('[AI-Predict] Cache hit')
      return NextResponse.json(cached)
    }

    if (!TOKEN) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      )
    }

    // Fetch last 30 days of prices
    const priceHistory: Array<{ date: string; price: number }> = []

    // Get prices for the last 3 months (as TravelPayouts calendar gives monthly data)
    const today = new Date()
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toISOString().slice(0, 7) // YYYY-MM

      const url = `${API_BASE}/v1/prices/calendar?origin=${origin}&destination=${destination}&depart_date=${monthStr}&currency=usd&token=${TOKEN}`

      try {
        const response = await fetch(url, {
          next: { revalidate: 21600 }, // 6 hours
        })

        if (response.ok) {
          const data = await response.json()
          const monthData = data.data || {}

          for (const [date, info] of Object.entries(monthData)) {
            if (typeof info === 'object' && info !== null && 'value' in info) {
              priceHistory.push({
                date,
                price: (info as any).value,
              })
            }
          }
        }
      } catch (err) {
        // Skip this month if error
        continue
      }
    }

    if (priceHistory.length === 0) {
      return NextResponse.json(
        { error: 'No price history available for this route' },
        { status: 404 }
      )
    }

    // Sort by date
    priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Call AI to analyze trend
    const systemPrompt = `You are a price prediction expert. Analyze flight price trends and provide actionable advice. You MUST respond with valid JSON only.`

    const userPrompt = `Analyze this flight price history for ${origin} → ${destination}:

${JSON.stringify(priceHistory)}

Based on the trend, should the user BUY_NOW or WAIT?

Consider:
- Is the current price near the minimum?
- Is there an upward or downward trend?
- Seasonal patterns

Return this EXACT JSON structure:
{
  "action": "BUY_NOW" or "WAIT",
  "reason": "One sentence explaining why",
  "confidence": "low", "medium", or "high"
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.5, 300)
    const result = parseAIJSON(aiResponse.content, PredictResponseSchema)

    // Cache for 6 hours
    setCache(cacheKey, result, 6 * 60 * 60 * 1000)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI-Predict] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to predict prices. Please try again.'
    return NextResponse.json(
      { error: clientMessage },
      { status: statusCode }
    )
  }
}
