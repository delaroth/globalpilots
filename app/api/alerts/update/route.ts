import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAlertToken } from '@/lib/alert-tokens'
import { setAlertActive } from '@/lib/price-tracker'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
  token: z.string().max(512),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = updateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing required fields: id, isActive, token' }, { status: 400 })
    }
    const { id, isActive, token } = parsed.data

    const email = verifyAlertToken(token)
    if (!email) {
      return NextResponse.json({ error: 'Invalid alert link.' }, { status: 401 })
    }

    const alert = await setAlertActive(id, email, isActive)
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, alert: { id: alert.id, isActive: alert.is_active } })
  } catch (error) {
    console.error('[Alerts Update] Error:', error)
    return NextResponse.json({ error: 'Failed to update alert. Please try again.' }, { status: 500 })
  }
}
