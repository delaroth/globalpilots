import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { trackActivity } from '@/lib/activity-feed'
import { trackRoute, AlertError } from '@/lib/price-tracker'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const createAlertSchema = z.object({
  email: z.string().trim().email().max(254),
  origin: z.string().regex(/^[A-Z]{3}$/, 'origin must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)'),
  destination: z.string().regex(/^[A-Z]{3}$/, 'destination must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)'),
  targetPrice: z.number().positive('Target price must be greater than 0').max(100000),
  flexibleDates: z.boolean().optional(),
  dateRangeDays: z.number().int().min(0).max(14).optional(),
  token: z.string().max(512).optional(),
})

export async function POST(request: NextRequest) {
  const rl = await rateLimitAsync(`alerts-create:${getClientIp(request)}`, 5, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const parsed = createAlertSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }
    const { email, origin, destination, targetPrice, flexibleDates, dateRangeDays, token } = parsed.data

    const session = await getServerSession(authOptions)
    const { route, pending } = await trackRoute({
      email,
      origin,
      destination,
      targetPrice,
      flexibleDates,
      dateRangeDays,
      userId: session?.user?.id || null,
      token,
    })

    // Track activity (anonymized)
    await trackActivity('alert_created', {
      route: `${origin}-${destination}`,
      user_city: 'Unknown',
      user_first_name: session?.user?.name?.split(' ')[0] || 'Someone',
    })

    return NextResponse.json({
      success: true,
      pending,
      alert: {
        id: route.id,
        email: route.email,
        origin: route.origin,
        destination: route.destination,
        targetPrice: route.target_price,
        flexibleDates: route.flexible_dates,
        dateRangeDays: route.date_range_days,
        createdAt: route.created_at,
        isActive: route.is_active,
      },
    })
  } catch (error) {
    if (error instanceof AlertError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Alerts Create] Error:', error)
    return NextResponse.json({ error: 'Failed to create alert. Please try again.' }, { status: 500 })
  }
}
