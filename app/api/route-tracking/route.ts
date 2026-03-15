import { NextRequest, NextResponse} from 'next/server'
import { getRouteTracking, getPopularRoutes } from '@/lib/activity-feed'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')

    if (origin && destination) {
      // Get tracking for specific route
      const tracking = await getRouteTracking(origin, destination)
      return NextResponse.json({ tracking })
    } else {
      // Get popular routes
      const limit = parseInt(searchParams.get('limit') || '10')
      const routes = await getPopularRoutes(limit)
      return NextResponse.json({ routes })
    }
  } catch (error) {
    console.error('Error fetching route tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch route tracking' },
      { status: 500 }
    )
  }
}
