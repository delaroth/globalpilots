'use client'

import { useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CurrencySelector from '@/components/CurrencySelector'
import { useCurrency } from '@/hooks/useCurrency'
import { getAllDestinations } from '@/lib/destination-costs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityItem {
  time: string
  activity: string
  cost: number
  transport?: string
}

interface MealItem {
  meal: string
  suggestion: string
  priceRange: string
  cost: number
}

interface DayItinerary {
  day: number
  morning: ActivityItem[]
  afternoon: ActivityItem[]
  evening: ActivityItem[]
  meals: MealItem[]
  dailyTotal: number
}

interface DayTripResult {
  destination: string
  itinerary: DayItinerary[]
  tips: string[]
  totalEstimatedCost: number
  costData: {
    city: string
    country: string
    currency: string
    savingTips: string[]
  } | null
}

// ---------------------------------------------------------------------------
// Interest pills
// ---------------------------------------------------------------------------

const ALL_INTERESTS = [
  { id: 'food', label: 'Food', icon: '🍜' },
  { id: 'culture', label: 'Culture', icon: '🏛' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'shopping', label: 'Shopping', icon: '🛍' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'adventure', label: 'Adventure', icon: '⛰' },
]

// ---------------------------------------------------------------------------
// Shimmer skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 animate-pulse">
      <div className="h-5 w-32 bg-white/10 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-white/[0.06] rounded" />
        <div className="h-4 w-5/6 bg-white/[0.06] rounded" />
        <div className="h-4 w-4/6 bg-white/[0.06] rounded" />
      </div>
      <div className="mt-6 h-5 w-24 bg-white/10 rounded" />
      <div className="mt-3 space-y-3">
        <div className="h-4 w-full bg-white/[0.06] rounded" />
        <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
      </div>
      <div className="mt-6 h-5 w-28 bg-white/10 rounded" />
      <div className="mt-3 space-y-3">
        <div className="h-4 w-full bg-white/[0.06] rounded" />
        <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
      </div>
    </div>
  )
}

function LoadingSkeleton({ days }: { days: number }) {
  return (
    <div className="space-y-6 mt-10">
      <div className="h-8 w-64 bg-white/10 rounded animate-pulse mx-auto" />
      {Array.from({ length: days }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-white/10 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-white/[0.06] rounded" />
          <div className="h-4 w-5/6 bg-white/[0.06] rounded" />
          <div className="h-4 w-4/6 bg-white/[0.06] rounded" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Activity row
// ---------------------------------------------------------------------------

function ActivityRow({ item, currencyFormat }: { item: ActivityItem; currencyFormat: (n: number) => string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-sky-400 text-xs font-mono whitespace-nowrap mt-0.5 w-20 flex-shrink-0">
        {item.time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm">{item.activity}</p>
        {item.transport && (
          <p className="text-white/40 text-xs mt-0.5">
            🚶 {item.transport}
          </p>
        )}
      </div>
      <span className="text-emerald-400 text-sm font-medium whitespace-nowrap flex-shrink-0">
        {item.cost === 0 ? 'Free' : currencyFormat(item.cost)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meal row
// ---------------------------------------------------------------------------

function MealRow({ item, currencyFormat }: { item: MealItem; currencyFormat: (n: number) => string }) {
  const mealIcons: Record<string, string> = {
    Breakfast: '🌅',
    Lunch: '☀️',
    Dinner: '🌆',
    Snack: '🍡',
  }
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-lg w-6 flex-shrink-0">{mealIcons[item.meal] || '🍽'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-medium">{item.meal}</p>
        <p className="text-white/60 text-xs mt-0.5">{item.suggestion}</p>
      </div>
      <span className="text-emerald-400 text-sm font-medium whitespace-nowrap flex-shrink-0">
        {item.priceRange || currencyFormat(item.cost)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header with icon
// ---------------------------------------------------------------------------

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <h4 className="flex items-center gap-2 text-white font-semibold text-sm mb-2 mt-4 first:mt-0">
      <span className="text-base">{icon}</span>
      {label}
    </h4>
  )
}

// ---------------------------------------------------------------------------
// Day card
// ---------------------------------------------------------------------------

function DayCard({ day, currencyFormat }: { day: DayItinerary; currencyFormat: (n: number) => string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">
          Day {day.day}
        </h3>
        <span className="text-emerald-400 text-sm font-semibold bg-emerald-400/10 px-3 py-1 rounded-full">
          {currencyFormat(day.dailyTotal)}
        </span>
      </div>

      {/* Morning */}
      {day.morning && day.morning.length > 0 && (
        <>
          <SectionHeader icon="🌅" label="Morning" />
          {day.morning.map((item, i) => (
            <ActivityRow key={`m-${i}`} item={item} currencyFormat={currencyFormat} />
          ))}
        </>
      )}

      {/* Afternoon */}
      {day.afternoon && day.afternoon.length > 0 && (
        <>
          <SectionHeader icon="☀️" label="Afternoon" />
          {day.afternoon.map((item, i) => (
            <ActivityRow key={`a-${i}`} item={item} currencyFormat={currencyFormat} />
          ))}
        </>
      )}

      {/* Evening */}
      {day.evening && day.evening.length > 0 && (
        <>
          <SectionHeader icon="🌙" label="Evening" />
          {day.evening.map((item, i) => (
            <ActivityRow key={`e-${i}`} item={item} currencyFormat={currencyFormat} />
          ))}
        </>
      )}

      {/* Meals */}
      {day.meals && day.meals.length > 0 && (
        <>
          <SectionHeader icon="🍽" label="Where to Eat" />
          {day.meals.map((item, i) => (
            <MealRow key={`meal-${i}`} item={item} currencyFormat={currencyFormat} />
          ))}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DayTripPage() {
  const [cityName, setCityName] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<{ city: string; country: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [budget, setBudget] = useState('50')
  const [days, setDays] = useState(1)
  const [interests, setInterests] = useState<string[]>(['food', 'culture'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DayTripResult | null>(null)
  const [copied, setCopied] = useState(false)

  const currency = useCurrency()

  const toggleInterest = useCallback((id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }, [])

  const handleCityInput = useCallback((text: string) => {
    setCityName(text)
    if (text.trim().length >= 2) {
      const query = text.toLowerCase().trim()
      const allCities = getAllDestinations()
      const matches = allCities.filter(d =>
        d.city.toLowerCase().includes(query) ||
        d.country.toLowerCase().includes(query)
      ).slice(0, 8)
      setCitySuggestions(matches.map(d => ({ city: d.city, country: d.country })))
      setShowSuggestions(true)
    } else {
      setCitySuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const resolvedCity = cityName.trim()
    if (!resolvedCity) {
      setError('Please select a city.')
      return
    }
    if (!budget || Number(budget) <= 0) {
      setError('Please enter a valid budget.')
      return
    }
    if (interests.length === 0) {
      setError('Please select at least one interest.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const budgetUSD = currency.toUSD(Number(budget))

      const res = await fetch('/api/day-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: resolvedCity,
          budget: budgetUSD,
          days,
          interests,
          currency: currency.code,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const data: DayTripResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [cityName, budget, days, interests, currency])

  const handleShare = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const currencyFormat = useCallback(
    (amountUSD: number) => currency.format(amountUSD),
    [currency]
  )

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-950 pt-8 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Plan My Day Trip
            </h1>
            <p className="text-white/60 text-base sm:text-lg">
              AI-powered itineraries with restaurants, activities, and budget breakdowns
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            {/* City */}
            <div className="mb-5 relative">
              <label htmlFor="day-trip-city" className="block text-white text-sm font-medium mb-1.5">
                City
              </label>
              <input
                type="text"
                id="day-trip-city"
                value={cityName}
                onChange={(e) => handleCityInput(e.target.value)}
                onFocus={() => cityName.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Bangkok, Paris, Tokyo..."
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition"
                autoComplete="off"
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto">
                  {citySuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => {
                        setCityName(s.city)
                        setShowSuggestions(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-sky-50 transition text-sm"
                    >
                      <span className="font-medium text-slate-800">{s.city}</span>
                      <span className="text-slate-400 ml-2">{s.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Budget + Currency */}
            <div className="mb-5">
              <label htmlFor="day-trip-budget" className="block text-white text-sm font-medium mb-1.5">
                Daily Budget
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                    {currency.symbol}
                  </span>
                  <input
                    id="day-trip-budget"
                    type="number"
                    min={1}
                    max={99999}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/25 transition"
                    placeholder="50"
                  />
                </div>
                <CurrencySelector
                  code={currency.code}
                  currencies={currency.currencies}
                  onChange={currency.setCurrency}
                  compact
                />
              </div>
              {!currency.isUSD && budget && Number(budget) > 0 && currency.rate && (
                <p className="text-white/30 text-xs mt-1">
                  ~${currency.toUSD(Number(budget))} USD
                </p>
              )}
            </div>

            {/* Days selector */}
            <div className="mb-5">
              <label className="block text-white text-sm font-medium mb-1.5">
                Number of Days
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      days === d
                        ? 'bg-sky-400 text-slate-900'
                        : 'bg-white/[0.06] text-white/60 border border-white/[0.1] hover:bg-white/[0.1] hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_INTERESTS.map((interest) => {
                  const selected = interests.includes(interest.id)
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition ${
                        selected
                          ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
                          : 'bg-white/[0.06] text-white/50 border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70'
                      }`}
                    >
                      <span>{interest.icon}</span>
                      {interest.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl text-base transition"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Generating Itinerary...
                </span>
              ) : (
                'Plan My Day'
              )}
            </button>
          </div>

          {/* Loading skeleton */}
          {loading && <LoadingSkeleton days={days} />}

          {/* Results */}
          {result && !loading && (
            <div className="mt-10 space-y-6">
              {/* Title */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {result.itinerary.length}-Day Itinerary for {result.destination}
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  Estimated total: {currencyFormat(result.totalEstimatedCost)}
                </p>
              </div>

              {/* Day cards */}
              {result.itinerary.map((day) => (
                <DayCard key={day.day} day={day} currencyFormat={currencyFormat} />
              ))}

              {/* Practical tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <span>💡</span> Practical Tips
                  </h3>
                  <ul className="space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                        <span className="text-sky-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Saving tips from cost data */}
              {result.costData?.savingTips && result.costData.savingTips.length > 0 && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <span>💰</span> Budget Tips for {result.costData.city}
                  </h3>
                  <ul className="space-y-2">
                    {result.costData.savingTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Total cost + Share */}
              <div className="bg-gradient-to-r from-sky-400/10 to-emerald-400/10 border border-sky-400/20 rounded-2xl p-6 text-center">
                <p className="text-white/60 text-sm mb-1">Total Estimated Cost</p>
                <p className="text-3xl font-bold text-white">
                  {currencyFormat(result.totalEstimatedCost)}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {result.itinerary.length} day{result.itinerary.length > 1 ? 's' : ''} in {result.destination}
                </p>
                <button
                  onClick={handleShare}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] rounded-full text-white/80 text-sm font-medium transition"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share Itinerary
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
