'use client'

import { useState } from 'react'
import Link from 'next/link'
import RouteComparison from '@/components/RouteComparison'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import { majorHubs, LayoverRoute } from '@/lib/hubs'

export default function LayoverPage() {
  // Default to 2 weeks from now
  const getDefaultDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departDate, setDepartDate] = useState(getDefaultDate())
  const [loading, setLoading] = useState(false)
  const [directPrice, setDirectPrice] = useState<number | null>(null)
  const [bestLayover, setBestLayover] = useState<LayoverRoute | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDirectPrice(null)
    setBestLayover(null)

    // Validate required fields
    if (!origin) {
      setError('Please select a departure airport. Type a 3-letter code like BKK, JFK, or LAX.')
      return
    }

    if (!destination) {
      setError('Please select a destination airport. Type a 3-letter code like BKK, JFK, or LAX.')
      return
    }

    // Validate IATA codes
    if (!/^[A-Z]{3}$/.test(origin)) {
      setError('Invalid departure airport code. Please use a 3-letter IATA code like BKK, JFK, or LAX.')
      return
    }

    if (!/^[A-Z]{3}$/.test(destination)) {
      setError('Invalid destination airport code. Please use a 3-letter IATA code like BKK, JFK, or LAX.')
      return
    }

    if (!departDate) {
      setError('Please select a travel date')
      return
    }

    if (origin === destination) {
      setError('Departure and destination must be different')
      return
    }

    console.log('[Layover] Searching:', { origin, destination, departDate })
    setLoading(true)

    try {
      const response = await fetch(
        `/api/layover?origin=${origin}&destination=${destination}&depart_date=${departDate}`
      )

      console.log('[Layover] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('[Layover] Received data:', data)

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.directPrice) {
        setError('No direct flights found for this route. Try different airports or dates.')
        return
      }

      setDirectPrice(data.directPrice)

      // Convert the API response format to match LayoverRoute interface
      if (data.bestLayover) {
        const hub = majorHubs.find(h => h.code === data.bestLayover.hub)
        if (hub) {
          setBestLayover({
            hub,
            leg1Price: data.bestLayover.leg1Price,
            leg2Price: data.bestLayover.leg2Price,
            totalPrice: data.bestLayover.totalPrice,
            savings: data.bestLayover.savings,
            savingsPercent: data.bestLayover.savingsPercent,
          })
        }
      }
    } catch (err) {
      console.error('[Layover] Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
            Layover Arbitrage 🔄
          </h1>
          <p className="text-xl text-skyblue-light">
            Turn a layover into a free bonus destination
          </p>
          <p className="text-md text-skyblue-light/80 mt-2">
            We compare direct flights vs. stopover routes to find hidden savings
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

              {/* Travel Date */}
              <div className="space-y-2">
                <label htmlFor="departDate" className="block text-sm font-medium text-navy">
                  Travel Date
                </label>
                <input
                  type="date"
                  id="departDate"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
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
              {loading ? 'Analyzing Routes...' : 'Find Savings'}
            </button>
          </form>

          {/* Pro Tips */}
          <div className="mt-6 bg-skyblue/10 backdrop-blur-sm rounded-lg p-4 border border-skyblue/20">
            <p className="text-skyblue-light text-sm">
              <strong className="text-white">💡 Pro tip:</strong> Layover arbitrage works best for international long-haul flights.
              The algorithm checks major hub cities like Dubai, Istanbul, Singapore, and London.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-500 border-2 border-red-600 rounded-lg p-4 shadow-lg">
              <p className="text-white font-semibold text-center">❌ {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue"></div>
            <p className="text-white mt-4 text-lg">Comparing thousands of routes...</p>
            <p className="text-skyblue-light text-sm mt-2">
              This may take 10-15 seconds
            </p>
          </div>
        )}

        {/* Results */}
        {directPrice !== null && !loading && (
          <RouteComparison
            origin={origin}
            destination={destination}
            departDate={departDate}
            directPrice={directPrice}
            bestLayover={bestLayover}
          />
        )}

        {/* How it works */}
        {!directPrice && !loading && (
          <div className="max-w-4xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              How Layover Arbitrage Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-white font-semibold mb-2">1. We Search</h3>
                <p className="text-skyblue-light text-sm">
                  Compare direct flights vs routes through major hub cities
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="text-white font-semibold mb-2">2. Find Savings</h3>
                <p className="text-skyblue-light text-sm">
                  If a stopover route is cheaper, we'll show you the exact savings
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-white font-semibold mb-2">3. Bonus Trip</h3>
                <p className="text-skyblue-light text-sm">
                  Use the layover to explore a new city - two destinations for less!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
