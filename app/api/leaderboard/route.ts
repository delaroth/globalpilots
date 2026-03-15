import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

interface LeaderboardEntry {
  rank: number
  destination: string
  country: string
  totalCost: number
  discoveredAt: string
  travelerName: string
  badges: string[]
}

const FALLBACK_DATA: LeaderboardEntry[] = [
  { rank: 1, destination: 'Hanoi', country: 'Vietnam', totalCost: 287, discoveredAt: '2026-03-14', travelerName: 'Traveler #412', badges: ['cheapest'] },
  { rank: 2, destination: 'Tbilisi', country: 'Georgia', totalCost: 312, discoveredAt: '2026-03-13', travelerName: 'Traveler #891', badges: [] },
  { rank: 3, destination: 'Medellin', country: 'Colombia', totalCost: 349, discoveredAt: '2026-03-14', travelerName: 'Traveler #205', badges: ['adventurous'] },
  { rank: 4, destination: 'Chiang Mai', country: 'Thailand', totalCost: 365, discoveredAt: '2026-03-12', travelerName: 'Traveler #678', badges: [] },
  { rank: 5, destination: 'Lisbon', country: 'Portugal', totalCost: 421, discoveredAt: '2026-03-14', travelerName: 'Traveler #134', badges: [] },
  { rank: 6, destination: 'Budapest', country: 'Hungary', totalCost: 438, discoveredAt: '2026-03-11', travelerName: 'Traveler #567', badges: [] },
  { rank: 7, destination: 'Marrakech', country: 'Morocco', totalCost: 455, discoveredAt: '2026-03-13', travelerName: 'Traveler #923', badges: ['adventurous'] },
  { rank: 8, destination: 'Bangkok', country: 'Thailand', totalCost: 478, discoveredAt: '2026-03-14', travelerName: 'Traveler #301', badges: [] },
  { rank: 9, destination: 'Mexico City', country: 'Mexico', totalCost: 495, discoveredAt: '2026-03-10', travelerName: 'Traveler #742', badges: [] },
  { rank: 10, destination: 'Bali', country: 'Indonesia', totalCost: 512, discoveredAt: '2026-03-14', travelerName: 'Traveler #456', badges: [] },
  { rank: 11, destination: 'Prague', country: 'Czech Republic', totalCost: 534, discoveredAt: '2026-03-12', travelerName: 'Traveler #189', badges: [] },
  { rank: 12, destination: 'Istanbul', country: 'Turkey', totalCost: 556, discoveredAt: '2026-03-13', travelerName: 'Traveler #623', badges: [] },
  { rank: 13, destination: 'Bogota', country: 'Colombia', totalCost: 578, discoveredAt: '2026-03-11', travelerName: 'Traveler #847', badges: [] },
  { rank: 14, destination: 'Athens', country: 'Greece', totalCost: 601, discoveredAt: '2026-03-14', travelerName: 'Traveler #095', badges: [] },
  { rank: 15, destination: 'Kuala Lumpur', country: 'Malaysia', totalCost: 623, discoveredAt: '2026-03-12', travelerName: 'Traveler #518', badges: [] },
  { rank: 16, destination: 'Buenos Aires', country: 'Argentina', totalCost: 689, discoveredAt: '2026-03-10', travelerName: 'Traveler #271', badges: [] },
  { rank: 17, destination: 'Tokyo', country: 'Japan', totalCost: 745, discoveredAt: '2026-03-14', travelerName: 'Traveler #663', badges: [] },
  { rank: 18, destination: 'Cape Town', country: 'South Africa', totalCost: 812, discoveredAt: '2026-03-13', travelerName: 'Traveler #394', badges: ['adventurous'] },
  { rank: 19, destination: 'Reykjavik', country: 'Iceland', totalCost: 934, discoveredAt: '2026-03-11', travelerName: 'Traveler #156', badges: ['adventurous'] },
  { rank: 20, destination: 'Sydney', country: 'Australia', totalCost: 1087, discoveredAt: '2026-03-14', travelerName: 'Traveler #782', badges: [] },
]

function getPeriodFilter(period: string): string {
  const now = new Date()
  switch (period) {
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return weekAgo.toISOString()
    }
    case 'month': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return monthAgo.toISOString()
    }
    default:
      return '2020-01-01T00:00:00.000Z'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week'

  try {
    const supabase = getSupabase()
    const since = getPeriodFilter(period)

    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('activity_type', 'destination_revealed')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json(
        { entries: FALLBACK_DATA, isFallback: true, period },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { entries: FALLBACK_DATA, isFallback: true, period },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
      )
    }

    // Transform and sort by cost (ascending = cheapest first)
    const entries: LeaderboardEntry[] = (data as any[])
      .filter((row) => row.data?.destination && row.data?.country)
      .map((row, _i) => ({
        rank: 0,
        destination: row.data.destination,
        country: row.data.country,
        totalCost: row.data.budget || row.data.totalCost || 500,
        discoveredAt: row.created_at?.split('T')[0] || '2026-03-15',
        travelerName: row.data.user_first_name
          ? row.data.user_first_name
          : `Traveler #${String(Math.abs(hashCode(row.id || '')) % 999).padStart(3, '0')}`,
        badges: [] as string[],
      }))
      .sort((a, b) => a.totalCost - b.totalCost)
      .slice(0, 20)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    // Assign badges
    if (entries.length > 0) {
      entries[0].badges.push('cheapest')
    }
    // Mark adventurous: trips over $700 or to less common destinations
    const adventurousDestinations = new Set([
      'Reykjavik', 'Cape Town', 'Marrakech', 'Medellin', 'Tbilisi',
      'Bogota', 'Cusco', 'Kathmandu', 'La Paz', 'Zanzibar',
    ])
    for (const entry of entries) {
      if (adventurousDestinations.has(entry.destination) || entry.totalCost > 700) {
        if (!entry.badges.includes('adventurous')) {
          entry.badges.push('adventurous')
        }
      }
    }

    return NextResponse.json(
      { entries, isFallback: false, period },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    )
  } catch (error) {
    console.error('Leaderboard endpoint error:', error)
    return NextResponse.json(
      { entries: FALLBACK_DATA, isFallback: true, period },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    )
  }
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}
