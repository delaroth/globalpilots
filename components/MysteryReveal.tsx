'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { buildBookingBundle, AFFILIATE_FLAGS } from '@/lib/affiliate'
import { trackActivity } from '@/lib/activity-feed'

interface DailyActivity {
  time: string
  activity: string
  estimated_cost: number
}

interface DailyItinerary {
  day: number
  activities: DailyActivity[]
  total_day_cost: number
}

interface HotelRecommendation {
  name: string
  estimated_price_per_night: number
  neighborhood: string
  why_recommended: string
}

interface Destination {
  destination: string
  country: string
  city_code_IATA: string
  iata?: string
  estimated_flight_cost: number
  indicativeFlightPrice?: number
  estimated_hotel_per_night: number
  why_its_perfect: string
  whyThisPlace?: string
  day1: string[]
  day2: string[]
  day3: string[]
  best_local_food: string[]
  insider_tip: string
  localTip?: string
  priceIsEstimate?: boolean
  budgetBreakdown?: {
    flights: number
    hotel: number
    activities: number
    food: number
    total: number
  }
  budget_breakdown?: {
    flight: number
    hotel_total: number
    hotel_per_night: number
    activities: number
    local_transport: number
    food_estimate: number
    buffer: number
  }
  hotel_recommendations?: HotelRecommendation[]
  daily_itinerary?: DailyItinerary[]
  local_transportation?: {
    airport_to_city: string
    daily_transport: string
    estimated_daily_cost: number
  }
  blog_post_slug?: string
  itinerary?: { day: number; activities: string[] }[]
  bestTimeToGo?: string
}

interface MysteryRevealProps {
  destination: Destination
  origin: string
  departDate: string
  onShowAnother: () => void
}

export default function MysteryReveal({
  destination,
  origin,
  departDate,
  onShowAnother,
}: MysteryRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const bookingRef = useRef<HTMLDivElement>(null)

  const iata = destination.city_code_IATA || destination.iata || ''
  const flightPrice = destination.indicativeFlightPrice || destination.estimated_flight_cost
  const isEstimate = destination.priceIsEstimate

  // Build booking bundle
  const bookingBundle = buildBookingBundle({
    origin,
    destination: iata,
    cityName: destination.destination,
    departDate,
    nights: 3,
  })

  const handleReveal = () => {
    setRevealed(true)

    // Log to activity_feed
    trackActivity('destination_revealed', {
      destination: destination.destination,
      country: destination.country,
    }).catch(() => {})
  }

  // Scroll to booking buttons after reveal
  useEffect(() => {
    if (revealed && bookingRef.current) {
      setTimeout(() => {
        bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [revealed])

  const handleShare = () => {
    const url = `${window.location.origin}/mystery?dest=${encodeURIComponent(destination.destination)}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  const totalCost = destination.budgetBreakdown?.total
    || (destination.budget_breakdown
      ? Object.values(destination.budget_breakdown).reduce((sum, val) => sum + val, 0)
      : destination.estimated_flight_cost + (destination.estimated_hotel_per_night * 3))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Reveal button — shown before reveal */}
      {!revealed && (
        <div className="text-center mb-8">
          <div className="bg-navy-light/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-skyblue/40 shadow-2xl">
            <div className="text-7xl mb-6">🌍</div>
            <h2 className="text-3xl font-bold text-white mb-4">Your destination is ready!</h2>
            <p className="text-skyblue-light mb-8">Click to reveal your mystery vacation</p>
            <button
              onClick={handleReveal}
              className="bg-skyblue hover:bg-skyblue-dark text-navy font-bold text-2xl py-6 px-12 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse"
            >
              Reveal Your Mystery Destination
            </button>
          </div>
        </div>
      )}

      {/* Destination card — only visible after reveal */}
      {revealed && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-1000">
          {/* Header Image */}
          <div className="h-64 bg-gradient-to-br from-skyblue via-skyblue-dark to-navy relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl">🌍</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h2 className="text-4xl font-bold text-white">
                {destination.destination}
              </h2>
              <p className="text-xl text-skyblue-light">{destination.country}</p>
            </div>
          </div>

          <div className="p-8">
            {/* Blog Link */}
            {destination.blog_post_slug && (
              <Link
                href={`/blog/${destination.blog_post_slug}`}
                className="block mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 hover:bg-yellow-100 transition"
              >
                <p className="text-yellow-800 font-semibold flex items-center gap-2">
                  <span>Read our complete travel guide for {destination.destination}</span>
                  <span className="ml-auto">&rarr;</span>
                </p>
              </Link>
            )}

            {/* Budget Breakdown */}
            {destination.budget_breakdown ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-navy mb-4">Budget Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Flight</p>
                    <p className="text-lg font-bold text-green-700">
                      {isEstimate ? '~' : ''}${destination.budget_breakdown.flight}{isEstimate ? ' est.' : ''}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Hotel (total)</p>
                    <p className="text-lg font-bold text-green-700">${destination.budget_breakdown.hotel_total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Activities</p>
                    <p className="text-lg font-bold text-green-700">${destination.budget_breakdown.activities}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-green-700">${totalCost}</p>
                  </div>
                </div>
                {destination.budget_breakdown.local_transport > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Transport</p>
                      <p className="font-semibold text-green-600">${destination.budget_breakdown.local_transport}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Food</p>
                      <p className="font-semibold text-green-600">${destination.budget_breakdown.food_estimate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Buffer</p>
                      <p className="font-semibold text-green-600">${destination.budget_breakdown.buffer}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : destination.budgetBreakdown ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-navy mb-4">Budget Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Flights</p>
                    <p className="text-lg font-bold text-green-700">
                      {isEstimate ? '~' : ''}${destination.budgetBreakdown.flights}{isEstimate ? ' est.' : ''}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Hotel</p>
                    <p className="text-lg font-bold text-green-700">${destination.budgetBreakdown.hotel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Activities</p>
                    <p className="text-lg font-bold text-green-700">${destination.budgetBreakdown.activities}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-green-700">${destination.budgetBreakdown.total}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-6 border-2 border-green-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Flight</p>
                    <p className="text-2xl font-bold text-green-700">
                      {isEstimate ? '~' : ''}${flightPrice}{isEstimate ? ' est.' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hotel (3 nights)</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${destination.estimated_hotel_per_night * 3}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-green-700">${totalCost}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Price disclaimer */}
            <p className="text-xs text-gray-500 text-center mb-6">
              {isEstimate
                ? `~$${flightPrice} est. is an estimated price based on regional averages. Actual price confirmed on booking.`
                : `~$${flightPrice} is an indicative cached price. Actual price confirmed on Aviasales.`}
            </p>

            {/* Why It's Perfect */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy mb-2">Why This Destination?</h3>
              <p className="text-gray-700">{destination.whyThisPlace || destination.why_its_perfect}</p>
            </div>

            {/* Best Time to Go */}
            {destination.bestTimeToGo && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-navy">
                  <span className="font-semibold">Best time to go:</span> {destination.bestTimeToGo}
                </p>
              </div>
            )}

            {/* Hotel Recommendations */}
            {destination.hotel_recommendations && destination.hotel_recommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-navy mb-3">Where to Stay</h3>
                <div className="space-y-3">
                  {destination.hotel_recommendations.map((hotel, idx) => (
                    <div key={idx} className="bg-skyblue/10 rounded-lg p-4 border border-skyblue/30">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-navy">{hotel.name}</h4>
                        <p className="text-green-600 font-bold whitespace-nowrap ml-4">
                          ${hotel.estimated_price_per_night}/night
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{hotel.neighborhood}</p>
                      <p className="text-sm text-gray-700">{hotel.why_recommended}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Daily Itinerary */}
            {destination.daily_itinerary && destination.daily_itinerary.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-navy mb-4">Your Daily Itinerary</h3>
                <div className="space-y-4">
                  {destination.daily_itinerary.map((day) => (
                    <div key={day.day} className="bg-skyblue/10 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-navy">Day {day.day}</h4>
                        <span className="text-sm font-semibold text-green-600">
                          Daily total: ${day.total_day_cost}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {day.activities.map((activity, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-skyblue">{activity.time}</p>
                              <p className="text-gray-700">{activity.activity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-600 ml-4">
                              ${activity.estimated_cost}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : destination.itinerary && destination.itinerary.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-navy mb-4">Your Itinerary</h3>
                <div className="space-y-4">
                  {destination.itinerary.map((day) => (
                    <div key={day.day} className="bg-skyblue/10 rounded-lg p-4">
                      <h4 className="font-semibold text-navy mb-2">Day {day.day}</h4>
                      <ul className="space-y-1">
                        {day.activities.map((activity, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start">
                            <span className="text-skyblue mr-2">&bull;</span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-navy mb-4">Your 3-Day Adventure</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Day 1', items: destination.day1 },
                    { label: 'Day 2', items: destination.day2 },
                    { label: 'Day 3', items: destination.day3 },
                  ].map(({ label, items }) => (
                    <div key={label} className="bg-skyblue/10 rounded-lg p-4">
                      <h4 className="font-semibold text-navy mb-2">{label}</h4>
                      <ul className="space-y-1">
                        {items?.map((activity, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start">
                            <span className="text-skyblue mr-2">&bull;</span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Transportation */}
            {destination.local_transportation && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-bold text-navy mb-3">Getting Around</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Airport to City:</p>
                    <p className="text-gray-600">{destination.local_transportation.airport_to_city}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Daily Transport:</p>
                    <p className="text-gray-600">{destination.local_transportation.daily_transport}</p>
                  </div>
                  <p className="text-green-600 font-semibold">
                    Estimated daily cost: ${destination.local_transportation.estimated_daily_cost}
                  </p>
                </div>
              </div>
            )}

            {/* Food */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy mb-3">Must-Try Local Food</h3>
              <div className="flex flex-wrap gap-2">
                {destination.best_local_food?.map((food, idx) => (
                  <span
                    key={idx}
                    className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {food}
                  </span>
                ))}
              </div>
            </div>

            {/* Insider Tip */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <h3 className="font-semibold text-navy mb-1">Insider Tip</h3>
              <p className="text-gray-700">{destination.localTip || destination.insider_tip}</p>
            </div>

            {/* THREE BOOKING BUTTONS */}
            <div ref={bookingRef} className="space-y-3 mb-6">
              <h3 className="text-xl font-bold text-navy mb-4">Book Your Trip</h3>

              {/* Flight booking */}
              <a
                href={bookingBundle.flightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl text-center"
              >
                Book Flights (~${isEstimate ? `${flightPrice} est.` : flightPrice})
                <span className="block text-sm font-normal mt-1 opacity-90">
                  {AFFILIATE_FLAGS.kiwi ? 'Book on Kiwi' : 'Book on Aviasales'}
                </span>
              </a>

              {/* Hotel booking */}
              <a
                href={bookingBundle.hotelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl text-center"
              >
                Find Hotels (~${destination.estimated_hotel_per_night}/night)
                <span className="block text-sm font-normal mt-1 opacity-90">
                  Search on Agoda
                </span>
              </a>

              {/* Activities booking */}
              <a
                href={bookingBundle.activitiesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl text-center"
              >
                Book Activities
                <span className="block text-sm font-normal mt-1 opacity-90">
                  Browse on GetYourGuide
                </span>
              </a>
            </div>

            {/* Show Another + Share */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onShowAnother}
                className="bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl"
              >
                Show Me Another
              </button>
              <button
                onClick={handleShare}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 px-6 rounded-lg transition"
              >
                Share This Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
