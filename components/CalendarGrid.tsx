'use client'

import { generateAffiliateLink } from '@/lib/affiliate'

interface PriceData {
  [date: string]: {
    price: number
    value?: number // Backward compatibility
    trip_class: number
    show_to_affiliates: boolean
    origin: string
    destination: string
    depart_date: string
    return_date: string
    departure_at: string
    return_at: string
    airline?: string
  }
}

interface CalendarGridProps {
  data: PriceData
  origin: string
  destination: string
  month: string // YYYY-MM
}

export default function CalendarGrid({ data, origin, destination, month }: CalendarGridProps) {
  console.log('[CalendarGrid] Received data keys:', Object.keys(data || {}).slice(0, 10))
  console.log('[CalendarGrid] Data entries:', Object.keys(data || {}).length)

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-12 text-white">
        <p className="text-xl">No flights found for this route and month.</p>
        <p className="text-skyblue-light mt-2">Try different dates or destinations.</p>
      </div>
    )
  }

  // Normalize data: TravelPayouts may return non-padded keys ("2026-3-5"),
  // datetime keys ("2026-03-14T08:00:00"), or nested structures.
  // Build a flat YYYY-MM-DD keyed map.
  const normalizeDate = (key: string): string | null => {
    const m = key.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (!m) return null
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }

  const normalizedData: PriceData = {}
  for (const [key, val] of Object.entries(data)) {
    const dateKey = normalizeDate(key)
    if (dateKey) {
      if (!normalizedData[dateKey]) {
        normalizedData[dateKey] = val as PriceData[string]
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Key might be an airport code (nested structure) — flatten one level
      for (const [innerKey, innerVal] of Object.entries(val as Record<string, unknown>)) {
        const innerDateKey = normalizeDate(innerKey)
        if (innerDateKey && !normalizedData[innerDateKey]) {
          normalizedData[innerDateKey] = innerVal as PriceData[string]
        }
      }
    }
  }

  // Get all prices to calculate ranges
  // Handle both 'price' and 'value' field names for backward compatibility
  const prices = Object.values(normalizedData)
    .map(d => d.price || d.value || 0)
    .filter(p => typeof p === 'number' && isFinite(p) && p > 0)

  // Check if we have valid prices
  if (prices.length === 0) {
    return (
      <div className="text-center py-12 text-white">
        <p className="text-xl">No valid flight prices found for this route and month.</p>
        <p className="text-skyblue-light mt-2">Try different dates or destinations.</p>
      </div>
    )
  }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const range = maxPrice - minPrice

  // Color coding based on average price
  const getColorClass = (price: number) => {
    // Green = at or below average, yellow = slightly above, red = significantly above
    const percentAboveAvg = ((price - avgPrice) / avgPrice) * 100

    if (percentAboveAvg <= 0) {
      // At or below average - green
      return 'bg-green-500 hover:bg-green-600'
    } else if (percentAboveAvg <= 15) {
      // Slightly above average - yellow/orange
      return 'bg-yellow-500 hover:bg-yellow-600'
    } else {
      // Significantly above average - red
      return 'bg-red-500 hover:bg-red-600'
    }
  }

  // Get today's date for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build calendar for the month
  const [year, monthNum] = month.split('-').map(Number)
  const firstDay = new Date(year, monthNum - 1, 1)
  const lastDay = new Date(year, monthNum, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday

  const days = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = normalizedData[dateStr]

    if (dayData) {
      const price = dayData.price || dayData.value || 0
      if (price > 0) {
        const affiliateLink = generateAffiliateLink({
          origin,
          destination,
          departDate: dayData.departure_at || dateStr,
          returnDate: dayData.return_at || dayData.return_date,
        })
        window.open(affiliateLink, '_blank')
      }
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          {monthNames[monthNum - 1]} {year} - {origin} to {destination}
        </h2>
        <p className="text-skyblue-light/70 text-xs text-center mb-6">
          Prices are cached estimates — click a day to see live prices on Aviasales
        </p>

        {/* Price legend */}
        <div className="flex justify-center gap-4 mb-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-white">At or Below Average (${avgPrice})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-white">Slightly Above Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-white">Significantly Above Average</span>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-skyblue font-semibold py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square"></div>
            }

            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const cellDate = new Date(year, monthNum - 1, day)
            const isPast = cellDate < today

            const dayData = normalizedData[dateStr]

            const price = dayData ? (dayData.price || dayData.value || 0) : 0
            const hasPrice = price > 0 && isFinite(price)

            // Past dates are greyed out
            if (isPast) {
              return (
                <button
                  key={day}
                  disabled
                  className="aspect-square rounded-lg flex flex-col items-center justify-center bg-gray-800/30 text-gray-600 cursor-not-allowed"
                >
                  <span className="text-lg font-semibold">{day}</span>
                  <span className="text-xs mt-1">Past</span>
                </button>
              )
            }

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={!hasPrice}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center
                  transition-all duration-200 transform hover:scale-105
                  ${hasPrice
                    ? `${getColorClass(price)} text-white cursor-pointer shadow-lg`
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-lg font-semibold">{day}</span>
                {hasPrice && (
                  <span className="text-xs mt-1 font-bold">
                    ${Math.round(price)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Stats */}
        {isFinite(minPrice) && isFinite(maxPrice) && isFinite(avgPrice) && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="bg-navy-light/50 rounded-lg p-3">
              <p className="text-skyblue-light text-sm">Cheapest ~</p>
              <p className="text-white text-xl font-bold">${Math.round(minPrice)}</p>
            </div>
            <div className="bg-navy-light/50 rounded-lg p-3">
              <p className="text-skyblue-light text-sm">Average ~</p>
              <p className="text-white text-xl font-bold">${avgPrice}</p>
            </div>
            <div className="bg-navy-light/50 rounded-lg p-3 col-span-2 md:col-span-1">
              <p className="text-skyblue-light text-sm">Most Expensive ~</p>
              <p className="text-white text-xl font-bold">${Math.round(maxPrice)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
