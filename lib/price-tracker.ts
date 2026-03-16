/**
 * Price tracking utilities using the existing price_alerts Supabase table.
 * Provides a simplified interface for tracking flight route prices.
 */

import { getSupabase } from '@/lib/supabase'

export interface TrackedRoute {
  id: string
  email: string
  origin: string
  destination: string
  target_price: number
  is_active: boolean
  created_at: string
}

/**
 * Track a new route for price alerts.
 */
export async function trackRoute(params: {
  email: string
  origin: string
  destination: string
  targetPrice: number
  userId?: string | null
}): Promise<TrackedRoute> {
  const supabase = getSupabase()

  // Check for duplicates
  const { data: existing } = await (supabase as any)
    .from('price_alerts')
    .select('id')
    .eq('email', params.email)
    .eq('origin', params.origin)
    .eq('destination', params.destination)
    .eq('is_active', true)
    .limit(1)

  if (existing && existing.length > 0) {
    throw new Error('You are already tracking this route.')
  }

  const { data, error } = await (supabase as any)
    .from('price_alerts')
    .insert([
      {
        email: params.email,
        origin: params.origin,
        destination: params.destination,
        target_price: params.targetPrice,
        is_active: true,
        user_id: params.userId || null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('[PriceTracker] Insert error:', error)
    throw new Error('Failed to create price tracking alert.')
  }

  return data as TrackedRoute
}

/**
 * Get all tracked routes for an email.
 */
export async function getTrackedRoutes(email: string): Promise<TrackedRoute[]> {
  const supabase = getSupabase()

  const { data, error } = await (supabase as any)
    .from('price_alerts')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[PriceTracker] Fetch error:', error)
    throw new Error('Failed to fetch tracked routes.')
  }

  return (data || []) as TrackedRoute[]
}

/**
 * Deactivate a tracked route.
 */
export async function deactivateRoute(id: string, email: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await (supabase as any)
    .from('price_alerts')
    .update({ is_active: false })
    .eq('id', id)
    .eq('email', email)

  if (error) {
    console.error('[PriceTracker] Deactivate error:', error)
    throw new Error('Failed to deactivate route tracking.')
  }
}
