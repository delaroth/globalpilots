import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getUserPassport } from '@/lib/user-data'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const passport = await getUserPassport(session.user.id)

    return NextResponse.json({ passport })
  } catch (error) {
    console.error('Error fetching passport:', error)
    return NextResponse.json(
      { error: 'Failed to fetch passport data' },
      { status: 500 }
    )
  }
}
