// ─── Server-side data access layer ───
// Reads/writes user data from Supabase instead of localStorage.
// All functions use the Supabase service role client and handle errors gracefully.

import { supabase } from './supabase'
import type { SavedTrip } from './trip-history'
import type { PassportStamp, PassportBadge } from './travel-passport'
import { computeStats } from './travel-passport'

// ─── Trips ───

/**
 * Fetch all saved trips for a user from Supabase.
 */
export async function getUserTrips(userId: string): Promise<SavedTrip[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('saved_trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[user-data] getUserTrips error:', error)
      return []
    }

    // Map Supabase rows back to SavedTrip shape
    return (data || []).map((row: any) => ({
      ...row.destination_data,
      id: row.id,
    }))
  } catch (err) {
    console.error('[user-data] getUserTrips exception:', err)
    return []
  }
}

/**
 * Save a single trip to Supabase.
 */
export async function saveUserTrip(
  userId: string,
  trip: SavedTrip
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('saved_trips')
      .insert({
        user_id: userId,
        destination_data: trip,
        trip_name: trip.destination,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[user-data] saveUserTrip error:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[user-data] saveUserTrip exception:', err)
    return null
  }
}

// ─── Passport ───

/**
 * Fetch stamps + badges for a user from Supabase.
 */
export async function getUserPassport(
  userId: string
): Promise<{ stamps: PassportStamp[]; badges: PassportBadge[] }> {
  try {
    const [stampsResult, badgesResult] = await Promise.all([
      (supabase as any)
        .from('passport_stamps')
        .select('*')
        .eq('user_id', userId)
        .order('revealed_at', { ascending: false }),
      (supabase as any)
        .from('passport_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false }),
    ])

    const stamps: PassportStamp[] = (stampsResult.data || []).map(
      (row: any) => ({
        id: row.id,
        destination: row.destination,
        country: row.country,
        countryCode: row.country_code,
        iata: row.iata,
        flag: row.flag || '',
        revealedAt: row.revealed_at,
        departDate: row.depart_date,
        totalCost: Number(row.total_cost),
        isBooked: row.is_booked,
        bookedAt: row.booked_at ?? undefined,
        bookingClicks: row.booking_clicks || [],
        badge: row.badge ?? undefined,
      })
    )

    const badges: PassportBadge[] = (badgesResult.data || []).map(
      (row: any) => ({
        id: row.badge_id,
        name: row.name,
        emoji: row.emoji,
        description: row.description,
        earnedAt: row.earned_at,
      })
    )

    return { stamps, badges }
  } catch (err) {
    console.error('[user-data] getUserPassport exception:', err)
    return { stamps: [], badges: [] }
  }
}

/**
 * Insert a single passport stamp for a user.
 */
export async function addUserStamp(
  userId: string,
  stamp: PassportStamp
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('passport_stamps')
      .insert({
        user_id: userId,
        destination: stamp.destination,
        country: stamp.country,
        country_code: stamp.countryCode,
        iata: stamp.iata,
        flag: stamp.flag,
        revealed_at: stamp.revealedAt,
        depart_date: stamp.departDate,
        total_cost: stamp.totalCost,
        is_booked: stamp.isBooked,
        booked_at: stamp.bookedAt ?? null,
        booking_clicks: stamp.bookingClicks,
        badge: stamp.badge ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[user-data] addUserStamp error:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[user-data] addUserStamp exception:', err)
    return null
  }
}

// ─── Stats ───

/**
 * Compute stats from a user's passport stamps (server-side).
 */
export async function getUserStats(userId: string) {
  try {
    const { stamps } = await getUserPassport(userId)
    return computeStats(stamps)
  } catch (err) {
    console.error('[user-data] getUserStats exception:', err)
    return {
      totalReveals: 0,
      totalBooked: 0,
      countriesVisited: 0,
      continentsVisited: 0,
      totalSpent: 0,
      favoriteRegion: 'None yet',
      adventureScore: 0,
    }
  }
}
