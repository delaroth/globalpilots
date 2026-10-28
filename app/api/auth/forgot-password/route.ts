import { NextRequest, NextResponse } from 'next/server'
import { createResetToken } from '@/lib/password-reset'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}))

    if (!email || typeof email !== 'string') {
      // Still return success to prevent enumeration
      return NextResponse.json({ success: true })
    }

    // Rate limit per IP and per email (createResetToken also enforces a
    // DB-backed per-account cap, which survives cold starts)
    const ipLimit = await rateLimitAsync(`forgot-ip:${getClientIp(request)}`, 10, 60 * 60 * 1000)
    const emailLimit = await rateLimitAsync(`forgot-email:${email.trim().toLowerCase()}`, 3, 60 * 60 * 1000)
    if (!ipLimit.success || !emailLimit.success) {
      // Return success even if rate-limited (anti-enumeration)
      return NextResponse.json({ success: true })
    }

    await createResetToken(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    // Always return success
    return NextResponse.json({ success: true })
  }
}
