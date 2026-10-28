import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAlertToken } from '@/lib/alert-tokens'
import { deleteAlert } from '@/lib/price-tracker'

export const dynamic = 'force-dynamic'

const deleteSchema = z.object({
  id: z.string().uuid(),
  token: z.string().max(512),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = deleteSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing required fields: id, token' }, { status: 400 })
    }

    const email = verifyAlertToken(parsed.data.token)
    if (!email) {
      return NextResponse.json({ error: 'Invalid alert link.' }, { status: 401 })
    }

    await deleteAlert(parsed.data.id, email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Alerts Delete] Error:', error)
    return NextResponse.json({ error: 'Failed to delete alert. Please try again.' }, { status: 500 })
  }
}
