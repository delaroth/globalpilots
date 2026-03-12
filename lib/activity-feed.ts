import { supabase } from './supabase'

export type ActivityType =
  | 'alert_created'
  | 'deal_found'
  | 'trip_saved'
  | 'destination_revealed'

interface ActivityData {
  alert_created?: {
    route: string
    user_city: string
    user_first_name: string
  }
  deal_found?: {
    route: string
    price: number
    savings: number
    destination: string
  }
  trip_saved?: {
    destination: string
    country: string
    budget: number
  }
  destination_revealed?: {
    destination: string
    country: string
  }
}

/**
 * Track an activity in the activity feed
 */
export async function trackActivity(
  activityType: ActivityType,
  data: ActivityData[typeof activityType]
) {
  try {
    const { error } = await (supabase as any)
      .from('activity_feed')
      .insert({
        activity_type: activityType,
        data,
        is_public: true,
      })

    if (error) {
      console.error('Error tracking activity:', error)
    }
  } catch (error) {
    console.error('Error tracking activity:', error)
  }
}

/**
 * Get recent activity for social proof
 */
export async function getRecentActivity(limit: number = 10) {
  try {
    const { data, error } = await (supabase as any)
      .from('activity_feed')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching activity:', error)
    return []
  }
}

/**
 * Get route tracking statistics
 */
export async function getRouteTracking(origin: string, destination: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('route_tracking')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .single()

    if (error || !data) {
      return {
        active_alert_count: 0,
        total_alert_count: 0,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching route tracking:', error)
    return {
      active_alert_count: 0,
      total_alert_count: 0,
    }
  }
}

/**
 * Get most popular routes
 */
export async function getPopularRoutes(limit: number = 10) {
  try {
    const { data, error } = await (supabase as any)
      .from('route_tracking')
      .select('*')
      .order('active_alert_count', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching popular routes:', error)
    return []
  }
}

/**
 * Generate a friendly activity message
 */
export function formatActivityMessage(activity: any): string {
  switch (activity.activity_type) {
    case 'alert_created':
      return `${activity.data.user_first_name} from ${activity.data.user_city} is tracking ${activity.data.route}`
    case 'deal_found':
      return `Great deal found: ${activity.data.route} for $${activity.data.price} (save $${activity.data.savings}!)`
    case 'trip_saved':
      return `Someone saved a trip to ${activity.data.destination}, ${activity.data.country}`
    case 'destination_revealed':
      return `Mystery destination revealed: ${activity.data.destination}, ${activity.data.country}`
    default:
      return 'New activity'
  }
}

/**
 * Get activity icon emoji
 */
export function getActivityIcon(activityType: ActivityType): string {
  switch (activityType) {
    case 'alert_created':
      return '🔔'
    case 'deal_found':
      return '💰'
    case 'trip_saved':
      return '⭐'
    case 'destination_revealed':
      return '✨'
    default:
      return '📍'
  }
}
