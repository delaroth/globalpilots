import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch or create user statistics
    let { data: statistics, error } = await (supabase as any)
      .from('user_statistics')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error || !statistics) {
      // Create statistics if they don't exist
      await (supabase as any).rpc('update_user_statistics', { p_user_id: session.user.id })

      const { data: newStats } = await (supabase as any)
        .from('user_statistics')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      statistics = newStats
    }

    return NextResponse.json({ statistics })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
