'use client'

import { useState } from 'react'
import { generateAffiliateLink } from '@/lib/affiliate'

interface Destination {
  destination: string
  country: string
  city_code_IATA: string
  estimated_flight_cost: number
  estimated_hotel_per_night: number
  why_its_perfect: string
  day1: string[]
  day2: string[]
  day3: string[]
  best_local_food: string[]
  insider_tip: string
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
  const [shareUrl, setShareUrl] = useState('')

  const handleReveal = () => {
    setRevealed(true)
  }

  const handleBookTrip = () => {
    const affiliateLink = generateAffiliateLink({
      origin,
      destination: destination.city_code_IATA,
      departDate,
    })
    window.open(affiliateLink, '_blank')
  }

  const handleShare = () => {
    const url = `${window.location.origin}/mystery?dest=${encodeURIComponent(destination.destination)}`
    setShareUrl(url)
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  const totalCost = destination.estimated_flight_cost + (destination.estimated_hotel_per_night * 3)

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-1000 ${
          revealed ? 'blur-0' : 'blur-xl'
        }`}
      >
        {/* Reveal Overlay */}
        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-navy/80 backdrop-blur-sm">
            <button
              onClick={handleReveal}
              className="bg-skyblue hover:bg-skyblue-dark text-navy font-bold text-2xl py-6 px-12 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse"
            >
              ✨ Reveal Your Mystery Destination ✨
            </button>
          </div>
        )}

        {/* Content */}
        <div className="relative">
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
            {/* Cost Summary */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-6 border-2 border-green-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Flight</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${destination.estimated_flight_cost}
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

            {/* Why It's Perfect */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy mb-2">Why This Destination?</h3>
              <p className="text-gray-700">{destination.why_its_perfect}</p>
            </div>

            {/* 3-Day Itinerary */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy mb-4">Your 3-Day Adventure</h3>
              <div className="space-y-4">
                {/* Day 1 */}
                <div className="bg-skyblue/10 rounded-lg p-4">
                  <h4 className="font-semibold text-navy mb-2">Day 1</h4>
                  <ul className="space-y-1">
                    {destination.day1.map((activity, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-skyblue mr-2">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Day 2 */}
                <div className="bg-skyblue/10 rounded-lg p-4">
                  <h4 className="font-semibold text-navy mb-2">Day 2</h4>
                  <ul className="space-y-1">
                    {destination.day2.map((activity, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-skyblue mr-2">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Day 3 */}
                <div className="bg-skyblue/10 rounded-lg p-4">
                  <h4 className="font-semibold text-navy mb-2">Day 3</h4>
                  <ul className="space-y-1">
                    {destination.day3.map((activity, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-skyblue mr-2">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Food */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-navy mb-3">Must-Try Local Food</h3>
              <div className="flex flex-wrap gap-2">
                {destination.best_local_food.map((food, idx) => (
                  <span
                    key={idx}
                    className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    🍽 {food}
                  </span>
                ))}
              </div>
            </div>

            {/* Insider Tip */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h3 className="font-semibold text-navy mb-1">💡 Insider Tip</h3>
              <p className="text-gray-700">{destination.insider_tip}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleBookTrip}
                className="col-span-1 md:col-span-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ✈️ Book This Trip
              </button>
              <button
                onClick={onShowAnother}
                className="bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl"
              >
                🔄 Show Me Another
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition"
            >
              🔗 Share This Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
