import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing trip ID' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid trip ID format' },
        { status: 400 }
      )
    }

    const { data: trip, error } = await (supabase as any)
      .from('saved_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !trip) {
      console.error('[TripFetch] Trip not found:', id)
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: trip.id,
      tripName: trip.trip_name,
      destinationData: trip.destination_data,
      createdAt: trip.created_at,
    })
  } catch (error) {
    console.error('[TripFetch] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}
