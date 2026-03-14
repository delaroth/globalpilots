'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import { getAllDestinations, getDestinationCost, calculateTripCost, type BudgetTier, type DestinationCost } from '@/lib/destination-costs'
import { buildBookingBundle, AFFILIATE_FLAGS } from '@/lib/affiliate'

interface TripResult {
  destination: DestinationCost
  days: number
  tier: BudgetTier
  dailyCosts: { hotel: number; food: number; transport: number; activities: number }
  dailyTotal: number
  totalGroundCost: number
  breakdown: { hotel: number; food: number; transport: number; activities: number }
  flightEstimate: number | null
  totalEstimatedCost: number
}

const tierLabels: Record<BudgetTier, string> = {
  budget: 'Budget',
  mid: 'Mid-Range',
  comfort: 'Comfort',
}

const tierDescriptions: Record<BudgetTier, string> = {
  budget: 'Hostels, street food, local transport, free activities',
  mid: '3-star hotels, restaurants, ride-hailing, paid attractions',
  comfort: '4-star hotels, nice dining, private transfers, premium activities',
}

const tierColors: Record<BudgetTier, string> = {
  budget: 'from-green-500 to-emerald-600',
  mid: 'from-blue-500 to-indigo-600',
  comfort: 'from-purple-500 to-pink-600',
}

function TripCostContent() {
  const searchParams = useSearchParams()
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(5)
  const [tier, setTier] = useState<BudgetTier>('mid')
  const [origin, setOrigin] = useState('')
  const [showOrigin, setShowOrigin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TripResult | null>(null)
  const [allDestinations] = useState<DestinationCost[]>(getAllDestinations())
  const [quickPickRegion, setQuickPickRegion] = useState<string>('all')

  // Handle URL query params (e.g., /trip-cost?dest=BKK or /trip-cost?destination=BKK)
  useEffect(() => {
    const dest = searchParams.get('dest') || searchParams.get('destination')
    if (dest && getDestinationCost(dest)) {
      setDestination(dest.toUpperCase())
    }
  }, [searchParams])

  // Get regions for quick pick filter
  const regions = ['all', ...new Set(allDestinations.map(d => d.region))]

  const filteredDestinations = quickPickRegion === 'all'
    ? allDestinations
    : allDestinations.filter(d => d.region === quickPickRegion)

  const handleCalculate = useCallback(async () => {
    if (!destination) return

    setLoading(true)

    // First do a local calculation (instant)
    const localCalc = calculateTripCost(destination, days, tier)
    const destData = getDestinationCost(destination)

    if (!localCalc || !destData) {
      setLoading(false)
      return
    }

    let flightEstimate: number | null = null

    // If origin is set, try to fetch flight price from API
    if (origin) {
      try {
        const params = new URLSearchParams({
          destination,
          days: String(days),
          tier,
          origin,
        })
        const res = await fetch(`/api/trip-cost?${params}`)
        if (res.ok) {
          const data = await res.json()
          if (data.flight?.estimated) {
            flightEstimate = data.flight.estimated
          }
        }
      } catch {
        // Flight fetch failed, continue with ground costs only
      }
    }

    setResult({
      destination: destData,
      days,
      tier,
      dailyCosts: localCalc.dailyCosts,
      dailyTotal: localCalc.dailyTotal,
      totalGroundCost: localCalc.totalCost,
      breakdown: localCalc.breakdown,
      flightEstimate,
      totalEstimatedCost: localCalc.totalCost + (flightEstimate || 0),
    })

    setLoading(false)
  }, [destination, days, tier, origin])

  // Auto-calculate when destination changes
  useEffect(() => {
    if (destination) {
      handleCalculate()
    }
  }, [destination, days, tier, handleCalculate])

  const handleQuickPick = (code: string) => {
    setDestination(code)
  }

  // Build booking links
  const bookingBundle = result
    ? buildBookingBundle({
        origin: origin || 'BKK',
        destination: result.destination.code,
        cityName: result.destination.city,
        departDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        nights: days,
      })
    : null

  // Calculate bar widths for visual breakdown
  const getBarWidth = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.max(3, (value / total) * 100)
  }

  // Month names for best months display
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-navy via-navy-dark to-navy">
      <Navigation />

      <section className="flex-1 px-4 md:px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Trip Cost Calculator
          </h1>
          <p className="text-skyblue-light text-lg max-w-2xl mx-auto">
            Estimate your total trip cost for 60+ destinations. Real daily cost data for hotels, food, transport, and activities.
          </p>
        </div>

        {/* Calculator Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Destination */}
            <div>
              <AirportAutocomplete
                value={destination}
                onChange={setDestination}
                label="Destination"
                placeholder="Search city or airport code..."
                id="trip-destination"
              />
              {destination && !getDestinationCost(destination) && (
                <p className="text-sm text-orange-600 mt-1">
                  No cost data for this airport. Try a major city nearby.
                </p>
              )}
            </div>

            {/* Origin (optional) */}
            <div>
              {!showOrigin ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-navy">
                    Origin (for flight estimate)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOrigin(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-skyblue hover:text-skyblue transition text-left"
                  >
                    + Add origin airport for flight estimate
                  </button>
                </div>
              ) : (
                <AirportAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  label="Origin (for flight estimate)"
                  placeholder="Where are you flying from?"
                  id="trip-origin"
                />
              )}
            </div>
          </div>

          {/* Trip Length Slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy mb-2">
              Trip Length: <span className="text-skyblue font-bold text-lg">{days} {days === 1 ? 'day' : 'days'}</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={days}
              onChange={e => setDays(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 day</span>
              <span>1 week</span>
              <span>2 weeks</span>
              <span>30 days</span>
            </div>
          </div>

          {/* Budget Tier Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy mb-3">Budget Tier</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['budget', 'mid', 'comfort'] as BudgetTier[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    tier === t
                      ? 'border-skyblue bg-skyblue/10 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${tier === t ? 'text-skyblue' : 'text-navy'}`}>
                      {tierLabels[t]}
                    </span>
                    {tier === t && (
                      <span className="bg-skyblue text-white text-xs px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{tierDescriptions[t]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Pick Destinations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-navy">Quick Pick</label>
              <div className="flex gap-1 flex-wrap">
                {regions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQuickPickRegion(r)}
                    className={`text-xs px-2 py-1 rounded-full transition ${
                      quickPickRegion === r
                        ? 'bg-skyblue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r === 'all' ? 'All' : r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredDestinations.slice(0, 20).map(d => {
                const dailyTotal = d.dailyCosts[tier].hotel + d.dailyCosts[tier].food + d.dailyCosts[tier].transport + d.dailyCosts[tier].activities
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => handleQuickPick(d.code)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition ${
                      destination === d.code
                        ? 'bg-navy text-white border-navy'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-skyblue hover:bg-skyblue/5'
                    }`}
                  >
                    {d.city} <span className="text-xs opacity-70">${dailyTotal}/day</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-skyblue mx-auto mb-4" />
            <p className="text-skyblue-light">Calculating trip costs...</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Total Cost Hero Card */}
            <div className={`bg-gradient-to-br ${tierColors[result.tier]} rounded-2xl p-8 text-white shadow-2xl`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                    Estimated Total for {result.days} days in
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold mt-1">
                    {result.destination.city}, {result.destination.country}
                  </h2>
                  <p className="text-white/70 text-sm mt-1">
                    {tierLabels[result.tier]} tier | {result.destination.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-5xl md:text-6xl font-extrabold">
                    ${result.totalEstimatedCost.toLocaleString()}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    ${result.dailyTotal}/day ground costs
                    {result.flightEstimate ? ` + $${result.flightEstimate} flights` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Bars */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-navy mb-4">Cost Breakdown</h3>
                <div className="space-y-4">
                  {result.flightEstimate && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Flights</span>
                        <span className="font-semibold text-navy">${result.flightEstimate}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${getBarWidth(result.flightEstimate, result.totalEstimatedCost)}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {Math.round((result.flightEstimate / result.totalEstimatedCost) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {[
                    { label: 'Hotels', value: result.breakdown.hotel, color: 'from-blue-400 to-blue-500' },
                    { label: 'Food', value: result.breakdown.food, color: 'from-green-400 to-green-500' },
                    { label: 'Transport', value: result.breakdown.transport, color: 'from-yellow-400 to-yellow-500' },
                    { label: 'Activities', value: result.breakdown.activities, color: 'from-purple-400 to-purple-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-navy">${item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full flex items-center justify-end pr-2`}
                          style={{ width: `${getBarWidth(item.value, result.totalEstimatedCost)}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {Math.round((item.value / result.totalEstimatedCost) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Breakdown Table */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-navy mb-4">Daily Breakdown</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left text-sm text-gray-500 pb-2">Category</th>
                      <th className="text-right text-sm text-gray-500 pb-2">Per Day</th>
                      <th className="text-right text-sm text-gray-500 pb-2">{result.days} Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 text-navy flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                        Hotels
                      </td>
                      <td className="text-right text-navy font-medium">${result.dailyCosts.hotel}</td>
                      <td className="text-right text-navy font-bold">${result.breakdown.hotel}</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 text-navy flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                        Food
                      </td>
                      <td className="text-right text-navy font-medium">${result.dailyCosts.food}</td>
                      <td className="text-right text-navy font-bold">${result.breakdown.food}</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 text-navy flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                        Transport
                      </td>
                      <td className="text-right text-navy font-medium">${result.dailyCosts.transport}</td>
                      <td className="text-right text-navy font-bold">${result.breakdown.transport}</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 text-navy flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />
                        Activities
                      </td>
                      <td className="text-right text-navy font-medium">${result.dailyCosts.activities}</td>
                      <td className="text-right text-navy font-bold">${result.breakdown.activities}</td>
                    </tr>
                    {result.flightEstimate && (
                      <tr className="border-b border-gray-50">
                        <td className="py-3 text-navy flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                          Flights (round trip est.)
                        </td>
                        <td className="text-right text-gray-400">-</td>
                        <td className="text-right text-navy font-bold">${result.flightEstimate}</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-3 text-navy pl-5">Total</td>
                      <td className="text-right text-navy">${result.dailyTotal}/day</td>
                      <td className="text-right text-navy text-lg">${result.totalEstimatedCost}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Best months */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Best months to visit:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.destination.bestMonths.map(m => (
                      <span key={m} className="bg-skyblue/10 text-skyblue text-xs px-2 py-1 rounded-full font-medium">
                        {monthNames[m - 1]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Compare Tiers */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-navy mb-4">Compare All Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['budget', 'mid', 'comfort'] as BudgetTier[]).map(t => {
                  const calc = calculateTripCost(result.destination.code, result.days, t)
                  if (!calc) return null
                  const isSelected = t === result.tier
                  return (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-skyblue bg-skyblue/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className={`font-bold ${isSelected ? 'text-skyblue' : 'text-navy'}`}>
                          {tierLabels[t]}
                        </h4>
                        {isSelected && (
                          <span className="bg-skyblue text-white text-xs px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold text-navy mb-1">
                        ${(calc.totalCost + (result.flightEstimate || 0)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">${calc.dailyTotal}/day</p>
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Hotel</span><span>${calc.dailyCosts.hotel}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Food</span><span>${calc.dailyCosts.food}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transport</span><span>${calc.dailyCosts.transport}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Activities</span><span>${calc.dailyCosts.activities}/day</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Saving Tips */}
            {result.destination.savingTips.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-navy mb-4">
                  Money-Saving Tips for {result.destination.city}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.destination.savingTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 bg-green-50 rounded-lg p-3">
                      <span className="text-green-500 font-bold text-lg shrink-0">$</span>
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Buttons */}
            {bookingBundle && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-navy mb-4">Ready to Book?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a
                    href={bookingBundle.flightUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                  >
                    Book Flights
                    <span className="block text-sm font-normal mt-1 opacity-90">
                      {AFFILIATE_FLAGS.kiwi ? 'Search on Kiwi' : 'Search on Aviasales'}
                    </span>
                  </a>
                  <a
                    href={bookingBundle.hotelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                  >
                    Find Hotels
                    <span className="block text-sm font-normal mt-1 opacity-90">
                      Search on Agoda
                    </span>
                  </a>
                  <a
                    href={bookingBundle.activitiesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                  >
                    Book Activities
                    <span className="block text-sm font-normal mt-1 opacity-90">
                      Browse on GetYourGuide
                    </span>
                  </a>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Prices are estimates based on averages. Actual costs may vary by season and availability.
                </p>
              </div>
            )}

            {/* Continue planning links */}
            {result && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
                <span className="text-xs text-white/40">Continue planning:</span>
                <Link
                  href={`/search?destination=${encodeURIComponent(result.destination.code)}${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`}
                  className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
                >
                  Search flights to {result.destination.city}
                </Link>
                {origin && (
                  <Link
                    href={`/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(result.destination.code)}`}
                    className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
                  >
                    Explore stopover routes
                  </Link>
                )}
                <Link
                  href="/mystery"
                  className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
                >
                  Plan a multi-city trip
                </Link>
                <Link
                  href="/mystery"
                  className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
                >
                  Mystery destination
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty state — no destination selected */}
        {!destination && !loading && !result && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">&#x1F4B0;</div>
            <h2 className="text-2xl font-bold text-white mb-2">Select a destination to get started</h2>
            <p className="text-skyblue-light max-w-md mx-auto">
              Search for a city above or use the quick pick buttons to see daily cost breakdowns for any destination.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}

export default function TripCostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-navy via-navy-dark to-navy flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <TripCostContent />
    </Suspense>
  )
}
