import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destination, origin, departDate, vibe } = body

    if (!destination || !destination.destination || !destination.city_code_IATA) {
      return NextResponse.json(
        { error: 'Invalid trip data — missing destination info' },
        { status: 400 }
      )
    }

    // Compute total cost for trip name
    const totalCost = destination.budgetBreakdown?.total
      || (destination.budget_breakdown
        ? Object.values(destination.budget_breakdown as Record<string, number>).reduce((sum: number, val: number) => sum + val, 0)
        : destination.estimated_flight_cost + (destination.estimated_hotel_per_night * 3))

    const tripName = `Mystery Trip: ${destination.destination}, ${destination.country} — $${Math.round(totalCost)}`

    // Store everything in destination_data JSONB
    const destinationData = {
      ...destination,
      _meta: {
        origin,
        departDate,
        vibe,
        sharedAt: new Date().toISOString(),
        totalCost: Math.round(totalCost),
      },
    }

    // Insert with user_id=null for anonymous shares
    const { data: trip, error } = await (supabase as any)
      .from('saved_trips')
      .insert({
        user_id: null,
        destination_data: destinationData,
        trip_name: tripName,
        notes: `Shared mystery trip to ${destination.destination}`,
        is_favorite: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[TripSave] Supabase error:', error)
      throw error
    }

    console.log('[TripSave] Trip saved with id:', trip.id)

    return NextResponse.json({ id: trip.id, tripName })
  } catch (error) {
    console.error('[TripSave] Error saving trip:', error)
    return NextResponse.json(
      { error: 'Failed to save trip' },
      { status: 500 }
    )
  }
}
