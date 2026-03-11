'use client'

import { generateAffiliateLink } from '@/lib/affiliate'

interface PriceData {
  [date: string]: {
    value: number
    trip_class: number
    show_to_affiliates: boolean
    origin: string
    destination: string
    depart_date: string
    return_date: string
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

  // Get all prices to calculate ranges
  const prices = Object.values(data).map(d => d.value).filter(p => p > 0)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = maxPrice - minPrice

  // Color coding: green (cheapest 33%), orange (middle 33%), red (expensive 33%)
  const getColorClass = (price: number) => {
    const sortedPrices = [...prices].sort((a, b) => a - b)
    const third = Math.floor(sortedPrices.length / 3)

    if (price <= sortedPrices[third]) {
      return 'bg-green-500 hover:bg-green-600'
    } else if (price <= sortedPrices[third * 2]) {
      return 'bg-orange-500 hover:bg-orange-600'
    } else {
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
    const dayData = data[dateStr]

    if (dayData && dayData.value > 0) {
      const affiliateLink = generateAffiliateLink({
        origin,
        destination,
        departDate: dateStr,
        returnDate: dayData.return_date,
      })
      window.open(affiliateLink, '_blank')
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {monthNames[monthNum - 1]} {year} - {origin} to {destination}
        </h2>

        {/* Price legend */}
        <div className="flex justify-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-white">Cheapest 33%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-white">Middle 33%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-white">Expensive 33%</span>
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

            // Try different date key formats to handle TravelPayouts response
            let dayData = data[dateStr]
            if (!dayData) {
              // Try with leading zeros removed
              const altDateStr = `${year}-${monthNum}-${day}`
              dayData = data[altDateStr]
            }

            const hasPrice = dayData && dayData.value > 0

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
                    ? `${getColorClass(dayData.value)} text-white cursor-pointer shadow-lg`
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-lg font-semibold">{day}</span>
                {hasPrice && (
                  <span className="text-xs mt-1 font-bold">
                    ${dayData.value}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div className="bg-navy-light/50 rounded-lg p-3">
            <p className="text-skyblue-light text-sm">Cheapest</p>
            <p className="text-white text-xl font-bold">${minPrice}</p>
          </div>
          <div className="bg-navy-light/50 rounded-lg p-3">
            <p className="text-skyblue-light text-sm">Average</p>
            <p className="text-white text-xl font-bold">
              ${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)}
            </p>
          </div>
          <div className="bg-navy-light/50 rounded-lg p-3 col-span-2 md:col-span-1">
            <p className="text-skyblue-light text-sm">Most Expensive</p>
            <p className="text-white text-xl font-bold">${maxPrice}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
