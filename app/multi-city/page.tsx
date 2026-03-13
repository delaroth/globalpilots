'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'

const regionOptions = [
  { label: 'Any Region', value: 'Any' },
  { label: 'Southeast Asia', value: 'Southeast Asia' },
  { label: 'East Asia', value: 'East Asia' },
  { label: 'Europe', value: 'Europe' },
  { label: 'Middle East', value: 'Middle East' },
  { label: 'Americas', value: 'Americas' },
]

const vibeOptions = [
  { emoji: '\u{1F3D6}\u{FE0F}', label: 'Beach', value: 'Beach' },
  { emoji: '\u{1F3D9}\u{FE0F}', label: 'City', value: 'City' },
  { emoji: '\u{26F0}\u{FE0F}', label: 'Adventure', value: 'Adventure' },
  { emoji: '\u{1F35C}', label: 'Food', value: 'Food' },
  { emoji: '\u{1F3DB}\u{FE0F}', label: 'Culture', value: 'Culture' },
  { emoji: '\u{1F333}', label: 'Nature', value: 'Nature' },
]

const loadingMessages = [
  'Planning your adventure...',
  'Picking the best cities...',
  'Optimizing your route...',
  'Checking flight connections...',
  'Calculating budgets...',
  'Finding hidden gems...',
  'Almost there...',
]

interface CityStop {
  code: string
  name: string
  country: string
  days: number
  estimatedFlightCost: number
  estimatedDailyCost: number
  highlights: string[]
}

interface BookingLink {
  from: string
  to: string
  label: string
  url: string
}

interface TripResult {
  cities: CityStop[]
  totalEstimatedCost: number
  route: string
  bookingLinks: BookingLink[]
  reasoning: string
}

function MultiCityContent() {
  const searchParams = useSearchParams()
  const [origin, setOrigin] = useState('')
  const [totalBudget, setTotalBudget] = useState('')
  const [totalDays, setTotalDays] = useState(10)
  const [numCities, setNumCities] = useState(3)
  const [region, setRegion] = useState('Any')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])

  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form')
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [result, setResult] = useState<TripResult | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Pre-fill origin from URL params (e.g., /multi-city?origin=BKK)
  useEffect(() => {
    const o = searchParams.get('origin')
    if (o) setOrigin(o.toUpperCase())
  }, [searchParams])

  // Cycle loading messages
  useEffect(() => {
    if (step !== 'loading') return
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [step])

  // Scroll to error
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Scroll to results
  useEffect(() => {
    if (step === 'results' && result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
  }, [step, result])

  const handleVibeToggle = (vibe: string) => {
    if (error) setError('')
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!origin) {
      setError('Please select your departure city.')
      setIsSubmitting(false)
      return
    }

    const budgetNum = parseFloat(totalBudget)
    if (!totalBudget || budgetNum < 200) {
      setError('Please enter a budget of at least $200.')
      setIsSubmitting(false)
      return
    }

    setStep('loading')
    setLoadingMsgIndex(0)

    try {
      const response = await fetch('/api/multi-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          totalBudget: budgetNum,
          totalDays,
          numCities,
          region: region !== 'Any' ? region : undefined,
          vibe: selectedVibes.length > 0 ? selectedVibes : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || `Request failed (HTTP ${response.status})`)
      }

      const data: TripResult = await response.json()

      if (!data.cities || data.cities.length === 0) {
        throw new Error('No cities returned. Try adjusting your budget or preferences.')
      }

      setResult(data)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartOver = () => {
    setStep('form')
    setResult(null)
    setError('')
  }

  const handleShare = async () => {
    if (!result) return
    const text = `Check out this multi-city trip I planned with GlobePilot!\n\n${result.route}\n\nEstimated cost: $${result.totalEstimatedCost}\n\nPlan yours at ${window.location.href}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Multi-City Trip', text })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Trip details copied to clipboard!')
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Multi-City Trip Planner
          </h1>
          <p className="text-xl text-skyblue-light max-w-2xl mx-auto">
            Let AI plan your perfect multi-stop adventure. Optimized routes, smart budgets, unforgettable experiences.
          </p>
        </div>

        {/* FORM */}
        {step === 'form' && (
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">

              {/* Origin */}
              <div>
                <label className="block text-lg font-semibold text-navy mb-2">
                  Starting from
                </label>
                <AirportAutocomplete
                  id="multi-origin"
                  label=""
                  value={origin}
                  onChange={(code) => {
                    setOrigin(code)
                    if (error) setError('')
                  }}
                  placeholder="Search your departure city..."
                />
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="multi-budget" className="block text-lg font-semibold text-navy mb-2">
                  Total budget (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
                  <input
                    type="number"
                    id="multi-budget"
                    value={totalBudget}
                    onChange={(e) => {
                      setTotalBudget(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="2000"
                    min="200"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Covers all flights + daily expenses across all cities</p>
              </div>

              {/* Trip Length Slider */}
              <div>
                <label className="block text-lg font-semibold text-navy mb-2">
                  Trip length: <span className="text-skyblue-dark">{totalDays} days</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={totalDays}
                  onChange={(e) => setTotalDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>5 days</span>
                  <span>30 days</span>
                </div>
              </div>

              {/* Number of Cities */}
              <div>
                <label className="block text-lg font-semibold text-navy mb-3">
                  Number of cities
                </label>
                <div className="flex gap-3">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumCities(n)}
                      className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                        numCities === n
                          ? 'bg-skyblue text-navy shadow-lg ring-2 ring-skyblue-dark'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <label htmlFor="multi-region" className="block text-lg font-semibold text-navy mb-2">
                  Region preference <span className="text-gray-400 text-sm font-normal">(optional)</span>
                </label>
                <select
                  id="multi-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy bg-white"
                >
                  {regionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Vibes */}
              <div>
                <label className="block text-lg font-semibold text-navy mb-3">
                  Vibe <span className="text-gray-400 text-sm font-normal">(optional, select multiple)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {vibeOptions.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => handleVibeToggle(v.value)}
                      className={`px-5 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 ${
                        selectedVibes.includes(v.value)
                          ? 'bg-skyblue text-navy shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div ref={errorRef} className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                  <p className="text-red-700 font-semibold text-center">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xl py-5 px-6 rounded-xl transition shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Planning your trip...</span>
                  </>
                ) : (
                  'Plan My Trip'
                )}
              </button>
            </form>

            <p className="text-center text-skyblue-light mt-6 text-sm">
              Our AI will optimize your route for minimal backtracking, smart budget allocation, and diverse experiences.
            </p>
          </div>
        )}

        {/* LOADING */}
        {step === 'loading' && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-navy-dark/95 backdrop-blur-sm">
            <div className="max-w-lg w-full mx-4 text-center">
              <div className="bg-navy-light/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-amber-400/40 shadow-2xl">
                {/* Animated globe */}
                <div className="relative mx-auto w-24 h-24 mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-navy-light flex items-center justify-center">
                    <svg className="w-12 h-12 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">
                  {loadingMessages[loadingMsgIndex]}
                </h2>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {loadingMessages.slice(0, 5).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                        i <= loadingMsgIndex ? 'bg-amber-400 scale-110' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && result && (
          <div ref={resultsRef} className="max-w-5xl mx-auto space-y-8">

            {/* Route Visualization */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20">
              <h2 className="text-lg font-semibold text-skyblue-light mb-6 text-center uppercase tracking-wider">Your Route</h2>

              {/* Route bubbles */}
              <div className="flex items-center justify-center flex-wrap gap-y-4">
                {/* Origin bubble */}
                <div className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-skyblue to-skyblue-dark flex items-center justify-center shadow-lg ring-2 ring-skyblue/50">
                      <span className="text-navy font-bold text-sm">{origin}</span>
                    </div>
                    <span className="text-xs text-skyblue-light mt-1.5">Start</span>
                  </div>
                </div>

                {result.cities.map((city, idx) => (
                  <div key={city.code} className="flex items-center">
                    {/* Connector line with plane */}
                    <div className="flex items-center mx-1 md:mx-2">
                      <div className="w-6 md:w-12 h-px bg-gradient-to-r from-skyblue/60 to-amber-400/60" />
                      <svg className="w-5 h-5 text-amber-400 -mx-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                      </svg>
                      <div className="w-6 md:w-12 h-px bg-gradient-to-r from-amber-400/60 to-skyblue/60" />
                    </div>

                    {/* City bubble */}
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 md:w-18 md:h-18 rounded-full flex items-center justify-center shadow-lg ring-2 ${
                        idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-amber-400/50' :
                        idx === 1 ? 'bg-gradient-to-br from-emerald-400 to-teal-500 ring-emerald-400/50' :
                        idx === 2 ? 'bg-gradient-to-br from-purple-400 to-pink-500 ring-purple-400/50' :
                        idx === 3 ? 'bg-gradient-to-br from-rose-400 to-red-500 ring-rose-400/50' :
                        'bg-gradient-to-br from-blue-400 to-indigo-500 ring-blue-400/50'
                      }`}>
                        <div className="text-center">
                          <span className="text-white font-bold text-xs block">{city.code}</span>
                          <span className="text-white/80 text-[10px] block">{city.days}d</span>
                        </div>
                      </div>
                      <span className="text-xs text-white mt-1.5 max-w-[80px] text-center truncate">{city.name}</span>
                    </div>
                  </div>
                ))}

                {/* Return connector and origin bubble */}
                <div className="flex items-center">
                  <div className="flex items-center mx-1 md:mx-2">
                    <div className="w-6 md:w-12 h-px bg-gradient-to-r from-skyblue/60 to-amber-400/60" />
                    <svg className="w-5 h-5 text-amber-400 -mx-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                    </svg>
                    <div className="w-6 md:w-12 h-px bg-gradient-to-r from-amber-400/60 to-skyblue/60" />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-skyblue to-skyblue-dark flex items-center justify-center shadow-lg ring-2 ring-skyblue/50">
                      <span className="text-navy font-bold text-sm">{origin}</span>
                    </div>
                    <span className="text-xs text-skyblue-light mt-1.5">Return</span>
                  </div>
                </div>
              </div>

              {/* Route text */}
              <p className="text-center text-white/80 mt-6 font-mono text-sm tracking-widest">{result.route}</p>

              {/* AI reasoning */}
              {result.reasoning && (
                <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-skyblue-light text-sm italic text-center">{result.reasoning}</p>
                </div>
              )}
            </div>

            {/* City Cards */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">Your Stops</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.cities.map((city, idx) => {
                  const cityTotal = city.estimatedFlightCost + (city.estimatedDailyCost * city.days)
                  const gradients = [
                    'from-amber-500/20 to-orange-500/20 border-amber-400/30 hover:border-amber-400/60',
                    'from-emerald-500/20 to-teal-500/20 border-emerald-400/30 hover:border-emerald-400/60',
                    'from-purple-500/20 to-pink-500/20 border-purple-400/30 hover:border-purple-400/60',
                    'from-rose-500/20 to-red-500/20 border-rose-400/30 hover:border-rose-400/60',
                    'from-blue-500/20 to-indigo-500/20 border-blue-400/30 hover:border-blue-400/60',
                  ]

                  return (
                    <div
                      key={city.code}
                      className={`bg-gradient-to-br ${gradients[idx % gradients.length]} backdrop-blur-sm rounded-2xl p-6 border transition-all hover:shadow-xl`}
                    >
                      {/* City header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm font-mono">#{idx + 1}</span>
                            <h3 className="text-xl font-bold text-white">{city.name}</h3>
                          </div>
                          <p className="text-skyblue-light text-sm">{city.country}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg px-3 py-1.5">
                          <span className="text-white font-bold text-sm">{city.days} days</span>
                        </div>
                      </div>

                      {/* Cost breakdown */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-skyblue-light">Flight to {city.code}</span>
                          <span className="text-white font-semibold">${city.estimatedFlightCost}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-skyblue-light">Daily costs</span>
                          <span className="text-white font-semibold">${city.estimatedDailyCost}/day</span>
                        </div>
                        <div className="border-t border-white/20 pt-2 flex justify-between">
                          <span className="text-skyblue-light font-medium">Subtotal</span>
                          <span className="text-white font-bold">${cityTotal}</span>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-1.5 mb-5">
                        {city.highlights.map((highlight, hIdx) => (
                          <div key={hIdx} className="flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5 flex-shrink-0">&#9733;</span>
                            <span className="text-white/90 text-sm">{highlight}</span>
                          </div>
                        ))}
                      </div>

                      {/* Book flight button */}
                      {result.bookingLinks[idx] && (
                        <a
                          href={result.bookingLinks[idx].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg transition-all border border-white/20 hover:border-white/40 text-sm"
                        >
                          Book flight to {city.name}
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Total Estimated Cost</h3>
                  <p className="text-skyblue-light text-sm">
                    {result.cities.length} cities &middot; {totalDays} days &middot; {result.bookingLinks.length} flights
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-4xl font-bold text-white">${result.totalEstimatedCost}</div>
                  <p className="text-skyblue-light text-sm">
                    of ${totalBudget} budget
                    {result.totalEstimatedCost <= parseFloat(totalBudget)
                      ? ` ($${Math.round(parseFloat(totalBudget) - result.totalEstimatedCost)} remaining)`
                      : ' (over budget)'}
                  </p>
                </div>
              </div>
            </div>

            {/* All Booking Links */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Book All Flights</h3>
              <div className="space-y-3">
                {result.bookingLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-amber-400/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-white font-medium text-sm">{link.label}</span>
                        <span className="block text-skyblue-light text-xs">Leg {idx + 1} of {result.bookingLinks.length}</span>
                      </div>
                    </div>
                    <span className="text-amber-400 font-semibold text-sm group-hover:translate-x-1 transition-transform whitespace-nowrap ml-4">
                      Search flights &rarr;
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-4">
              <button
                onClick={handleStartOver}
                className="px-8 py-3 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 font-semibold transition-all hover:border-white/60"
              >
                Start Over
              </button>
              <button
                onClick={handleShare}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Share This Route
              </button>
            </div>

            {/* Continue planning links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-8">
              <span className="text-xs text-white/40">Continue planning:</span>
              {result.cities.map((city) => (
                <Link
                  key={city.code}
                  href={`/trip-cost?destination=${encodeURIComponent(city.code)}`}
                  className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
                >
                  Daily costs in {city.name}
                </Link>
              ))}
              <Link
                href={`/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(result.cities[0]?.code || '')}`}
                className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
              >
                Explore layover routes
              </Link>
              <Link
                href="/discover"
                className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
              >
                Find cheapest destinations
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}

export default function MultiCityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <MultiCityContent />
    </Suspense>
  )
}
