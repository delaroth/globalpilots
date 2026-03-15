import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// In-memory rate limiter — 3 submissions per minute per IP
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 })
    return true
  }

  if (entry.count >= 3) {
    return false
  }

  entry.count++
  return true
}

// ---------------------------------------------------------------------------
// POST /api/feedback
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 },
      )
    }

    const body = await request.json()

    const {
      type,
      message,
      steps_to_reproduce,
      rating,
      would_recommend,
      email,
      page_url,
      user_agent,
      screen_size,
      user_id,
      navigation_history,
    } = body

    // Validate required fields
    if (!type || !['bug', 'feedback'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type.' },
        { status: 400 },
      )
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 },
      )
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long. Please keep it under 5000 characters.' },
        { status: 400 },
      )
    }

    if (rating !== undefined && rating !== null) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5.' },
          { status: 400 },
        )
      }
    }

    // Build the row for Supabase
    const row = {
      type,
      message: message.trim(),
      steps_to_reproduce: steps_to_reproduce?.trim() || null,
      rating: rating || null,
      would_recommend: would_recommend ?? null,
      email: email?.trim() || null,
      page_url: page_url || null,
      user_agent: user_agent || null,
      screen_size: screen_size || null,
      user_id: user_id || null,
      navigation_history: Array.isArray(navigation_history)
        ? navigation_history.slice(0, 5)
        : null,
    }

    const supabase = getSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase.from('feedback') as any).insert([row])

    if (dbError) {
      console.error('[Feedback] Supabase error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save feedback. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Feedback] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    )
  }
}
