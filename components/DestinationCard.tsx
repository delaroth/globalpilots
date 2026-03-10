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

// Helper to get city name from airport code
function getCityName(code: string): string {
  const airport = majorAirports.find(a => a.code === code)
  return airport?.city || code
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

  // Calculate days away
  const depart = new Date(departDate)
  const today = new Date()
  const daysAway = Math.ceil((depart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

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
        {daysAway <= 7 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            This Weekend!
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Destination */}
        <h3 className="text-2xl font-bold text-navy mb-2">{getCityName(destinationCode)}</h3>
        <p className="text-gray-600 text-sm mb-1">
          {formatDate(departDate)} - {formatDate(returnDate)}
        </p>
        <p className="text-gray-500 text-xs mb-4">
          via Aviasales
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
