'use client'

import { resolveFlightBooking } from '@/lib/booking-redirect'
import { majorAirports } from '@/lib/geolocation'
import DestinationImage from '@/components/DestinationImage'
import BookingLinks from '@/components/BookingLinks'

interface DestinationCardProps {
  destination: string
  destinationCode: string
  origin: string
  price: number
  departDate: string
  returnDate: string
  distance: number
}

// Helper to get city name from airport code with better fallback
function getCityName(code: string): string {
  const airport = majorAirports.find(a => a.code === code)
  if (airport) {
    return airport.city
  }
  // Fallback: if code not found, just return the code (will show as airport code)
  console.warn(`Airport code ${code} not found in database`)
  return code
}

export default function DestinationCard({
  destination,
  destinationCode,
  origin,
  price,
  departDate,
  returnDate,
  distance,
}: DestinationCardProps) {
  const handleBookClick = () => {
    const { action } = resolveFlightBooking({
      origin,
      destination: destinationCode,
      departDate,
      returnDate,
      price,
    })
    if (action.type === 'affiliate-redirect') window.open(action.url, '_blank')
  }

  // Calculate days away (parse as UTC to avoid timezone issues)
  const parts = departDate.split('-')
  const depart = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day
  const daysAway = Math.ceil((depart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Show badge only if departing within next 7 days
  const isThisWeekend = daysAway >= 0 && daysAway <= 7

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      {/* Destination image */}
      <div className="relative">
        <DestinationImage code={destinationCode} city={destination} />
        {isThisWeekend && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
            This Week!
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Destination */}
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{getCityName(destinationCode)}</h3>
        <p className="text-gray-500 text-sm mb-2">
          {destinationCode} • cached estimate
        </p>
        <p className="text-gray-600 text-sm mb-4">
          {formatDate(departDate)} - {formatDate(returnDate)}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">From ~</p>
            <p className="text-2xl font-bold text-green-600">${price}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Departs in</p>
            <p className="text-2xl font-bold text-slate-900">{daysAway}d</p>
          </div>
        </div>

        {/* Book button */}
        <button
          onClick={handleBookClick}
          className="w-full bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg transform active:scale-95"
        >
          Check on Aviasales
        </button>

        {/* Hotel + Activity Links */}
        <BookingLinks
          cityName={getCityName(destinationCode)}
          iata={destinationCode}
          checkIn={departDate}
          nights={Math.ceil((new Date(returnDate).getTime() - new Date(departDate).getTime()) / 86400000) || 3}
        />
      </div>
    </div>
  )
}
