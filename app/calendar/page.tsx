'use client'

import { useState } from 'react'
import CalendarGrid from '@/components/CalendarGrid'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import Link from 'next/link'

export default function CalendarPage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [month, setMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [calendarData, setCalendarData] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCalendarData(null)

    try {
      const response = await fetch(
        `/api/travelpayouts/calendar?origin=${origin}&destination=${destination}&depart_date=${month}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch calendar data')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setCalendarData(data.data || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Get current month as default
  const currentMonth = new Date().toISOString().slice(0, 7)

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
            Cheapest Days Calendar 📅
          </h1>
          <p className="text-xl text-skyblue-light">
            Find the cheapest day to fly this month
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Origin */}
              <AirportAutocomplete
                id="origin"
                label="From"
                value={origin}
                onChange={setOrigin}
                placeholder="Search departure city..."
              />

              {/* Destination */}
              <AirportAutocomplete
                id="destination"
                label="To"
                value={destination}
                onChange={setDestination}
                placeholder="Search arrival city..."
              />

              {/* Month */}
              <div className="space-y-2">
                <label htmlFor="month" className="block text-sm font-medium text-navy">
                  Month
                </label>
                <input
                  type="month"
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  min={currentMonth}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                  required
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Find Cheapest Days'}
            </button>
          </form>

          {/* Quick tips */}
          <div className="mt-6 bg-skyblue/10 backdrop-blur-sm rounded-lg p-4 border border-skyblue/20">
            <p className="text-skyblue-light text-sm">
              <strong className="text-white">💡 Pro tip:</strong> Use 3-letter airport codes (e.g., NYC for New York, LON for London).
              Click any green day to book the cheapest flights!
            </p>
          </div>
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
            <p className="text-white mt-4 text-lg">Searching thousands of flights...</p>
          </div>
        )}

        {/* Calendar Grid */}
        {calendarData && !loading && (
          <CalendarGrid
            data={calendarData}
            origin={origin}
            destination={destination}
            month={month}
          />
        )}

        {/* How it works */}
        {!calendarData && !loading && (
          <div className="max-w-3xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-white font-semibold mb-2">1. Search</h3>
                <p className="text-skyblue-light text-sm">
                  Enter your departure and destination airports plus the month you want to travel
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-white font-semibold mb-2">2. Compare</h3>
                <p className="text-skyblue-light text-sm">
                  See prices for every day of the month, color-coded from cheapest to most expensive
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">✈️</div>
                <h3 className="text-white font-semibold mb-2">3. Book</h3>
                <p className="text-skyblue-light text-sm">
                  Click any day to book flights at that price through our trusted travel partner
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
