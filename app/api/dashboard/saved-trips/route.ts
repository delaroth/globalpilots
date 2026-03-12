import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's saved trips
    const { data: trips, error } = await (supabase as any)
      .from('saved_trips')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching saved trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved trips' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { destination_data, trip_name, notes } = body

    // Save trip
    const { data: trip, error } = await (supabase as any)
      .from('saved_trips')
      .insert({
        user_id: session.user.id,
        destination_data,
        trip_name,
        notes,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update user statistics
    await (supabase as any).rpc('update_user_statistics', { p_user_id: session.user.id })

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Error saving trip:', error)
    return NextResponse.json(
      { error: 'Failed to save trip' },
      { status: 500 }
    )
  }
}
