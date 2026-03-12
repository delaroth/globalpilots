import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required parameter: email' },
        { status: 400 }
      )
    }

    console.log('[Alerts List] Fetching alerts for:', email)

    // Fetch alerts from Supabase
    const { data, error } = await (supabase as any)
      .from('price_alerts')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Alerts List] Supabase error:', error)
      throw new Error('Failed to fetch alerts from database')
    }

    console.log('[Alerts List] ✅ Found', data.length, 'alerts')

    // Transform to frontend format
    const alerts = data.map((alert: any) => ({
      id: alert.id,
      email: alert.email,
      origin: alert.origin,
      destination: alert.destination,
      targetPrice: alert.target_price,
      createdAt: alert.created_at,
      isActive: alert.is_active,
      lastCheckedAt: alert.last_checked_at,
      lastNotifiedAt: alert.last_notified_at,
    }))

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('[Alerts List] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
