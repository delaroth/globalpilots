'use client'

import { useState, useEffect } from 'react'

interface Deal {
  id: string
  data: {
    route: string
    price: number
    savings: number
    destination: string
  }
  created_at: string
}

export default function RecentDealsCarousel() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
  }, [])

  // Auto-rotate through deals
  useEffect(() => {
    if (deals.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [deals])

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/activity?limit=20')
      if (response.ok) {
        const data = await response.json()
        const dealActivities = data.activities.filter(
          (a: any) => a.activity_type === 'deal_found'
        )
        setDeals(dealActivities.slice(0, 10))
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || deals.length === 0) {
    return null
  }

  const currentDeal = deals[currentIndex]

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-3xl">💰</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {currentDeal.data.destination} - ${currentDeal.data.price}
            </p>
            <p className="text-xs text-green-100">
              Save ${currentDeal.data.savings} on this deal!
            </p>
          </div>
        </div>

        {/* Indicator dots */}
        {deals.length > 1 && (
          <div className="flex gap-1 ml-3">
            {deals.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
