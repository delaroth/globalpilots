'use client'

import { useState, useEffect } from 'react'
import { formatActivityMessage, getActivityIcon } from '@/lib/activity-feed'

interface Activity {
  id: string
  activity_type: string
  data: any
  created_at: string
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivities()

    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity?limit=5')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Live Activity</h3>
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Live Activity
      </h3>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="text-2xl">{getActivityIcon(activity.activity_type as any)}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{formatActivityMessage(activity)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(activity.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
