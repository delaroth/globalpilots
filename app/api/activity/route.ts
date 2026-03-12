import { NextRequest, NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/activity-feed'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const activities = await getRecentActivity(limit)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
