import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { subscribeToNewsletter } from '@/lib/newsletter'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Live schema: email_subscribers(id, email UNIQUE, origin, destinations TEXT[],
// max_price, subscribed_at, confirmed, unsubscribe_token UUID) — see
// supabase-security-lockdown.sql.

const subscribeSchema = z.object({
  email: z.string().trim().email('Invalid email address format').max(254),
  origin: z.string().regex(/^[A-Z]{3}$/).optional(),
  destinations: z.array(z.string().regex(/^[A-Z]{3}$/)).max(20).optional(),
  maxPrice: z.number().positive().max(100000).optional(),
})

/**
 * Double opt-in: always answers the same way (no enumeration of who is
 * subscribed); a confirmation email goes out at most once an hour per address.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimitAsync(`subscribe:${getClientIp(request)}`, 5, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many subscription requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const parsed = subscribeSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }

    await subscribeToNewsletter(parsed.data)

    return NextResponse.json({
      success: true,
      pending: true,
      message: 'Check your inbox to confirm your subscription.',
    })
  } catch (error) {
    console.error('[Email Subscribe] Error:', error)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }
}
