import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCachedDestination, cacheDestination, buildBasicInfo } from '@/lib/destination-cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// 30 days in milliseconds — cache expiry threshold
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

interface GenericRequest {
  destination: string
  country: string
  iata: string
}

export interface GenericAIContent {
  whyVisit: string
  topAttractions: { name: string; description: string }[]
  localFood: string[]
  insiderTips: string[]
  culturalNotes: string
  neighborhoods: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 requests per minute (cached = cheap)
    const clientIp = getClientIp(request)
    const rl = rateLimit(`ai-mystery-generic:${clientIp}`, 20, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }

    let body: GenericRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { destination, country, iata } = body

    if (!destination || !country || !iata) {
      return NextResponse.json({ error: 'Missing required parameters: destination, country, iata' }, { status: 400 })
    }

    // ── Check Supabase destination_cache for existing AI content ──
    try {
      const cached = await getCachedDestination(iata)
      if (cached?.aiContent) {
        // Check age — the updated_at is on the DB row; we check if aiContent
        // fields are populated. Since getCachedDestination doesn't return
        // updated_at, we rely on the aiContent being non-null as "cached".
        // The 30-day TTL is enforced by ensureGenericCached which checks the
        // DB timestamp. For this route, if aiContent exists, use it.
        console.log(`[Generic] Cache hit for ${iata} — returning cached AI content`)

        // Map cached aiContent to the response format expected by the client
        const result = mapCachedToResponse(cached.aiContent, cached.basicInfo)
        return NextResponse.json({ ...result, _cached: true })
      }
    } catch {
      // Cache check failed — continue to generate
    }

    // ── Cache miss: generate with a SHORT AI prompt ──
    console.log(`[Generic] Cache miss for ${iata} — generating AI content for ${destination}, ${country}`)

    const systemPrompt = `Travel expert. Return valid JSON only. Be concise.`

    const userPrompt = `Generate generic travel info for ${destination}, ${country}.

Return JSON:
{
  "whyVisit": "2-3 sentences on why this destination is great to visit",
  "topAttractions": [
    {"name": "Attraction Name", "description": "One-line description"},
    {"name": "...", "description": "..."}
  ],
  "localFood": ["Dish 1", "Dish 2", "Dish 3", "Dish 4", "Dish 5"],
  "insiderTips": ["Tip 1", "Tip 2", "Tip 3"],
  "culturalNotes": "1-2 sentences about local culture and customs",
  "neighborhoods": ["Area 1", "Area 2", "Area 3"]
}

5 attractions, 5 foods, 3 tips, 3 neighborhoods. Keep all descriptions under 15 words.`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.8, 600)
    const aiContent = parseAIJSON<GenericAIContent>(aiResponse.content)

    // Ensure we have proper arrays
    if (!Array.isArray(aiContent.topAttractions)) aiContent.topAttractions = []
    if (!Array.isArray(aiContent.localFood)) aiContent.localFood = []
    if (!Array.isArray(aiContent.insiderTips)) aiContent.insiderTips = []
    if (!Array.isArray(aiContent.neighborhoods)) aiContent.neighborhoods = []

    // ── Cache the result in Supabase ──
    try {
      const existingCache = await getCachedDestination(iata)
      const basicInfo = existingCache?.basicInfo || buildBasicInfo(iata, destination, country)

      await cacheDestination({
        iata: iata.toUpperCase(),
        city: destination,
        country,
        basicInfo,
        aiContent: {
          whyVisit: aiContent.whyVisit,
          genericItinerary: [], // not used in this flow
          neighborhoods: aiContent.neighborhoods,
          localTips: aiContent.insiderTips,
          culturalNotes: aiContent.culturalNotes,
          // Store extra fields in the JSONB — Supabase handles arbitrary keys
          ...(aiContent as any),
        },
        flightStats: existingCache?.flightStats ?? null,
        revealCount: existingCache?.revealCount ?? 0,
      })

      console.log(`[Generic] Cached AI content for ${iata}`)
    } catch (err) {
      console.warn('[Generic] Failed to cache AI content:', err)
    }

    // Map to response format
    const result = mapAIToResponse(aiContent)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Generic] Error:', error)
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    const isAIFailure = error instanceof Error && error.message.includes('AI providers failed')
    const statusCode = isTimeout ? 504 : isAIFailure ? 502 : 500
    const clientMessage = isTimeout
      ? 'Request timed out. Please try again.'
      : isAIFailure
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'Failed to generate destination info. Please try again.'
    return NextResponse.json({ error: clientMessage }, { status: statusCode })
  }
}

/**
 * Map fresh AI-generated content to the client response format.
 * This format merges into the destination object on the client.
 */
function mapAIToResponse(ai: GenericAIContent) {
  return {
    whyThisPlace: ai.whyVisit,
    why_its_perfect: ai.whyVisit,
    best_local_food: ai.localFood.slice(0, 5),
    insider_tip: ai.insiderTips[0] || '',
    localTip: ai.insiderTips[0] || '',
    // Extended generic data
    genericData: {
      topAttractions: ai.topAttractions,
      allInsiderTips: ai.insiderTips,
      culturalNotes: ai.culturalNotes,
      neighborhoods: ai.neighborhoods,
      localFood: ai.localFood,
    },
  }
}

/**
 * Map cached aiContent (from Supabase) to the client response format.
 */
function mapCachedToResponse(
  aiContent: NonNullable<import('@/lib/destination-cache').CachedDestination['aiContent']>,
  basicInfo?: import('@/lib/destination-cache').CachedDestination['basicInfo'],
) {
  // The cached aiContent may have the extended fields from our storage
  const extended = aiContent as any

  return {
    whyThisPlace: aiContent.whyVisit || '',
    why_its_perfect: aiContent.whyVisit || '',
    best_local_food: extended.localFood || basicInfo?.localFood || [],
    insider_tip: aiContent.localTips?.[0] || '',
    localTip: aiContent.localTips?.[0] || '',
    genericData: {
      topAttractions: extended.topAttractions || (basicInfo?.topAttractions || []).map((a: string) => ({ name: a, description: '' })),
      allInsiderTips: aiContent.localTips || [],
      culturalNotes: aiContent.culturalNotes || '',
      neighborhoods: aiContent.neighborhoods || [],
      localFood: extended.localFood || basicInfo?.localFood || [],
    },
  }
}
