'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { buildBookingBundle, AFFILIATE_FLAGS } from '@/lib/affiliate'

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

interface TripDestination {
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
  _meta?: {
    origin: string
    departDate: string
    vibe: string
    sharedAt: string
    totalCost: number
  }
}

export default function SharedTripPage({ params }: { params: { id: string } }) {
  const [trip, setTrip] = useState<TripDestination | null>(null)
  const [tripName, setTripName] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`/api/trips/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('This trip was not found. It may have been removed.')
          } else {
            setError('Failed to load trip. Please try again.')
          }
          return
        }
        const data = await res.json()
        setTrip(data.destinationData)
        setTripName(data.tripName || '')
        setCreatedAt(data.createdAt || '')
      } catch {
        setError('Something went wrong loading this trip.')
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()
  }, [params.id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-pulse">🌍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Mystery Trip...</h2>
          <p className="text-skyblue-light">Preparing your adventure details</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-navy mb-4">Trip Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This trip could not be loaded.'}</p>
            <Link
              href="/mystery"
              className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-bold py-3 px-8 rounded-lg transition"
            >
              Create Your Own Mystery Trip
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const iata = trip.city_code_IATA || trip.iata || ''
  const flightPrice = trip.indicativeFlightPrice || trip.estimated_flight_cost
  const isEstimate = trip.priceIsEstimate
  const origin = trip._meta?.origin || ''
  const departDate = trip._meta?.departDate || new Date().toISOString().split('T')[0]

  const totalCost = trip._meta?.totalCost
    || trip.budgetBreakdown?.total
    || (trip.budget_breakdown
      ? Object.values(trip.budget_breakdown).reduce((sum, val) => sum + val, 0)
      : trip.estimated_flight_cost + (trip.estimated_hotel_per_night * 3))

  // Build booking bundle
  const bookingBundle = origin
    ? buildBookingBundle({
        origin,
        destination: iata,
        cityName: trip.destination,
        departDate,
        nights: 3,
      })
    : null

  const sharedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <Link href="/mystery" className="text-skyblue hover:text-skyblue-light transition">
            Plan Your Own Trip
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Shared Badge */}
        <div className="text-center mb-6">
          <span className="inline-block bg-skyblue/20 text-skyblue-light px-4 py-2 rounded-full text-sm font-medium border border-skyblue/30">
            Shared Mystery Trip {sharedDate ? `- ${sharedDate}` : ''}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Hero Header */}
          <div className="h-72 bg-gradient-to-br from-skyblue via-skyblue-dark to-navy relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] opacity-30">🌍</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-5xl font-bold text-white mb-2">
                {trip.destination}
              </h1>
              <p className="text-2xl text-skyblue-light font-medium">{trip.country}</p>
              <div className="mt-3 flex items-center gap-4">
                <span className="bg-green-500/90 text-white px-4 py-1 rounded-full text-lg font-bold">
                  ${Math.round(totalCost)} total
                </span>
                {iata && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {iata}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Why This Destination */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-navy mb-3">Why This Destination?</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {trip.whyThisPlace || trip.why_its_perfect}
              </p>
            </div>

            {/* Best Time to Go */}
            {trip.bestTimeToGo && (
              <div className="mb-8 bg-blue-50 rounded-xl p-5 border border-blue-200">
                <p className="text-navy text-base">
                  <span className="font-semibold">Best time to go:</span> {trip.bestTimeToGo}
                </p>
              </div>
            )}

            {/* Budget Breakdown */}
            {trip.budget_breakdown ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-8 border-2 border-green-200">
                <h3 className="text-xl font-bold text-navy mb-4">Budget Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Flight</p>
                    <p className="text-xl font-bold text-green-700">
                      {isEstimate ? '~' : ''}${trip.budget_breakdown.flight}{isEstimate ? ' est.' : ''}
                    </p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Hotel (total)</p>
                    <p className="text-xl font-bold text-green-700">${trip.budget_breakdown.hotel_total}</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Activities</p>
                    <p className="text-xl font-bold text-green-700">${trip.budget_breakdown.activities}</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-green-700">${Math.round(totalCost)}</p>
                  </div>
                </div>
                {trip.budget_breakdown.local_transport > 0 && (
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Transport</p>
                      <p className="font-semibold text-green-600">${trip.budget_breakdown.local_transport}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Food</p>
                      <p className="font-semibold text-green-600">${trip.budget_breakdown.food_estimate}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Buffer</p>
                      <p className="font-semibold text-green-600">${trip.budget_breakdown.buffer}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : trip.budgetBreakdown ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-8 border-2 border-green-200">
                <h3 className="text-xl font-bold text-navy mb-4">Budget Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Flights</p>
                    <p className="text-xl font-bold text-green-700">
                      {isEstimate ? '~' : ''}${trip.budgetBreakdown.flights}{isEstimate ? ' est.' : ''}
                    </p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Hotel</p>
                    <p className="text-xl font-bold text-green-700">${trip.budgetBreakdown.hotel}</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Activities</p>
                    <p className="text-xl font-bold text-green-700">${trip.budgetBreakdown.activities}</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-green-700">${trip.budgetBreakdown.total}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-8 border-2 border-green-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-500">Flight</p>
                    <p className="text-2xl font-bold text-green-700">
                      {isEstimate ? '~' : ''}${flightPrice}{isEstimate ? ' est.' : ''}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-500">Hotel (3 nights)</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${trip.estimated_hotel_per_night * 3}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-green-700">${Math.round(totalCost)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Recommendations */}
            {trip.hotel_recommendations && trip.hotel_recommendations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Where to Stay</h3>
                <div className="space-y-3">
                  {trip.hotel_recommendations.map((hotel, idx) => (
                    <div key={idx} className="bg-skyblue/10 rounded-xl p-5 border border-skyblue/30 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-navy text-lg">{hotel.name}</h4>
                        <p className="text-green-600 font-bold whitespace-nowrap ml-4 text-lg">
                          ${hotel.estimated_price_per_night}/night
                        </p>
                      </div>
                      <p className="text-sm text-skyblue-dark font-medium mb-1">{hotel.neighborhood}</p>
                      <p className="text-gray-700">{hotel.why_recommended}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Itinerary */}
            {trip.daily_itinerary && trip.daily_itinerary.length > 0 ? (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Your Daily Itinerary</h3>
                <div className="space-y-4">
                  {trip.daily_itinerary.map((day) => (
                    <div key={day.day} className="bg-skyblue/10 rounded-xl p-5 border border-skyblue/20">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-navy text-lg">Day {day.day}</h4>
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          ${day.total_day_cost} for the day
                        </span>
                      </div>
                      <div className="space-y-3">
                        {day.activities.map((activity, idx) => (
                          <div key={idx} className="flex justify-between items-start border-b border-skyblue/10 pb-2 last:border-0 last:pb-0">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-skyblue-dark">{activity.time}</p>
                              <p className="text-gray-700">{activity.activity}</p>
                            </div>
                            <p className="text-sm font-bold text-gray-500 ml-4">
                              ${activity.estimated_cost}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : trip.itinerary && trip.itinerary.length > 0 ? (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Your Itinerary</h3>
                <div className="space-y-4">
                  {trip.itinerary.map((day) => (
                    <div key={day.day} className="bg-skyblue/10 rounded-xl p-5 border border-skyblue/20">
                      <h4 className="font-bold text-navy text-lg mb-3">Day {day.day}</h4>
                      <ul className="space-y-2">
                        {day.activities.map((activity, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start">
                            <span className="text-skyblue mr-2 mt-1">&bull;</span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (trip.day1 || trip.day2 || trip.day3) ? (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Your 3-Day Adventure</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Day 1', items: trip.day1 },
                    { label: 'Day 2', items: trip.day2 },
                    { label: 'Day 3', items: trip.day3 },
                  ].map(({ label, items }) => (
                    <div key={label} className="bg-skyblue/10 rounded-xl p-5 border border-skyblue/20">
                      <h4 className="font-bold text-navy text-lg mb-3">{label}</h4>
                      <ul className="space-y-2">
                        {items?.map((activity, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start">
                            <span className="text-skyblue mr-2 mt-1">&bull;</span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Local Transportation */}
            {trip.local_transportation && (
              <div className="mb-8 bg-blue-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-lg font-bold text-navy mb-3">Getting Around</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Airport to City:</p>
                    <p className="text-gray-600">{trip.local_transportation.airport_to_city}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Daily Transport:</p>
                    <p className="text-gray-600">{trip.local_transportation.daily_transport}</p>
                  </div>
                  <p className="text-green-600 font-semibold">
                    Estimated daily cost: ${trip.local_transportation.estimated_daily_cost}
                  </p>
                </div>
              </div>
            )}

            {/* Food */}
            {trip.best_local_food && trip.best_local_food.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-3">Must-Try Local Food</h3>
                <div className="flex flex-wrap gap-2">
                  {trip.best_local_food.map((food, idx) => (
                    <span
                      key={idx}
                      className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Insider Tip */}
            {(trip.localTip || trip.insider_tip) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-8 rounded-r-xl">
                <h3 className="font-semibold text-navy mb-1 text-lg">Insider Tip</h3>
                <p className="text-gray-700">{trip.localTip || trip.insider_tip}</p>
              </div>
            )}

            {/* Blog Link */}
            {trip.blog_post_slug && (
              <Link
                href={`/blog/${trip.blog_post_slug}`}
                className="block mb-8 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5 hover:bg-yellow-100 transition"
              >
                <p className="text-yellow-800 font-semibold flex items-center gap-2">
                  <span>Read our complete travel guide for {trip.destination}</span>
                  <span className="ml-auto">&rarr;</span>
                </p>
              </Link>
            )}

            {/* Booking Buttons */}
            {bookingBundle && (
              <div className="space-y-3 mb-8">
                <h3 className="text-xl font-bold text-navy mb-4">Book This Trip</h3>

                <a
                  href={bookingBundle.flightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                >
                  Book Flights (~${isEstimate ? `${flightPrice} est.` : flightPrice})
                  <span className="block text-sm font-normal mt-1 opacity-90">
                    {AFFILIATE_FLAGS.kiwi ? 'Book on Kiwi' : 'Book on Aviasales'}
                  </span>
                </a>

                <a
                  href={bookingBundle.hotelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                >
                  Find Hotels (~${trip.estimated_hotel_per_night}/night)
                  <span className="block text-sm font-normal mt-1 opacity-90">
                    Search on Agoda
                  </span>
                </a>

                <a
                  href={bookingBundle.activitiesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                >
                  Book Activities
                  <span className="block text-sm font-normal mt-1 opacity-90">
                    Browse on GetYourGuide
                  </span>
                </a>
              </div>
            )}

            {/* Share / Copy Link */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CTA: Create Your Own */}
          <div className="bg-gradient-to-r from-navy via-navy-light to-navy p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Want your own mystery vacation?</h3>
            <p className="text-skyblue-light mb-6 text-lg">
              Let our AI surprise you with a destination that fits your budget and vibe.
            </p>
            <Link
              href="/mystery"
              className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-bold text-lg py-4 px-10 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Create My Mystery Trip
            </Link>
          </div>
        </div>

        {/* Footer attribution */}
        <div className="text-center mt-8 pb-8">
          <p className="text-skyblue-light/60 text-sm">
            Powered by <Link href="/" className="text-skyblue hover:text-skyblue-light transition underline">GlobePilot</Link> — AI-powered budget travel
          </p>
        </div>
      </div>
    </div>
  )
}
