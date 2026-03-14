import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

const FALLBACK_RESPONSE = {
  weeklyReveals: 500,
  topDestinations: ['Bangkok', 'Bali', 'Lisbon'],
  lastRevealMinutesAgo: 5,
  isFallback: true,
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Count reveals in the last 7 days
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    const [countResult, topResult, lastRevealResult] = await Promise.all([
      // Total reveals this week
      supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'destination_revealed')
        .gte('created_at', sevenDaysAgo),

      // Top 3 destinations this week (fetch recent reveals and aggregate in JS
      // since Supabase JS client doesn't support group-by directly)
      supabase
        .from('activity_feed')
        .select('data')
        .eq('activity_type', 'destination_revealed')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(200),

      // Most recent reveal for "last reveal X min ago"
      supabase
        .from('activity_feed')
        .select('created_at')
        .eq('activity_type', 'destination_revealed')
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    // If the count query failed, return fallback
    if (countResult.error) {
      console.error('Social proof count query failed:', countResult.error)
      return NextResponse.json(FALLBACK_RESPONSE, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      })
    }

    const weeklyReveals = countResult.count ?? 0

    // Aggregate top destinations from recent reveals
    const destinationCounts = new Map<string, number>()
    if (topResult.data) {
      for (const row of topResult.data as any[]) {
        const dest = row.data?.destination
        if (dest) {
          destinationCounts.set(dest, (destinationCounts.get(dest) || 0) + 1)
        }
      }
    }
    const topDestinations = Array.from(destinationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dest]) => dest)

    // Calculate minutes since last reveal
    let lastRevealMinutesAgo = 5 // default
    const lastRevealData = lastRevealResult.data as any[] | null
    if (lastRevealData?.[0]?.created_at) {
      const lastRevealTime = new Date(
        lastRevealData[0].created_at
      ).getTime()
      lastRevealMinutesAgo = Math.max(
        1,
        Math.round((Date.now() - lastRevealTime) / 60000)
      )
    }

    return NextResponse.json(
      {
        weeklyReveals,
        topDestinations:
          topDestinations.length > 0
            ? topDestinations
            : ['Bangkok', 'Bali', 'Lisbon'],
        lastRevealMinutesAgo,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Social proof endpoint error:', error)
    return NextResponse.json(FALLBACK_RESPONSE, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  }
}
