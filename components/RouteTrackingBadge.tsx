'use client'

import { useState, useEffect } from 'react'

interface RouteTrackingBadgeProps {
  origin: string
  destination: string
}

export default function RouteTrackingBadge({ origin, destination }: RouteTrackingBadgeProps) {
  const [trackingCount, setTrackingCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (origin && destination) {
      fetchRouteTracking()
    }
  }, [origin, destination])

  const fetchRouteTracking = async () => {
    try {
      const response = await fetch(
        `/api/route-tracking?origin=${origin}&destination=${destination}`
      )
      if (response.ok) {
        const data = await response.json()
        setTrackingCount(data.tracking?.active_alert_count || 0)
      }
    } catch (error) {
      console.error('Error fetching route tracking:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || trackingCount === null || trackingCount === 0) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm">
      <span className="text-green-600">🔥</span>
      <span className="text-green-700 font-semibold">
        {trackingCount} {trackingCount === 1 ? 'person is' : 'people are'} tracking this route
      </span>
    </div>
  )
}
