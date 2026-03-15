import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabase } from '@/lib/supabase'
import type { SavedTrip } from '@/lib/trip-history'
import type { PassportStamp, PassportBadge } from '@/lib/travel-passport'

// ─── Simple in-memory rate limiter (3 requests/minute per user) ───
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(userId) || []
  // Remove timestamps outside the window
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    return false
  }
  recent.push(now)
  rateLimitMap.set(userId, recent)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // ── Rate limit ──
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429 }
      )
    }

    // ── Parse body ──
    const body = await request.json()
    const {
      trips,
      passport,
    }: {
      trips?: SavedTrip[]
      passport?: { stamps?: PassportStamp[]; badges?: PassportBadge[] }
    } = body

    const migrated = { trips: 0, stamps: 0, badges: 0 }

    // ── Migrate trips ──
    if (Array.isArray(trips) && trips.length > 0) {
      const tripRows = trips.map((trip) => ({
        user_id: userId,
        destination_data: trip,
        trip_name: trip.destination || null,
      }))

      const { data, error } = await (supabase as any)
        .from('saved_trips')
        .insert(tripRows)
        .select('id')

      if (error) {
        console.error('[migrate] trips insert error:', error)
      } else {
        migrated.trips = data?.length || 0
      }
    }

    // ── Migrate stamps ──
    const stamps = passport?.stamps
    if (Array.isArray(stamps) && stamps.length > 0) {
      const stampRows = stamps.map((stamp) => ({
        user_id: userId,
        destination: stamp.destination,
        country: stamp.country,
        country_code: stamp.countryCode,
        iata: stamp.iata,
        flag: stamp.flag || '',
        revealed_at: stamp.revealedAt,
        depart_date: stamp.departDate,
        total_cost: stamp.totalCost,
        is_booked: stamp.isBooked,
        booked_at: stamp.bookedAt ?? null,
        booking_clicks: stamp.bookingClicks || [],
        badge: stamp.badge ?? null,
      }))

      const { data, error } = await (supabase as any)
        .from('passport_stamps')
        .insert(stampRows)
        .select('id')

      if (error) {
        console.error('[migrate] stamps insert error:', error)
      } else {
        migrated.stamps = data?.length || 0
      }
    }

    // ── Migrate badges ──
    const badges = passport?.badges
    if (Array.isArray(badges) && badges.length > 0) {
      const badgeRows = badges.map((badge) => ({
        user_id: userId,
        badge_id: badge.id,
        name: badge.name,
        emoji: badge.emoji,
        description: badge.description,
        earned_at: badge.earnedAt,
      }))

      const { data, error } = await (supabase as any)
        .from('passport_badges')
        .insert(badgeRows)
        .select('id')

      if (error) {
        console.error('[migrate] badges insert error:', error)
      } else {
        migrated.badges = data?.length || 0
      }
    }

    // ── Update user statistics ──
    try {
      await (supabase as any).rpc('update_user_statistics', {
        p_user_id: userId,
      })
    } catch {
      // Non-critical — stats will be recalculated on next dashboard load
    }

    return NextResponse.json({ migrated })
  } catch (error) {
    console.error('[migrate] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Migration failed. Please try again.' },
      { status: 500 }
    )
  }
}
