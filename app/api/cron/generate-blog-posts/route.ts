import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get top 10 most-tracked routes
    const { data: routes, error: routeError } = await (supabase as any)
      .from('route_tracking')
      .select('origin, destination, search_count')
      .order('search_count', { ascending: false })
      .limit(10)

    if (routeError) {
      console.error('[BlogCron] Error fetching routes:', routeError)
      return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
    }

    if (!routes || routes.length === 0) {
      return NextResponse.json({ message: 'No tracked routes found' })
    }

    const generated: string[] = []
    const failed: string[] = []

    for (const route of routes) {
      try {
        // Check if blog post already exists for this destination
        const { data: existing } = await (supabase as any)
          .from('blog_posts')
          .select('id')
          .eq('destination_code', route.destination)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`[BlogCron] Post already exists for ${route.destination}, skipping`)
          continue
        }

        // Look up destination name from airports or use code
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destinationCode: route.destination,
              destinationName: route.destination, // Will be resolved by the generate endpoint
              country: '',
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          generated.push(`${route.origin}-${route.destination}: ${data.slug || 'generated'}`)
        } else {
          failed.push(`${route.origin}-${route.destination}: HTTP ${response.status}`)
        }
      } catch (err) {
        failed.push(`${route.origin}-${route.destination}: ${err instanceof Error ? err.message : 'error'}`)
      }
    }

    return NextResponse.json({
      message: `Blog generation complete`,
      generated,
      failed,
    })
  } catch (error) {
    console.error('[BlogCron] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Blog generation failed' },
      { status: 500 }
    )
  }
}
