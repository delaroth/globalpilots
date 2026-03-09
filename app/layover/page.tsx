'use client'

import { useState } from 'react'
import Link from 'next/link'
import RouteComparison from '@/components/RouteComparison'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import { majorHubs, LayoverRoute } from '@/lib/hubs'

export default function LayoverPage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departDate, setDepartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [directPrice, setDirectPrice] = useState<number | null>(null)
  const [bestLayover, setBestLayover] = useState<LayoverRoute | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDirectPrice(null)
    setBestLayover(null)

    try {
      // Fetch direct route price
      const directResponse = await fetch(
        `/api/travelpayouts/prices?origin=${origin}&destination=${destination}&depart_date=${departDate}`
      )

      if (!directResponse.ok) {
        throw new Error('Failed to fetch flight prices')
      }

      const directData = await directResponse.json()
      const directFlights = directData.data || []

      if (directFlights.length === 0) {
        throw new Error('No direct flights found for this route')
      }

      const directFlightPrice = directFlights[0].value

      setDirectPrice(directFlightPrice)

      // Fetch prices for routes via major hubs
      const hubRoutes: LayoverRoute[] = []

      // Check top 5 hubs for performance
      const hubsToCheck = majorHubs.slice(0, 5)

      for (const hub of hubsToCheck) {
        try {
          // Leg 1: Origin to Hub
          const leg1Response = await fetch(
            `/api/travelpayouts/prices?origin=${origin}&destination=${hub.code}`
          )
          const leg1Data = await leg1Response.json()
          const leg1Flights = leg1Data.data || []

          if (leg1Flights.length === 0) continue

          const leg1Price = leg1Flights[0].value

          // Leg 2: Hub to Destination
          const leg2Response = await fetch(
            `/api/travelpayouts/prices?origin=${hub.code}&destination=${destination}`
          )
          const leg2Data = await leg2Response.json()
          const leg2Flights = leg2Data.data || []

          if (leg2Flights.length === 0) continue

          const leg2Price = leg2Flights[0].value

          const totalPrice = leg1Price + leg2Price
          const savings = directFlightPrice - totalPrice

          if (savings > 50) {
            // Only consider if savings > $50
            hubRoutes.push({
              hub,
              leg1Price,
              leg2Price,
              totalPrice,
              savings,
              savingsPercent: Math.round((savings / directFlightPrice) * 100),
            })
          }
        } catch (err) {
          // Skip this hub if there's an error
          continue
        }
      }

      // Find the best layover option
      if (hubRoutes.length > 0) {
        const best = hubRoutes.sort((a, b) => b.savings - a.savings)[0]
        setBestLayover(best)
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
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-white">❌ {error}</p>
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
