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

    // --- New analytics queries (each wrapped in try/catch) ---

    // 1. Feature popularity — event_type counts from user_events (last 7 days)
    let featurePopularity: { event_type: string; count: number }[] = []
    try {
      const { data: eventsRaw } = await (supabase
        .from('user_events') as any)
        .select('event_type')
        .gte('created_at', sevenDaysAgo)
      if (eventsRaw) {
        const counts: Record<string, number> = {}
        for (const row of eventsRaw as any[]) {
          counts[row.event_type] = (counts[row.event_type] || 0) + 1
        }
        featurePopularity = Object.entries(counts)
          .map(([event_type, count]) => ({ event_type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
      }
    } catch (e) {
      console.error('[Admin Analytics] featurePopularity error:', e)
    }

    // 2. Top origins — most searched departure airports (last 7 days)
    let topOrigins: { origin: string; count: number }[] = []
    try {
      const { data: originRaw } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .in('event_type', ['mystery_search', 'flight_search', 'stopover_search'])
        .gte('created_at', sevenDaysAgo)
      if (originRaw) {
        const counts: Record<string, number> = {}
        for (const row of originRaw as any[]) {
          const origin = row.event_data?.origin
          if (origin) counts[origin] = (counts[origin] || 0) + 1
        }
        topOrigins = Object.entries(counts)
          .map(([origin, count]) => ({ origin, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    } catch (e) {
      console.error('[Admin Analytics] topOrigins error:', e)
    }

    // 3. Top vibes — most popular mystery vibes (last 7 days)
    let topVibes: { vibe: string; count: number }[] = []
    try {
      const { data: vibeRaw } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .eq('event_type', 'mystery_search')
        .gte('created_at', sevenDaysAgo)
      if (vibeRaw) {
        const counts: Record<string, number> = {}
        for (const row of vibeRaw as any[]) {
          const vibes = row.event_data?.vibes
          if (Array.isArray(vibes)) {
            for (const v of vibes) {
              if (v) counts[v] = (counts[v] || 0) + 1
            }
          }
        }
        topVibes = Object.entries(counts)
          .map(([vibe, count]) => ({ vibe, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    } catch (e) {
      console.error('[Admin Analytics] topVibes error:', e)
    }

    // 4. Budget distribution from mystery_search events
    let budgetDistribution = { under_500: 0, range_500_1000: 0, range_1000_2000: 0, over_2000: 0 }
    try {
      const { data: budgetRaw } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .eq('event_type', 'mystery_search')
      if (budgetRaw) {
        for (const row of budgetRaw as any[]) {
          const budget = parseFloat(row.event_data?.budget)
          if (isNaN(budget)) continue
          if (budget < 500) budgetDistribution.under_500++
          else if (budget <= 1000) budgetDistribution.range_500_1000++
          else if (budget <= 2000) budgetDistribution.range_1000_2000++
          else budgetDistribution.over_2000++
        }
      }
    } catch (e) {
      console.error('[Admin Analytics] budgetDistribution error:', e)
    }

    // 5. Top pages — page_view events in the last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    let topPages: { page: string; count: number }[] = []
    try {
      const { data: pageRaw } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .eq('event_type', 'page_view')
        .gte('created_at', twentyFourHoursAgo)
      if (pageRaw) {
        const counts: Record<string, number> = {}
        for (const row of pageRaw as any[]) {
          const url = row.event_data?.url
          if (url) counts[url] = (counts[url] || 0) + 1
        }
        topPages = Object.entries(counts)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    } catch (e) {
      console.error('[Admin Analytics] topPages error:', e)
    }

    // 6. Conversion funnel — distinct sessions at each step
    let conversionFunnel = { page_views: 0, searches: 0, reveals: 0 }
    try {
      // Page views on /mystery
      const { data: funnelPageViews } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .eq('event_type', 'page_view')
        .gte('created_at', sevenDaysAgo)
      if (funnelPageViews) {
        const sessions = new Set<string>()
        for (const row of funnelPageViews as any[]) {
          const url = row.event_data?.url || ''
          const sessionId = row.event_data?.session_id
          if (url.includes('/mystery') && sessionId) sessions.add(sessionId)
        }
        conversionFunnel.page_views = sessions.size || (funnelPageViews as any[]).filter(
          (r: any) => (r.event_data?.url || '').includes('/mystery')
        ).length
      }

      // Mystery searches
      const { count: searchCount } = await (supabase
        .from('user_events') as any)
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'mystery_search')
        .gte('created_at', sevenDaysAgo)
      conversionFunnel.searches = searchCount || 0

      // Destination reveals
      const { count: revealCount } = await supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'destination_revealed')
        .gte('created_at', sevenDaysAgo)
      conversionFunnel.reveals = revealCount || 0
    } catch (e) {
      console.error('[Admin Analytics] conversionFunnel error:', e)
    }

    // 7. Feedback summary — recent feedback entries
    let feedbackSummary: any[] = []
    try {
      const { data: feedbackRaw } = await (supabase
        .from('feedback') as any)
        .select('type, message, rating, would_recommend, page_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      feedbackSummary = feedbackRaw || []
    } catch (e) {
      console.error('[Admin Analytics] feedbackSummary error:', e)
    }

    // 8. Average feedback rating
    let avgRating = { avg: 0, count: 0 }
    try {
      const { data: ratingRaw } = await (supabase
        .from('feedback') as any)
        .select('rating')
        .not('rating', 'is', null)
      if (ratingRaw && ratingRaw.length > 0) {
        const total = (ratingRaw as any[]).reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
        avgRating = { avg: parseFloat((total / ratingRaw.length).toFixed(2)), count: ratingRaw.length }
      }
    } catch (e) {
      console.error('[Admin Analytics] avgRating error:', e)
    }

    // 9. Top cached destinations
    let topCachedDestinations: { iata: string; city: string; country: string; reveal_count: number }[] = []
    try {
      const { data: cacheRaw } = await (supabase
        .from('destination_cache') as any)
        .select('iata, city, country, reveal_count')
        .order('reveal_count', { ascending: false })
        .limit(10)
      topCachedDestinations = cacheRaw || []
    } catch (e) {
      console.error('[Admin Analytics] topCachedDestinations error:', e)
    }

    // --- Enhanced analytics (Task 4) ---

    // 10. Navigation heatmap — which nav links get clicked most (7d)
    let navHeatmap: { link: string; category: string; count: number }[] = []
    try {
      const { data: navRaw } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .eq('event_type', 'nav_click')
        .gte('created_at', sevenDaysAgo)
      if (navRaw) {
        const counts: Record<string, { link: string; category: string; count: number }> = {}
        for (const row of navRaw as any[]) {
          const label = row.event_data?.label || 'unknown'
          const category = row.event_data?.category || 'other'
          const key = `${category}::${label}`
          if (!counts[key]) counts[key] = { link: label, category, count: 0 }
          counts[key].count++
        }
        navHeatmap = Object.values(counts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
      }
    } catch (e) {
      console.error('[Admin Analytics] navHeatmap error:', e)
    }

    // 11. Detailed conversion funnel — per feature path
    let detailedFunnel: {
      mystery: { page_views: number; searches: number; reveals: number; bookings: number }
      flights: { page_views: number; searches: number; bookings: number }
      deals: { page_views: number; views: number; bookings: number }
    } = {
      mystery: { page_views: 0, searches: 0, reveals: 0, bookings: 0 },
      flights: { page_views: 0, searches: 0, bookings: 0 },
      deals: { page_views: 0, views: 0, bookings: 0 },
    }
    try {
      // Fetch all relevant events in one go for the last 7 days
      const { data: funnelRaw } = await (supabase
        .from('user_events') as any)
        .select('event_type, event_data')
        .gte('created_at', sevenDaysAgo)
        .in('event_type', [
          'page_view', 'mystery_search', 'flight_search',
          'conversion', 'feature_use',
        ])
      if (funnelRaw) {
        for (const row of funnelRaw as any[]) {
          const url = row.event_data?.url || ''
          const convType = row.event_data?.conversion_type || ''

          // Mystery funnel
          if (row.event_type === 'page_view' && url.includes('/mystery')) detailedFunnel.mystery.page_views++
          if (row.event_type === 'mystery_search') detailedFunnel.mystery.searches++
          if (row.event_type === 'conversion' && convType === 'mystery_revealed') detailedFunnel.mystery.reveals++
          if (row.event_type === 'conversion' && convType === 'booking_clicked' && (row.event_data?.source === 'mystery' || url.includes('/mystery'))) {
            detailedFunnel.mystery.bookings++
          }

          // Flight search funnel
          if (row.event_type === 'page_view' && url.includes('/search')) detailedFunnel.flights.page_views++
          if (row.event_type === 'flight_search') detailedFunnel.flights.searches++
          if (row.event_type === 'conversion' && convType === 'booking_clicked' && (row.event_data?.source === 'flights' || url.includes('/search'))) {
            detailedFunnel.flights.bookings++
          }

          // Deals funnel
          if (row.event_type === 'page_view' && url.includes('/deals')) detailedFunnel.deals.page_views++
          if (row.event_type === 'feature_use' && row.event_data?.feature === 'deals_viewed') detailedFunnel.deals.views++
          if (row.event_type === 'conversion' && convType === 'booking_clicked' && (row.event_data?.source === 'deals' || url.includes('/deals'))) {
            detailedFunnel.deals.bookings++
          }
        }
      }

      // Also count reveals from activity_feed for mystery funnel if conversion events are sparse
      if (detailedFunnel.mystery.reveals === 0) {
        const { count: activityReveals } = await supabase
          .from('activity_feed')
          .select('*', { count: 'exact', head: true })
          .eq('activity_type', 'destination_revealed')
          .gte('created_at', sevenDaysAgo)
        detailedFunnel.mystery.reveals = activityReveals || 0
      }
    } catch (e) {
      console.error('[Admin Analytics] detailedFunnel error:', e)
    }

    // 12. Feature engagement — which features keep users engaged
    let featureEngagement: { feature: string; avg_duration: number; completed: number; total: number }[] = []
    try {
      const { data: engagementRaw } = await (supabase
        .from('user_events') as any)
        .select('event_data')
        .eq('event_type', 'feature_engagement')
      if (engagementRaw && engagementRaw.length > 0) {
        const groups: Record<string, { durations: number[]; completed: number; total: number }> = {}
        for (const row of engagementRaw as any[]) {
          const feature = row.event_data?.feature || 'unknown'
          if (!groups[feature]) groups[feature] = { durations: [], completed: 0, total: 0 }
          groups[feature].total++
          const dur = parseInt(row.event_data?.durationMs)
          if (!isNaN(dur)) groups[feature].durations.push(dur)
          if (row.event_data?.completed === true || row.event_data?.completed === 'true') {
            groups[feature].completed++
          }
        }
        featureEngagement = Object.entries(groups)
          .map(([feature, g]) => ({
            feature,
            avg_duration: g.durations.length > 0
              ? Math.round(g.durations.reduce((a, b) => a + b, 0) / g.durations.length)
              : 0,
            completed: g.completed,
            total: g.total,
          }))
          .sort((a, b) => b.total - a.total)
      }
    } catch (e) {
      console.error('[Admin Analytics] featureEngagement error:', e)
    }

    // 13. User retention — sessions with >1 page view
    let userRetention = { total_sessions: 0, engaged_sessions: 0, avg_pages_per_session: 0, bounce_rate: 0 }
    try {
      const { data: sessionRaw } = await (supabase
        .from('user_events') as any)
        .select('session_id')
        .eq('event_type', 'page_view')
        .gte('created_at', sevenDaysAgo)
        .not('session_id', 'is', null)
      if (sessionRaw && sessionRaw.length > 0) {
        const sessionCounts: Record<string, number> = {}
        for (const row of sessionRaw as any[]) {
          const sid = row.session_id
          if (sid) sessionCounts[sid] = (sessionCounts[sid] || 0) + 1
        }
        const sessions = Object.values(sessionCounts)
        const totalSessions = sessions.length
        const engagedSessions = sessions.filter(c => c > 1).length
        const totalPageViews = sessions.reduce((a, b) => a + b, 0)
        const bounceSessions = sessions.filter(c => c === 1).length
        userRetention = {
          total_sessions: totalSessions,
          engaged_sessions: engagedSessions,
          avg_pages_per_session: totalSessions > 0
            ? parseFloat((totalPageViews / totalSessions).toFixed(1))
            : 0,
          bounce_rate: totalSessions > 0
            ? parseFloat(((bounceSessions / totalSessions) * 100).toFixed(1))
            : 0,
        }
      }
    } catch (e) {
      console.error('[Admin Analytics] userRetention error:', e)
    }

    // 14. Drop-off points — pages with high exit rates (last page_view per session)
    let dropOffPoints: { page: string; exits: number; total_views: number; exit_rate: number }[] = []
    try {
      const { data: dropOffRaw } = await (supabase
        .from('user_events') as any)
        .select('session_id, event_data, created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', sevenDaysAgo)
        .not('session_id', 'is', null)
        .order('created_at', { ascending: true })
      if (dropOffRaw && dropOffRaw.length > 0) {
        // Track total views per page and last page per session
        const pageTotalViews: Record<string, number> = {}
        const lastPagePerSession: Record<string, string> = {}
        for (const row of dropOffRaw as any[]) {
          const url = row.event_data?.url || 'unknown'
          const sid = row.session_id
          pageTotalViews[url] = (pageTotalViews[url] || 0) + 1
          if (sid) lastPagePerSession[sid] = url
        }
        // Count exits per page
        const pageExits: Record<string, number> = {}
        for (const page of Object.values(lastPagePerSession)) {
          pageExits[page] = (pageExits[page] || 0) + 1
        }
        dropOffPoints = Object.entries(pageExits)
          .map(([page, exits]) => ({
            page,
            exits,
            total_views: pageTotalViews[page] || exits,
            exit_rate: pageTotalViews[page] > 0
              ? parseFloat(((exits / pageTotalViews[page]) * 100).toFixed(1))
              : 0,
          }))
          .sort((a, b) => b.exits - a.exits)
          .slice(0, 10)
      }
    } catch (e) {
      console.error('[Admin Analytics] dropOffPoints error:', e)
    }

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
      featurePopularity,
      topOrigins,
      topVibes,
      budgetDistribution,
      topPages,
      conversionFunnel,
      feedbackSummary,
      avgRating,
      topCachedDestinations,
      navHeatmap,
      detailedFunnel,
      featureEngagement,
      userRetention,
      dropOffPoints,
    })
  } catch (error) {
    console.error('[Admin Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
