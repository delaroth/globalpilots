import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRecentActivity, trackActivity } from '@/lib/activity-feed'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10') || 10, 1), 50)

    const activities = await getRecentActivity(limit)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

// Only the one event the browser reports (MysteryReveal); everything else is
// tracked server-side. Shown publicly in the live feed, so keep it tight.
const clientActivitySchema = z.object({
  activityType: z.literal('destination_revealed'),
  data: z.object({
    destination: z.string().trim().min(1).max(80).regex(/^[\p{L}\p{M} .,'()-]+$/u),
    country: z.string().trim().max(80).regex(/^[\p{L}\p{M} .,'()-]*$/u).default(''),
  }),
})

export async function POST(request: NextRequest) {
  const rl = await rateLimitAsync(`activity:${getClientIp(request)}`, 10, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const parsed = clientActivitySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid activity' }, { status: 400 })

  await trackActivity(parsed.data.activityType, parsed.data.data)
  return NextResponse.json({ success: true })
}
