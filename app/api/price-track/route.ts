import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { trackRoute, AlertError } from '@/lib/price-tracker'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const trackSchema = z.object({
  email: z.string().trim().email().max(254),
  origin: z.string().regex(/^[A-Z]{3}$/, 'origin and destination must be 3-letter IATA codes'),
  destination: z.string().regex(/^[A-Z]{3}$/, 'origin and destination must be 3-letter IATA codes'),
  targetPrice: z.number().positive('Target price must be greater than 0').max(100000),
})

/**
 * POST — Create a new price tracking alert (pending until the email is confirmed).
 * Listing/managing alerts lives in /api/alerts/* and requires a signed token.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimitAsync(`price-track:${getClientIp(request)}`, 5, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }

  try {
    const parsed = trackSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }

    const { route, pending } = await trackRoute(parsed.data)

    return NextResponse.json({
      success: true,
      pending,
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        targetPrice: route.target_price,
        createdAt: route.created_at,
      },
    })
  } catch (err) {
    if (err instanceof AlertError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[PriceTrack] Error:', err)
    return NextResponse.json({ error: 'Failed to track route.' }, { status: 500 })
  }
}
