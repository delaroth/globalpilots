import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface SubscribeRequest {
  email: string
  source: string // 'mystery', 'alerts', 'blog', etc.
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json()
    const { email, source } = body

    // Validate required fields
    if (!email || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: email, source' },
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

    console.log('[Email Subscribe] Subscribing:', { email, source })

    // Upsert to email_subscribers (update if exists, insert if new)
    const { data, error } = await (supabase as any)
      .from('email_subscribers')
      .upsert({
        email,
        source,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'email' // Update on email conflict
      })
      .select()
      .single()

    if (error) {
      console.error('[Email Subscribe] Supabase error:', error)
      throw new Error('Failed to subscribe email')
    }

    console.log('[Email Subscribe] ✅ Email subscribed successfully')

    return NextResponse.json({
      success: true,
      subscriber: {
        email: data.email,
        source: data.source,
        createdAt: data.created_at
      }
    })

  } catch (error) {
    console.error('[Email Subscribe] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe email'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
