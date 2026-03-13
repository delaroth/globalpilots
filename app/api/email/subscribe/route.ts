import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

/*
SQL Schema for reference:

CREATE TABLE email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  origin TEXT,
  destinations TEXT[],
  max_price INTEGER,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT false,
  unsubscribe_token UUID DEFAULT gen_random_uuid()
);

CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_unsubscribe_token ON email_subscribers(unsubscribe_token);
*/

interface SubscribeRequest {
  email: string
  origin?: string
  destinations?: string[]
  maxPrice?: number
}

// Simple in-memory rate limiter (resets on server restart)
// In production, use Redis or Supabase for persistence
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 1 hour window
    return true
  }

  if (entry.count >= 3) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json()
    const { email, origin, destinations, maxPrice } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Rate limit: max 3 subscribe requests per email per hour
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many subscription requests. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('[Email Subscribe] Subscribing:', { email, origin, destinations, maxPrice })

    const supabase = getSupabase()

    // Upsert to email_subscribers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('email_subscribers')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          origin: origin || null,
          destinations: destinations && destinations.length > 0 ? destinations : null,
          max_price: maxPrice || null,
          subscribed_at: new Date().toISOString(),
          confirmed: false,
        },
        {
          onConflict: 'email',
        }
      )
      .select('id, email, origin, destinations, max_price, subscribed_at, unsubscribe_token')
      .single()

    if (error) {
      console.error('[Email Subscribe] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription. Please try again.' },
        { status: 500 }
      )
    }

    // Send welcome/confirmation email via Resend
    const emailSent = await sendWelcomeEmail(
      data?.email,
      data?.unsubscribe_token
    )

    if (emailSent) {
      console.log('[Email Subscribe] Welcome email sent to:', data?.email)
    } else {
      console.warn('[Email Subscribe] Welcome email not sent (Resend may not be configured)')
    }

    console.log('[Email Subscribe] Subscribed successfully:', data?.email)

    return NextResponse.json({
      success: true,
      subscriber: {
        email: data?.email,
        origin: data?.origin,
        destinations: data?.destinations,
        maxPrice: data?.max_price,
        subscribedAt: data?.subscribed_at,
      },
      emailSent,
    })
  } catch (error) {
    console.error('[Email Subscribe] Error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
