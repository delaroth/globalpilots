'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DestinationCard from '@/components/DestinationCard'
import { majorAirports } from '@/lib/geolocation'

interface WeekendDeal {
  value: number
  trip_class: number
  show_to_affiliates: boolean
  origin: string
  destination: string
  gate: string
  depart_date: string
  return_date: string
  number_of_changes: number
  found_at: string
  distance: number
  actual: boolean
}

export default function WeekendPage() {
  const [origin, setOrigin] = useState('')
  const [loading, setLoading] = useState(false)
  const [deals, setDeals] = useState<WeekendDeal[]>([])
  const [error, setError] = useState('')
  const [autoDetectedCity, setAutoDetectedCity] = useState('')

  // Auto-detect location on mount
  useEffect(() => {
    // For simplicity, set a default city
    // In production, you'd use actual geolocation
    setAutoDetectedCity('New York')
    setOrigin('NYC')
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDeals([])

    try {
      const response = await fetch(
        `/api/travelpayouts/latest?origin=${origin}&period_type=week&limit=6`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch weekend deals')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Extract deals from response
      const dealsData = data.data || []

      if (dealsData.length === 0) {
        setError('No weekend deals found for this city. Try another departure city!')
      } else {
        setDeals(dealsData.slice(0, 6))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
          <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fly Cheap This Weekend 🎉
          </h1>
          <p className="text-xl text-skyblue-light">
            Discover affordable weekend getaways from your city
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="space-y-4">
              {/* Auto-detected location info */}
              {autoDetectedCity && (
                <div className="bg-skyblue/10 border border-skyblue/30 rounded-lg p-3 text-center">
                  <p className="text-sm text-navy">
                    📍 <strong>Leaving from:</strong> {autoDetectedCity}
                  </p>
                </div>
              )}

              {/* City selector */}
              <div className="space-y-2">
                <label htmlFor="origin" className="block text-sm font-medium text-navy">
                  Departure City
                </label>
                <select
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                  required
                >
                  <option value="">Select your city</option>
                  {majorAirports.map(airport => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Finding Deals...' : 'Show Me Cheap Weekends'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-white">❌ {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue"></div>
            <p className="text-white mt-4 text-lg">Scanning weekend deals...</p>
          </div>
        )}

        {/* Deals Grid */}
        {deals.length > 0 && !loading && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Top {deals.length} Weekend Destinations
              </h2>
              <p className="text-skyblue-light">
                These are the cheapest weekend getaways from {origin}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal, index) => (
                <DestinationCard
                  key={`${deal.destination}-${index}`}
                  destination={deal.gate}
                  destinationCode={deal.destination}
                  origin={deal.origin}
                  price={deal.value}
                  departDate={deal.depart_date}
                  returnDate={deal.return_date}
                  distance={deal.distance}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info section when no results */}
        {!loading && deals.length === 0 && !error && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-white font-semibold mb-2">Pick Your City</h3>
                <p className="text-skyblue-light text-sm">
                  Select where you're flying from
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="text-white font-semibold mb-2">See Best Deals</h3>
                <p className="text-skyblue-light text-sm">
                  We'll show you the cheapest weekend destinations
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">✈️</div>
                <h3 className="text-white font-semibold mb-2">Book & Go</h3>
                <p className="text-skyblue-light text-sm">
                  Book your spontaneous weekend adventure
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
