import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getSerpApiUsage } from '@/lib/flight-providers/serpapi'
import { getCacheStats } from '@/lib/cache'

export const dynamic = 'force-dynamic'

function maskEmail(email: string): string {
  if (!email) return '***'
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const visible = local.slice(0, 3)
  return `${visible}***@${domain}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Run all Supabase queries in parallel
    const [
      totalUsersRes,
      usersTodayRes,
      usersThisWeekRes,
      googleOAuthRes,
      emailSignupRes,
      emailVerifiedRes,
      emailUnverifiedRes,
      totalTripsRes,
      totalActivityRes,
      activityTodayRes,
      popularDestinationsRes,
      activeAlertsRes,
      inactiveAlertsRes,
      recentSignupsRes,
      recentActivityRes,
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('*', { count: 'exact', head: true }),
      // Users today
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      // Users this week
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      // Google OAuth count
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('auth_provider', 'google'),
      // Email signup count
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('auth_provider', 'email'),
      // Email verified count
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('email_verified', true),
      // Email unverified count
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('email_verified', false),
      // Total saved trips
      supabase.from('saved_trips').select('*', { count: 'exact', head: true }),
      // Total activity feed entries
      supabase.from('activity_feed').select('*', { count: 'exact', head: true }),
      // Activity feed entries today
      supabase.from('activity_feed').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      // Most popular destinations (destination_revealed grouped by destination)
      supabase
        .from('activity_feed')
        .select('data')
        .eq('activity_type', 'destination_revealed')
        .order('created_at', { ascending: false })
        .limit(500),
      // Active price alerts
      supabase.from('price_alerts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      // Inactive price alerts
      supabase.from('price_alerts').select('*', { count: 'exact', head: true }).eq('is_active', false),
      // Recent signups (last 10)
      supabase
        .from('users')
        .select('name, email, created_at, auth_provider')
        .order('created_at', { ascending: false })
        .limit(10),
      // Recent activity feed (last 10)
      supabase
        .from('activity_feed')
        .select('activity_type, data, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Aggregate popular destinations from raw data
    const destinationCounts: Record<string, number> = {}
    const destEntries = (popularDestinationsRes.data || []) as any[]
    for (const entry of destEntries) {
      const dest = entry.data?.destination || 'Unknown'
      const country = entry.data?.country || ''
      const key = country ? `${dest}, ${country}` : dest
      destinationCounts[key] = (destinationCounts[key] || 0) + 1
    }
    const popularDestinations = Object.entries(destinationCounts)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Mask emails for recent signups
    const recentSignups = (recentSignupsRes.data || []).map((user: any) => ({
      name: user.name || 'Anonymous',
      email: maskEmail(user.email),
      created_at: user.created_at,
      auth_provider: user.auth_provider,
    }))

    // SerpApi usage
    const serpApiUsage = getSerpApiUsage()

    // Cache stats
    const cacheStats = getCacheStats()

    // System info
    const memUsage = process.memoryUsage()

    return NextResponse.json({
      users: {
        total: totalUsersRes.count || 0,
        today: usersTodayRes.count || 0,
        thisWeek: usersThisWeekRes.count || 0,
        googleOAuth: googleOAuthRes.count || 0,
        emailSignup: emailSignupRes.count || 0,
        emailVerified: emailVerifiedRes.count || 0,
        emailUnverified: emailUnverifiedRes.count || 0,
      },
      trips: {
        total: totalTripsRes.count || 0,
      },
      activity: {
        total: totalActivityRes.count || 0,
        today: activityTodayRes.count || 0,
        popularDestinations,
        recent: recentActivityRes.data || [],
      },
      alerts: {
        active: activeAlertsRes.count || 0,
        inactive: inactiveAlertsRes.count || 0,
        total: (activeAlertsRes.count || 0) + (inactiveAlertsRes.count || 0),
      },
      recentSignups,
      serpApi: serpApiUsage,
      cache: cacheStats,
      system: {
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
        },
        nodeVersion: process.version,
        timestamp: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Admin Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
