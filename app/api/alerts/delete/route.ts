import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    console.log('[Alerts Delete] Deleting alert:', id)

    const { error } = await (supabase as any)
      .from('price_alerts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Alerts Delete] Supabase error:', error)
      throw new Error('Failed to delete alert')
    }

    console.log('[Alerts Delete] ✅ Alert deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Alerts Delete] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete alert'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
