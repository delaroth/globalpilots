import { NextRequest, NextResponse } from 'next/server'
import { getCreditStatus, setCredits } from '@/lib/flightapi'

export const dynamic = 'force-dynamic'

/**
 * GET: Check FlightAPI.io credit balance and status.
 * POST: Update credits (e.g. after purchasing more).
 *
 * Protected by CRON_SECRET to prevent public access.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(getCreditStatus())
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const credits = parseInt(body.credits, 10)

    if (isNaN(credits) || credits < 0) {
      return NextResponse.json({ error: 'credits must be a non-negative number' }, { status: 400 })
    }

    setCredits(credits)
    return NextResponse.json({ success: true, ...getCreditStatus() })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
