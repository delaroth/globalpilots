'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import CurrencySelector from '@/components/CurrencySelector'
import { useCurrency } from '@/hooks/useCurrency'
import Link from 'next/link'

// ── Vibe options ──────────────────────────────────────────────────────────────
const vibeOptions = [
  { emoji: '\u{1F3D6}', label: 'Beach', value: 'beach' },
  { emoji: '\u{1F3D9}', label: 'City', value: 'city' },
  { emoji: '\u{1F3D4}', label: 'Adventure', value: 'adventure' },
  { emoji: '\u{1F35C}', label: 'Food', value: 'food' },
  { emoji: '\u{1F33F}', label: 'Nature', value: 'nature' },
]

// ── Travel style options ──────────────────────────────────────────────────────
const styleOptions = [
  { label: 'Budget', value: 'budget', desc: '$30-60/night' },
  { label: 'Mid-range', value: 'mid-range', desc: '$60-120/night' },
  { label: 'Comfort', value: 'comfort', desc: '$120-200/night' },
]

// ── Result types ──────────────────────────────────────────────────────────────
interface TripResult {
  destination: string
  country: string
  iata: string
  estimated_flight_cost: number
  estimated_hotel_per_night: number
  flightSource: string
  priceIsLive: boolean
  whyThisPlace: string
  bestTimeToGo: string
  localTip: string
  best_local_food: string[]
  budgetBreakdown: {
    flights: number
    hotel: number
    activities: number
    food: number
    total: number
  }
  hotel_recommendations?: { name: string; estimated_price_per_night: number; neighborhood: string; why_recommended: string }[]
  daily_itinerary?: { day: number; activities: { time: string; activity: string; estimated_cost: number }[]; total_day_cost: number }[]
  local_transportation?: { airport_to_city: string; daily_transport: string; estimated_daily_cost: number }
  day1?: string[]
  day2?: string[]
  day3?: string[]
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlanMyTripPage() {
  const currency = useCurrency()

  // Form state
  const [destination, setDestination] = useState('')
  const [destinationName, setDestinationName] = useState('')
  const [origin, setOrigin] = useState('')
  const [budget, setBudget] = useState('')
  const [tripDuration, setTripDuration] = useState(5)
  const [style, setStyle] = useState('mid-range')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])

  // Result state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TripResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleVibe = (value: string) => {
    setSelectedVibes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const canSubmit = destination && origin && budget && parseFloat(budget) > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destinationName || destination,
          destinationCode: destination,
          country: '',
          origin,
          budget: currency.toUSD(parseFloat(budget)),
          tripDuration,
          vibes: selectedVibes,
          accommodationLevel: style,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-slate-950">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-[#0a0a0f] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-sky-600/10 to-cyan-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-3">
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Plan My Trip
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Choose your destination. AI plans the perfect trip.
          </p>
        </div>
      </section>

      {/* Form */}
      {!result && (
        <section className="max-w-3xl mx-auto px-6 pb-16 w-full">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            {/* Destination + Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Where do you want to go? *
                </label>
                <div className="airport-dark-theme">
                  <AirportAutocomplete
                    id="plan-destination"
                    label=""
                    value={destination}
                    onChange={(code) => setDestination(code)}
                    onSearchChange={(text) => setDestinationName(text)}
                    placeholder="City or airport code..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Flying from *
                </label>
                <div className="airport-dark-theme">
                  <AirportAutocomplete
                    id="plan-origin"
                    label=""
                    value={origin}
                    onChange={setOrigin}
                    placeholder="Your home airport..."
                    persistKey="origin"
                  />
                </div>
              </div>
            </div>

            {/* Budget + Trip Length */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Total Budget *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="1000"
                      min="100"
                      className="w-full pl-8 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition text-sm"
                    />
                  </div>
                  <CurrencySelector
                    code={currency.code}
                    currencies={currency.currencies}
                    onChange={currency.setCurrency}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Trip Length
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={tripDuration}
                    onChange={(e) => setTripDuration(parseInt(e.target.value))}
                    className="flex-1 accent-sky-400"
                  />
                  <span className="text-white font-bold text-sm w-16 text-center bg-white/[0.06] border border-white/10 rounded-lg px-2 py-2">
                    {tripDuration} {tripDuration === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Travel Style */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Travel Style
              </label>
              <div className="flex gap-3">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyle(opt.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                      style === opt.value
                        ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                        : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80'
                    }`}
                  >
                    <span className="block font-bold">{opt.label}</span>
                    <span className="block text-xs opacity-60 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                What are you into?
              </label>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.value)
                  return (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => toggleVibe(vibe.value)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition border ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                          : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80'
                      }`}
                    >
                      <span className="mr-1.5">{vibe.emoji}</span>
                      {vibe.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className={`w-full py-4 rounded-xl font-bold text-base transition ${
                canSubmit && !loading
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.02] cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI is planning your trip...
                </span>
              ) : (
                'Plan My Trip'
              )}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Alt link */}
            <div className="text-center">
              <Link
                href="/mystery"
                className="text-sm text-white/40 hover:text-purple-400 transition"
              >
                Don&apos;t know where to go? Try a Mystery Vacation &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      {result && (
        <section className="max-w-4xl mx-auto px-6 pb-16 w-full">
          {/* Back button */}
          <button
            onClick={() => setResult(null)}
            className="mb-6 text-sm text-white/50 hover:text-white transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Plan another trip
          </button>

          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Your Trip to{' '}
              <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                {result.destination}
              </span>
            </h2>
            {result.country && (
              <p className="text-white/50 text-lg">{result.country}</p>
            )}
          </div>

          {/* Why this place */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold text-lg mb-2">Why {result.destination}?</h3>
            <p className="text-white/70 leading-relaxed">{result.whyThisPlace}</p>
          </div>

          {/* Budget breakdown + Quick facts side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Budget */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4">Budget Breakdown</h3>
              {result.budgetBreakdown && (
                <div className="space-y-3">
                  {[
                    { label: 'Flights', value: result.budgetBreakdown.flights, color: 'bg-sky-400' },
                    { label: 'Hotel', value: result.budgetBreakdown.hotel, color: 'bg-purple-400' },
                    { label: 'Activities', value: result.budgetBreakdown.activities, color: 'bg-amber-400' },
                    { label: 'Food', value: result.budgetBreakdown.food, color: 'bg-emerald-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-white/70 text-sm">{item.label}</span>
                      </div>
                      <span className="text-white font-semibold text-sm">{currency.format(item.value)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-sky-400 font-bold text-lg">
                      {currency.format(result.budgetBreakdown.total)}
                    </span>
                  </div>
                  {!result.priceIsLive && (
                    <p className="text-white/30 text-xs">Flight price is estimated. Check live prices for accuracy.</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick facts */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-bold text-lg mb-2">Quick Facts</h3>
              {result.bestTimeToGo && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Best Time to Go</span>
                  <p className="text-white/80 text-sm mt-0.5">{result.bestTimeToGo}</p>
                </div>
              )}
              {result.localTip && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Insider Tip</span>
                  <p className="text-white/80 text-sm mt-0.5">{result.localTip}</p>
                </div>
              )}
              {result.best_local_food && result.best_local_food.length > 0 && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Must-Try Food</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {result.best_local_food.map((food, i) => (
                      <span key={i} className="px-2 py-1 bg-white/[0.06] rounded-lg text-white/70 text-xs">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.local_transportation && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Getting Around</span>
                  <p className="text-white/80 text-sm mt-0.5">{result.local_transportation.daily_transport}</p>
                  <p className="text-white/50 text-xs mt-0.5">~{currency.format(result.local_transportation.estimated_daily_cost)}/day</p>
                </div>
              )}
            </div>
          </div>

          {/* Hotels */}
          {result.hotel_recommendations && result.hotel_recommendations.length > 0 && (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold text-lg mb-4">Hotel Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.hotel_recommendations.map((hotel, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-white font-semibold text-sm">{hotel.name}</h4>
                      <span className="text-sky-400 font-bold text-sm whitespace-nowrap ml-2">
                        {currency.format(hotel.estimated_price_per_night)}/night
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mb-1">{hotel.neighborhood}</p>
                    <p className="text-white/60 text-xs">{hotel.why_recommended}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Itinerary */}
          {result.daily_itinerary && result.daily_itinerary.length > 0 && (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold text-lg mb-4">Daily Itinerary</h3>
              <div className="space-y-6">
                {result.daily_itinerary.map((day) => (
                  <div key={day.day}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold mr-2">
                          {day.day}
                        </span>
                        Day {day.day}
                      </h4>
                      <span className="text-white/40 text-xs">
                        ~{currency.format(day.total_day_cost)}
                      </span>
                    </div>
                    <div className="space-y-2 ml-9">
                      {day.activities.map((activity, j) => (
                        <div key={j} className="flex items-start gap-3 text-sm">
                          <span className="text-white/40 text-xs font-mono w-16 flex-shrink-0 pt-0.5">
                            {activity.time}
                          </span>
                          <span className="text-white/80 flex-1">{activity.activity}</span>
                          {activity.estimated_cost > 0 && (
                            <span className="text-white/40 text-xs whitespace-nowrap">
                              {currency.format(activity.estimated_cost)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transportation from airport */}
          {result.local_transportation?.airport_to_city && (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold text-lg mb-2">Getting from the Airport</h3>
              <p className="text-white/70 text-sm">{result.local_transportation.airport_to_city}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href={`/search?origin=${origin}&destination=${result.iata}`}
              className="flex-1 text-center bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Search Flights to {result.destination}
            </Link>
            <button
              onClick={() => setResult(null)}
              className="flex-1 text-center bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold py-3 px-6 rounded-xl transition border border-white/10"
            >
              Plan Another Trip
            </button>
          </div>
        </section>
      )}

      {/* Loading overlay */}
      {loading && (
        <section className="max-w-3xl mx-auto px-6 pb-16 w-full">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-12 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Planning your trip...</h3>
            <p className="text-white/50 text-sm">Finding flights, hotels, and building your itinerary</p>
          </div>
        </section>
      )}

      <div className="flex-1" />
      <Footer />

      {/* Styles for dark-themed AirportAutocomplete */}
      <style jsx global>{`
        .airport-dark-theme .space-y-2 > label {
          display: none;
        }
        .airport-dark-theme input {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 0.75rem !important;
        }
        .airport-dark-theme input::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .airport-dark-theme input:focus {
          border-color: rgba(56, 189, 248, 0.5) !important;
        }
        .airport-dark-theme .bg-gray-50 {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .airport-dark-theme .text-navy,
        .airport-dark-theme .font-semibold.text-navy {
          color: white !important;
        }
        .airport-dark-theme .text-gray-600,
        .airport-dark-theme .text-sm.text-gray-600 {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .airport-dark-theme .text-gray-500 {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .airport-dark-theme .hover\\:bg-gray-200:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .airport-dark-theme .text-gray-400 {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .airport-dark-theme .bg-skyblue\\/10 {
          background: rgba(56, 189, 248, 0.15) !important;
        }
        .airport-dark-theme .text-skyblue {
          color: rgb(56, 189, 248) !important;
        }
        .airport-dark-theme .bg-white {
          background: #1a1a2e !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .airport-dark-theme .hover\\:bg-skyblue\\/10:hover {
          background: rgba(56, 189, 248, 0.1) !important;
        }
        .airport-dark-theme .border-gray-100 {
          border-color: rgba(255, 255, 255, 0.06) !important;
        }
        .airport-dark-theme .font-semibold:not(.text-navy) {
          color: white !important;
        }
        .airport-dark-theme .text-blue-700 {
          color: rgb(56, 189, 248) !important;
        }
        .airport-dark-theme .text-blue-500 {
          color: rgba(56, 189, 248, 0.7) !important;
        }
        .airport-dark-theme .bg-blue-50\\/50 {
          background: rgba(56, 189, 248, 0.08) !important;
        }
      `}</style>
    </main>
  )
}
