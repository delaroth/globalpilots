import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute (page views are frequent)
  const clientIp = getClientIp(request)
  const rl = rateLimit(`analytics:${clientIp}`, 30, 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    )
  }

  try {
    const body = await request.json()
    const { type, data, url, sessionId } = body

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    }

    // Fire-and-forget: don't await the insert
    trackEvent(type, { ...data, url }, {
      pageUrl: url || undefined,
      sessionId: sessionId || undefined,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
