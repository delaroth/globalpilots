import { NextRequest, NextResponse } from 'next/server'
import { verifyAlertToken } from '@/lib/alert-tokens'
import { getAlertsForEmail } from '@/lib/price-tracker'

export const dynamic = 'force-dynamic'

/** GET ?token=… — list alerts for the email the signed token was issued to. */
export async function GET(request: NextRequest) {
  const email = verifyAlertToken(request.nextUrl.searchParams.get('token'))
  if (!email) {
    return NextResponse.json({ error: 'Invalid or missing alert link.' }, { status: 401 })
  }

  try {
    const data = await getAlertsForEmail(email)

    const alerts = data.map(alert => ({
      id: alert.id,
      email: alert.email,
      origin: alert.origin,
      destination: alert.destination,
      targetPrice: alert.target_price,
      createdAt: alert.created_at,
      isActive: alert.is_active,
      pending: !alert.confirmed_at,
      lastCheckedAt: alert.last_checked_at,
      lastNotifiedAt: alert.last_notified_at,
    }))

    return NextResponse.json({ email, alerts })
  } catch (error) {
    console.error('[Alerts List] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts. Please try again.' }, { status: 500 })
  }
}
