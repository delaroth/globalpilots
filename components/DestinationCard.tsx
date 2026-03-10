'use client'

import { generateAffiliateLink } from '@/lib/affiliate'
import { majorAirports } from '@/lib/geolocation'

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
    const affiliateLink = generateAffiliateLink({
      origin,
      destination: destinationCode,
      departDate,
      returnDate,
    })
    window.open(affiliateLink, '_blank')
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
      {/* Image placeholder */}
      <div className="h-48 bg-gradient-to-br from-skyblue to-skyblue-dark relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl">✈️</span>
        </div>
        {isThisWeekend && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            This Week!
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Destination */}
        <h3 className="text-2xl font-bold text-navy mb-1">{getCityName(destinationCode)}</h3>
        <p className="text-gray-500 text-sm mb-2">
          {destinationCode} • via Aviasales
        </p>
        <p className="text-gray-600 text-sm mb-4">
          {formatDate(departDate)} - {formatDate(returnDate)}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Price</p>
            <p className="text-2xl font-bold text-green-600">${price}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Departs in</p>
            <p className="text-2xl font-bold text-navy">{daysAway}d</p>
          </div>
        </div>

        {/* Book button */}
        <button
          onClick={handleBookClick}
          className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg transform active:scale-95"
        >
          Book This Trip
        </button>
      </div>
    </div>
  )
}
