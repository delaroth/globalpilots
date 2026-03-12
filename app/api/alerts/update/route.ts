import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface UpdateAlertRequest {
  id: string
  isActive: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateAlertRequest = await request.json()
    const { id, isActive } = body

    if (!id || isActive === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id, isActive' },
        { status: 400 }
      )
    }

    console.log('[Alerts Update] Updating alert:', id, 'to', isActive ? 'active' : 'inactive')

    const { data, error } = await (supabase as any)
      .from('price_alerts')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Alerts Update] Supabase error:', error)
      throw new Error('Failed to update alert')
    }

    console.log('[Alerts Update] ✅ Alert updated successfully')

    return NextResponse.json({
      success: true,
      alert: {
        id: data.id,
        isActive: data.is_active,
      }
    })
  } catch (error) {
    console.error('[Alerts Update] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update alert'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
