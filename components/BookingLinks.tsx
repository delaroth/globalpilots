'use client'

import { buildHotelLink, buildActivitiesLink } from '@/lib/affiliate'

interface BookingLinksProps {
  cityName: string
  iata?: string
  checkIn: string
  nights?: number
  /** Budget-aligned max hotel price (from destination-costs or Side Quest) */
  maxHotelPerNight?: number
  /** Compact mode for card embeds vs full-width for standalone */
  variant?: 'compact' | 'full'
}

/**
 * Reusable hotel + activity affiliate links.
 * Budget-aware: if maxHotelPerNight is provided, hotel search is pre-filtered.
 * Smart routing: uses Klook for SE Asia, GetYourGuide elsewhere.
 */
export default function BookingLinks({
  cityName,
  checkIn,
  nights = 2,
  maxHotelPerNight,
  variant = 'compact',
}: BookingLinksProps) {
  const hotelUrl = buildHotelLink(cityName, checkIn, nights, {
    maxPricePerNight: maxHotelPerNight,
    sortByPrice: true,
  })
  const activitiesUrl = buildActivitiesLink(cityName)

  if (variant === 'full') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <a
          href={hotelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
        >
          Find Hotels
          <span className="block text-sm font-normal mt-1 opacity-90">
            {maxHotelPerNight ? `Under $${maxHotelPerNight}/night` : `${nights} nights`} on Agoda
          </span>
        </a>
        <a
          href={activitiesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
        >
          Book Activities
          <span className="block text-sm font-normal mt-1 opacity-90">
            Top-rated things to do
          </span>
        </a>
      </div>
    )
  }

  // Compact variant — fits inside cards
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      <a
        href={hotelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-2 rounded-lg transition text-xs text-center border border-blue-200"
      >
        Hotels{maxHotelPerNight ? ` <$${maxHotelPerNight}` : ''}
      </a>
      <a
        href={activitiesUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-1.5 px-2 rounded-lg transition text-xs text-center border border-purple-200"
      >
        Activities
      </a>
    </div>
  )
}
