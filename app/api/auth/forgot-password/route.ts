import { NextRequest, NextResponse } from 'next/server'
import { createResetToken } from '@/lib/password-reset'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 3 requests per email per hour
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 3

function isRateLimited(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const timestamps = rateLimitMap.get(key) || []

  // Remove timestamps outside the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX) {
    return true
  }

  recent.push(now)
  rateLimitMap.set(key, recent)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      // Still return success to prevent enumeration
      return NextResponse.json({ success: true })
    }

    // Rate limit per email
    if (isRateLimited(email)) {
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
