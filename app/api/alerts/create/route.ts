import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabase } from '@/lib/supabase'
import { trackActivity } from '@/lib/activity-feed'

export const dynamic = 'force-dynamic'

interface CreateAlertRequest {
  email: string
  origin: string
  destination: string
  targetPrice: number
  flexibleDates?: boolean
  dateRangeDays?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body: CreateAlertRequest = await request.json()
    const { email, origin, destination, targetPrice, flexibleDates, dateRangeDays } = body

    // Validate required fields
    if (!email || !origin || !destination || !targetPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: email, origin, destination, targetPrice' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate IATA codes
    if (!/^[A-Z]{3}$/.test(origin)) {
      return NextResponse.json(
        { error: 'origin must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)' },
        { status: 400 }
      )
    }

    if (!/^[A-Z]{3}$/.test(destination)) {
      return NextResponse.json(
        { error: 'destination must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)' },
        { status: 400 }
      )
    }

    // Validate target price
    if (targetPrice <= 0) {
      return NextResponse.json(
        { error: 'Target price must be greater than 0' },
        { status: 400 }
      )
    }

    console.log('[Alerts Create] Creating alert:', { email, origin, destination, targetPrice, flexibleDates })

    // Insert into Supabase
    const { data, error} = await (supabase as any)
      .from('price_alerts')
      .insert([
        {
          email,
          origin,
          destination,
          target_price: targetPrice,
          is_active: true,
          user_id: session?.user?.id || null,
          flexible_dates: flexibleDates || false,
          date_range_days: flexibleDates ? (dateRangeDays || 3) : 0,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('[Alerts Create] Supabase error:', error)
      throw new Error('Failed to create alert in database')
    }

    console.log('[Alerts Create] ✅ Alert created successfully:', data.id)

    // Track activity (anonymized)
    const userCity = 'Unknown' // Could geocode IP in future
    const userFirstName = session?.user?.name?.split(' ')[0] || 'Someone'
    await trackActivity('alert_created', {
      route: `${origin}-${destination}`,
      user_city: userCity,
      user_first_name: userFirstName,
    })

    return NextResponse.json({
      success: true,
      alert: {
        id: data.id,
        email: data.email,
        origin: data.origin,
        destination: data.destination,
        targetPrice: data.target_price,
        flexibleDates: data.flexible_dates,
        dateRangeDays: data.date_range_days,
        createdAt: data.created_at,
        isActive: data.is_active,
      }
    })
  } catch (error) {
    console.error('[Alerts Create] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create alert'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
