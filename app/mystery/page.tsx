'use client'

import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import CurrencySelector from '@/components/CurrencySelector'
import { useCurrency } from '@/hooks/useCurrency'
import MultiCityResults from '@/components/MultiCityResults'
import type { TripResult } from '@/components/MultiCityResults'
import { searchAirports } from '@/lib/geolocation'
import SocialProof from '@/components/SocialProof'
import PassportButton from '@/components/PassportButton'
import TripHistory from '@/components/TripHistory'
import CompareReveals from '@/components/CompareReveals'
import type { SavedTrip } from '@/lib/trip-history'
import { useMystery } from '@/components/MysteryContext'
import PassportSelector from '@/components/PassportSelector'

// ── Constants ────────────────────────────────────────────────────────────────

const vibeOptions = [
  { label: 'Beach', value: 'beach' },
  { label: 'City', value: 'city' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Food', value: 'food' },
  { label: 'Nature', value: 'nature' },
]

const timeframeOptions = [
  { label: 'Anytime', value: 'anytime' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Next Month', value: 'next-month' },
  { label: 'Next 3 Months', value: 'next-3-months' },
  { label: 'Next 6 Months', value: 'next-6-months' },
]

const accommodationLevels = [
  { label: 'Hostel', value: 'hostel', desc: '$10-30/night', maxPerNight: 30 },
  { label: 'Budget', value: 'budget', desc: '$30-60/night', maxPerNight: 60 },
  { label: 'Mid-Range', value: 'mid-range', desc: '$60-120/night', maxPerNight: 120 },
  { label: 'Upscale', value: 'upscale', desc: '$120-250/night', maxPerNight: 250 },
  { label: 'Luxury', value: 'luxury', desc: '$250+/night', maxPerNight: 500 },
]

const budgetPriorities = [
  { label: 'Fly Further', value: 'flights', desc: 'Explore distant destinations', split: { flights: 50, hotels: 25, activities: 25 } },
  { label: 'Balanced', value: 'balanced', desc: 'Even split across everything', split: { flights: 35, hotels: 35, activities: 30 } },
  { label: 'Better Stays', value: 'hotels', desc: 'Nicer accommodation', split: { flights: 20, hotels: 50, activities: 30 } },
  { label: 'More Experiences', value: 'activities', desc: 'Tours, food, nightlife', split: { flights: 25, hotels: 25, activities: 50 } },
]

const travelStyles = [
  {
    key: 'backpacker' as const,
    emoji: '\uD83C\uDF92',
    label: 'Backpacker',
    desc: 'Hostels, street food, free activities',
    accommodationLevel: 'hostel',
    budgetPriority: 'flights',
  },
  {
    key: 'balanced' as const,
    emoji: '\u2696\uFE0F',
    label: 'Balanced',
    desc: 'Mid-range hotels, local restaurants',
    accommodationLevel: 'mid-range',
    budgetPriority: 'balanced',
  },
  {
    key: 'comfort' as const,
    emoji: '\u2728',
    label: 'Comfort',
    desc: 'Nice hotels, curated experiences',
    accommodationLevel: 'upscale',
    budgetPriority: 'hotels',
  },
]

const durationOptions = Array.from({ length: 20 }, (_, i) => i + 2) // 2-21

// ── Budget context helper ────────────────────────────────────────────────────

function getBudgetContextText(budgetUSD: number): string {
  if (budgetUSD <= 0) return ''
  if (budgetUSD < 500) return 'Great for Southeast Asia, Eastern Europe, or Central America'
  if (budgetUSD <= 1000) return 'Perfect for most destinations worldwide'
  if (budgetUSD <= 2000) return 'Comfortable trips to Japan, Europe, or multi-city adventures'
  return 'Premium experiences anywhere in the world'
}

// ── Live Preview Card ────────────────────────────────────────────────────────

function LivePreviewCard({
  tripDuration,
  originDisplay,
  budget,
  currencySymbol,
  selectedVibes,
  travelStyle,
  knowDestination,
  chosenDestination,
  numCities,
}: {
  tripDuration: number
  originDisplay: string
  budget: string
  currencySymbol: string
  selectedVibes: string[]
  travelStyle: string
  knowDestination: boolean
  chosenDestination: string
  numCities: number
}) {
  const styleLabel = travelStyles.find(s => s.key === travelStyle)?.label || 'Custom'
  const vibeLabel = selectedVibes.length > 0 ? selectedVibes.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ') : 'Any'

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-sm text-white/80 backdrop-blur-sm">
      <p className="font-semibold text-white/90 mb-2">Your Trip</p>
      <p className="mb-1">
        {tripDuration} day{tripDuration !== 1 ? 's' : ''} from {originDisplay || '...'}
      </p>
      <p className="mb-1">
        Budget: {budget ? `${currencySymbol}${budget}` : '...'}{selectedVibes.length > 0 ? ` \u00B7 ${vibeLabel}` : ''}
      </p>
      <p className="mb-1">
        Style: {styleLabel}
      </p>
      <p className="text-sky-400/80">
        {numCities > 1
          ? `\uD83C\uDF0D ${numCities}-city mystery route`
          : knowDestination && chosenDestination
            ? `\u2708\uFE0F ${chosenDestination}`
            : '\uD83C\uDFB2 Mystery destination'}
      </p>
    </div>
  )
}

// ── Result Alternatives ──────────────────────────────────────────────────────

function AlternativesBar({ alternatives }: { alternatives: { destination: string; city: string; country: string; price: number }[] }) {
  if (!alternatives || alternatives.length === 0) return null
  return (
    <div className="mt-6 pt-4 border-t border-slate-700/50">
      <p className="text-sm text-white/50 mb-3">Also considered:</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {alternatives.map((alt, i) => (
          <div key={i} className="flex-shrink-0 bg-slate-800/50 border border-slate-700/40 rounded-lg px-4 py-2.5 text-sm">
            <p className="text-white/90 font-medium">{alt.city || alt.destination}</p>
            <p className="text-white/50 text-xs">{alt.country} &middot; ~${alt.price} flight</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

function MysteryPageContent() {
  const searchParams = useSearchParams()
  const getTwoWeeksFromNow = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const currency = useCurrency()
  const mystery = useMystery()

  // ── Core form state ──────────────────────────────────────────────────────
  const [budget, setBudget] = useState('')
  const [origin, setOrigin] = useState('')
  const [originInputText, setOriginInputText] = useState('')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  // Passport
  const [passports, setPassports] = useState<string[]>([])

  // Destination
  const [knowDestination, setKnowDestination] = useState(false)
  const [chosenDestination, setChosenDestination] = useState('')

  // Travel style (maps to accommodation + budget priority internally)
  const [travelStyle, setTravelStyle] = useState<'backpacker' | 'balanced' | 'comfort' | 'custom'>('balanced')

  // Budget split
  const [showBudgetSplit, setShowBudgetSplit] = useState(false)
  const [customSplit, setCustomSplit] = useState({ flights: 35, hotels: 35, activities: 30 })
  const [budgetPriority, setBudgetPriority] = useState('balanced')

  // When & how long
  const [timeframe, setTimeframe] = useState('anytime')
  const [tripDuration, setTripDuration] = useState(5)
  const [showSpecificDates, setShowSpecificDates] = useState(false)
  const [departDate, setDepartDate] = useState(getTwoWeeksFromNow())
  const [flexibleDates, setFlexibleDates] = useState(false)

  // Travel style customization
  const [showStyleCustomize, setShowStyleCustomize] = useState(false)
  const [selectedAccommodation, setSelectedAccommodation] = useState<string[]>(['mid-range'])

  // Multi-city
  const [showMultiCity, setShowMultiCity] = useState(false)
  const [numCities, setNumCities] = useState(1)
  const [region, setRegion] = useState('Any')
  const [multiCityResult, setMultiCityResult] = useState<TripResult | null>(null)
  const [multiCitySearching, setMultiCitySearching] = useState(false)
  const multiCityAbortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Trip history & compare
  const [tripHistoryOpen, setTripHistoryOpen] = useState(false)
  const [compareTrips, setCompareTrips] = useState<SavedTrip[] | null>(null)

  // ── Derived values ───────────────────────────────────────────────────────

  // Resolve accommodation level from travel style or custom selection
  const accommodationOrder = ['hostel', 'budget', 'mid-range', 'upscale', 'luxury']
  const accommodationLevel = useMemo(() => {
    if (travelStyle !== 'custom') {
      return travelStyles.find(s => s.key === travelStyle)?.accommodationLevel || 'mid-range'
    }
    // Custom: pick highest selected
    if (selectedAccommodation.length === 0) return 'mid-range'
    return selectedAccommodation.reduce((highest, curr) =>
      accommodationOrder.indexOf(curr) > accommodationOrder.indexOf(highest) ? curr : highest
    )
  }, [travelStyle, selectedAccommodation])

  const effectiveBudgetPriority = useMemo(() => {
    if (travelStyle !== 'custom') {
      return travelStyles.find(s => s.key === travelStyle)?.budgetPriority || 'balanced'
    }
    return budgetPriority
  }, [travelStyle, budgetPriority])

  const budgetUSD = useMemo(() => {
    const num = parseFloat(budget)
    if (!num || num <= 0) return 0
    return currency.toUSD(num)
  }, [budget, currency])

  // ── URL param prefill ────────────────────────────────────────────────────
  useEffect(() => {
    const dest = searchParams.get('destination') || searchParams.get('dest')
    const orig = searchParams.get('origin')
    const budgetParam = searchParams.get('budget')
    const dateParam = searchParams.get('date')

    if (dest) {
      setKnowDestination(true)
      setChosenDestination(dest.toUpperCase())
    }
    if (orig) setOrigin(orig.toUpperCase())
    if (budgetParam) setBudget(budgetParam)
    if (dateParam) {
      setShowSpecificDates(true)
      setDepartDate(dateParam)
    }
  }, [searchParams])

  // Whether a single-city mystery search is active (from context)
  const isSingleCitySearching = mystery.isVisible && numCities === 1
  const isSearching = isSingleCitySearching || multiCitySearching

  // Adjust trip duration when numCities changes
  useEffect(() => {
    if (numCities === 1) {
      setTripDuration(prev => Math.min(prev, 21))
    } else {
      const minDays = Math.max(5, numCities * 2)
      setTripDuration(prev => Math.max(prev, minDays))
    }
  }, [numCities])

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Pre-fill origin from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !origin) {
      const raw = localStorage.getItem('gp_origin')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed && parsed.code) {
            setOrigin(parsed.code)
          }
        } catch {
          setOrigin(raw)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When travel style changes, sync accommodation + budget priority
  const handleTravelStyleChange = (style: 'backpacker' | 'balanced' | 'comfort') => {
    setTravelStyle(style)
    setShowStyleCustomize(false)
    const def = travelStyles.find(s => s.key === style)!
    setSelectedAccommodation([def.accommodationLevel])
    setBudgetPriority(def.budgetPriority)
    const preset = budgetPriorities.find(p => p.value === def.budgetPriority)
    if (preset) setCustomSplit(preset.split)
  }

  const toggleAccommodation = (value: string) => {
    setSelectedAccommodation(prev =>
      prev.includes(value) ? (prev.length > 1 ? prev.filter(v => v !== value) : prev) : [...prev, value]
    )
    setTravelStyle('custom')
  }

  const handleVibeToggle = (vibe: string) => {
    if (error) setError('')
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    )
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCancel = () => {
    if (numCities > 1) {
      if (multiCityAbortRef.current) {
        multiCityAbortRef.current.abort()
        multiCityAbortRef.current = null
      }
      setMultiCitySearching(false)
      setMultiCityResult(null)
    } else {
      mystery.dismiss()
    }
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Auto-resolve origin if user typed text but didn't select from dropdown
    let resolvedOrigin = origin
    if (!origin && originInputText.trim()) {
      const normalizedInput = originInputText.trim()
      const matches = searchAirports(normalizedInput)
      if (matches.length > 0) {
        const exactMatch = matches.find(a =>
          a.city.toLowerCase() === normalizedInput.toLowerCase()
        )
        if (exactMatch) {
          resolvedOrigin = exactMatch.code
        } else if (matches.length === 1) {
          resolvedOrigin = matches[0].code
        }
      }
    }

    // Validate
    if (!resolvedOrigin) {
      const errorMsg = originInputText.trim()
        ? 'Please select a city from the dropdown suggestions. Multiple cities match your search - click one to confirm.'
        : 'Please select your departure city!'
      setError(errorMsg)
      return
    }

    if (knowDestination && !chosenDestination && numCities === 1) {
      setError('Please select your destination!')
      return
    }

    if (!budget || parseFloat(budget) <= 0) {
      setError('Please enter a budget greater than $0!')
      return
    }

    const minBudget = numCities > 1 ? 200 : 100
    if (parseFloat(budget) < minBudget) {
      setError(`Please enter a budget of at least $${minBudget}!`)
      return
    }

    if (showSpecificDates) {
      if (!departDate) {
        setError('Please select a departure date!')
        return
      }
      const selectedDate = new Date(departDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        setError('Please select a future date! Time travel tickets are unfortunately not available yet.')
        return
      }
    }

    // Hardcoded package components (always include everything)
    const packageComponents = {
      includeFlight: true,
      includeHotel: true,
      includeItinerary: true,
      includeTransportation: true,
    }

    // Trip duration: 0 means AI decides — use a sensible default and tell the API it's flexible
    const effectiveDuration = tripDuration === 0 ? 5 : tripDuration
    const isFlexibleDuration = tripDuration === 0

    // Build dates string
    let requestDates = showSpecificDates
      ? `${departDate}${flexibleDates ? ' (flexible \u00B13 days)' : ''}`
      : `flexible:${timeframe}`
    if (isFlexibleDuration) {
      requestDates += ' (flexible trip length - optimize for budget)'
    }

    // Vibes: if none selected, default to a broad set so the API has something to work with
    const vibes = selectedVibes.length > 0 ? selectedVibes : ['city', 'beach', 'food']

    // Budget split: only send custom split if user expanded that section
    const splitPayload = showBudgetSplit ? customSplit : undefined

    // --- Multi-city mystery flow ---
    if (numCities > 1) {
      const abortController = new AbortController()
      multiCityAbortRef.current = abortController
      setMultiCitySearching(true)
      setMultiCityResult(null)

      try {
        const response = await fetch('/api/multi-city', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
          body: JSON.stringify({
            origin: resolvedOrigin,
            totalBudget: parseFloat(budget),
            totalDays: effectiveDuration,
            numCities,
            region: region !== 'Any' ? region : undefined,
            vibe: vibes,
            departureDate: showSpecificDates ? departDate : undefined,
            departureTimeframe: !showSpecificDates ? timeframe : undefined,
            accommodationLevel,
            budgetPriority: effectiveBudgetPriority,
            customSplit: splitPayload,
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

        setMultiCityResult(data)
        setMultiCitySearching(false)
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(errorMsg)
        setMultiCitySearching(false)
      }
      return
    }

    // --- Single-city flow ---
    if (knowDestination && chosenDestination) {
      mystery.startSearch({
        origin: resolvedOrigin,
        budget: currency.toUSD(parseFloat(budget)),
        vibes,
        dates: requestDates,
        tripDuration: effectiveDuration,
        packageComponents,
        accommodationLevel,
        budgetPriority: effectiveBudgetPriority,
        customSplit: splitPayload,
        passports: passports.length > 0 ? passports : undefined,
        destination: chosenDestination,
      })
    } else {
      mystery.startSearch({
        origin: resolvedOrigin,
        budget: currency.toUSD(parseFloat(budget)),
        vibes,
        dates: requestDates,
        tripDuration: effectiveDuration,
        packageComponents,
        accommodationLevel,
        budgetPriority: effectiveBudgetPriority,
        customSplit: splitPayload,
        passports: passports.length > 0 ? passports : undefined,
      })
    }
  }

  const handleReset = () => {
    handleCancel()
  }

  // Multi-city results visible
  const hasMultiCityResults = numCities > 1 && multiCityResult && !multiCitySearching

  // Alternatives from quick search
  const alternatives = mystery.state.destination?.alternatives || null

  // ── Submit button text ───────────────────────────────────────────────────
  const submitText = numCities > 1
    ? 'Plan My Mystery Route'
    : knowDestination
      ? 'Plan My Trip'
      : 'Find My Mystery Destination'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Trip Planner
          </h1>
          <p className="text-xl text-sky-300">
            Set your budget and vibe. AI does the rest.
          </p>
          <div className="mt-4">
            <SocialProof />
          </div>
        </div>

        {/* Form + Live Preview layout */}
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">

          {/* ── FORM ────────────────────────────────────────────────────── */}
          <div className="flex-1 max-w-3xl">
            <form onSubmit={handleSubmit} className={`bg-white rounded-2xl shadow-2xl p-6 md:p-8 transition-opacity ${isSearching ? 'opacity-60' : ''}`}>
              <fieldset disabled={isSearching}>

                {/* ── Section 1: Origin ──────────────────────────────────── */}
                <div className="mb-5">
                  <label htmlFor="origin" className="block text-sm font-medium text-gray-600 mb-1.5">
                    Flying from
                  </label>
                  <AirportAutocomplete
                    id="origin"
                    label=""
                    value={origin}
                    onChange={setOrigin}
                    onSearchChange={setOriginInputText}
                    placeholder="Search your departure city..."
                    persistKey="origin"
                  />
                </div>

                {/* ── Passport (for visa-free filtering) ──────────────── */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Passport <span className="text-gray-400 font-normal">(for visa-free destinations)</span>
                  </label>
                  <PassportSelector
                    selected={passports}
                    onChange={setPassports}
                    maxSelections={3}
                    variant="light"
                  />
                </div>

                {/* ── Section 2: Destination (single-city only) ──────────── */}
                {numCities <= 1 && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Destination
                    </label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3">
                      <button
                        type="button"
                        onClick={() => setKnowDestination(false)}
                        className={`flex-1 py-2.5 text-sm font-medium transition ${
                          !knowDestination
                            ? 'bg-sky-500 text-white'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        \uD83C\uDFB2 Surprise Me
                      </button>
                      <button
                        type="button"
                        onClick={() => setKnowDestination(true)}
                        className={`flex-1 py-2.5 text-sm font-medium transition ${
                          knowDestination
                            ? 'bg-sky-500 text-white'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        \uD83D\uDCCD Choose Destination
                      </button>
                    </div>

                    {knowDestination ? (
                      <AirportAutocomplete
                        id="chosen-destination"
                        label=""
                        value={chosenDestination}
                        onChange={setChosenDestination}
                        placeholder="Search your destination city..."
                      />
                    ) : (
                      <div className="bg-sky-50 border border-sky-100 rounded-lg px-4 py-2.5 text-center">
                        <p className="text-sky-600 text-sm">AI finds the perfect destination for your budget and vibes</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Section 3: Budget ──────────────────────────────────── */}
                <div className="mb-5">
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-600 mb-1.5">
                    Budget
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                        {currency.symbol}
                      </span>
                      <input
                        type="number"
                        id="budget"
                        value={budget}
                        onChange={(e) => {
                          setBudget(e.target.value)
                          if (error) setError('')
                        }}
                        placeholder="1500"
                        min="100"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition text-slate-900"
                        required
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
                    <p className="text-xs text-gray-400 mt-1">
                      &asymp; ${currency.toUSD(Number(budget))} USD
                    </p>
                  )}
                  {/* Budget context text */}
                  {budgetUSD > 0 && (
                    <p className="text-xs text-sky-600/80 mt-1.5">
                      {getBudgetContextText(budgetUSD)}
                    </p>
                  )}
                  {/* Split budget expansion link */}
                  <button
                    type="button"
                    onClick={() => setShowBudgetSplit(!showBudgetSplit)}
                    className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                  >
                    <span className={`transition-transform inline-block ${showBudgetSplit ? 'rotate-90' : ''}`}>&#x25B8;</span>
                    Split budget
                  </button>

                  {/* Expanded budget split */}
                  {showBudgetSplit && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                      {budget && Number(budget) > 0 && (
                        <p className="text-xs text-gray-500 mb-2">
                          Allocating {currency.symbol}{budget}:
                        </p>
                      )}
                      {[
                        { key: 'flights' as const, label: 'Flights' },
                        { key: 'hotels' as const, label: 'Hotels' },
                        { key: 'activities' as const, label: 'Food & Activities' },
                      ].map(({ key, label }) => {
                        const pct = customSplit[key]
                        const amount = budget ? Math.floor(Number(budget) * (pct / 100)) : 0
                        return (
                          <div key={key}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {label}
                              </span>
                              <span className="text-sm text-gray-600 font-semibold tabular-nums">
                                {pct}%{amount > 0 ? ` (${currency.symbol}${amount})` : ''}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={80}
                              value={pct}
                              onChange={(e) => {
                                const newVal = Number(e.target.value)
                                const diff = newVal - customSplit[key]
                                const others = (['flights', 'hotels', 'activities'] as const).filter(k => k !== key)
                                const otherTotal = others.reduce((s, k) => s + customSplit[k], 0)
                                const newSplit = { ...customSplit, [key]: newVal }
                                for (const ok of others) {
                                  const share = otherTotal > 0 ? customSplit[ok] / otherTotal : 0.5
                                  newSplit[ok] = Math.max(5, Math.round(customSplit[ok] - diff * share))
                                }
                                const sum = newSplit.flights + newSplit.hotels + newSplit.activities
                                if (sum !== 100) {
                                  const largest = others.reduce((a, b) => newSplit[a] >= newSplit[b] ? a : b)
                                  newSplit[largest] += 100 - sum
                                }
                                setCustomSplit(newSplit)
                                setBudgetPriority('custom')
                                setTravelStyle('custom')
                              }}
                              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-sky-400 bg-gray-200"
                            />
                          </div>
                        )
                      })}
                      {/* Quick presets */}
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {budgetPriorities.map(p => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => {
                              setCustomSplit(p.split)
                              setBudgetPriority(p.value)
                            }}
                            className={`text-xs px-2.5 py-1 rounded transition ${
                              budgetPriority === p.value
                                ? 'bg-sky-500 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: When & How Long ─────────────────────────── */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    When & how long
                  </label>

                  {/* Quick flexible option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTimeframe('anytime')
                      setTripDuration(0) // 0 = AI decides
                      setShowSpecificDates(false)
                    }}
                    className={`w-full mb-3 py-2 rounded-lg text-sm font-medium transition border ${
                      timeframe === 'anytime' && tripDuration === 0 && !showSpecificDates
                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    ✨ Fully flexible — AI picks the best dates & trip length for my budget
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Timeframe / date display */}
                    {!showSpecificDates ? (
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition text-slate-900 bg-white text-sm"
                      >
                        {timeframeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="date"
                        value={departDate}
                        onChange={(e) => setDepartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition text-slate-900 text-sm"
                      />
                    )}
                    {/* Duration dropdown */}
                    <select
                      value={tripDuration}
                      onChange={(e) => setTripDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition text-slate-900 bg-white text-sm"
                    >
                      <option value={0}>AI picks best length</option>
                      {durationOptions.map(d => (
                        <option key={d} value={d}>{d} days</option>
                      ))}
                    </select>
                  </div>
                  {tripDuration === 0 && (
                    <p className="text-xs text-sky-600/80 mt-1.5">
                      AI will optimize trip length based on your budget and destination costs
                    </p>
                  )}

                  {/* Toggle specific dates / flexible */}
                  {!showSpecificDates ? (
                    <button
                      type="button"
                      onClick={() => setShowSpecificDates(true)}
                      className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                    >
                      <span>&#x25B8;</span> Pick specific dates
                    </button>
                  ) : (
                    <>
                      <div className="mt-2 flex items-center gap-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flexibleDates}
                            onChange={(e) => setFlexibleDates(e.target.checked)}
                            className="w-4 h-4 text-sky-400 border-gray-300 rounded focus:ring-sky-400"
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            Flexible &plusmn;3 days
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSpecificDates(false)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition"
                        >
                          Use flexible timeframe instead
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Section 5: Vibes (optional) ────────────────────────── */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Vibes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {vibeOptions.map((vibe) => (
                      <button
                        key={vibe.value}
                        type="button"
                        onClick={() => handleVibeToggle(vibe.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedVibes.includes(vibe.value)
                            ? 'bg-sky-500 text-slate-900 shadow-sm ring-1 ring-sky-500/50'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {vibe.label}
                      </button>
                    ))}
                  </div>
                  {selectedVibes.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Select none and AI chooses based on your budget and availability
                    </p>
                  )}
                </div>

                {/* ── Section 6: Travel Style ────────────────────────────── */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Travel style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {travelStyles.map((style) => (
                      <button
                        key={style.key}
                        type="button"
                        onClick={() => handleTravelStyleChange(style.key)}
                        className={`py-3 px-2 rounded-lg text-center transition-all ${
                          travelStyle === style.key
                            ? 'bg-sky-500 text-white ring-2 ring-sky-400/50 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-xl mb-1">{style.emoji}</div>
                        <div className="text-sm font-semibold">{style.label}</div>
                        <div className={`text-[11px] mt-0.5 ${travelStyle === style.key ? 'text-white/80' : 'text-gray-400'}`}>
                          {style.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                  {travelStyle === 'custom' && (
                    <p className="text-xs text-sky-600 mt-1.5">Custom style selected</p>
                  )}
                  {/* Customize link */}
                  <button
                    type="button"
                    onClick={() => setShowStyleCustomize(!showStyleCustomize)}
                    className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                  >
                    <span className={`transition-transform inline-block ${showStyleCustomize ? 'rotate-90' : ''}`}>&#x25B8;</span>
                    Customize
                  </button>

                  {showStyleCustomize && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Accommodation type (select one or more):</p>
                      <div className="flex gap-2 flex-wrap">
                        {accommodationLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => toggleAccommodation(level.value)}
                            className={`py-2 px-3 rounded-lg font-medium transition-all text-center text-xs ${
                              selectedAccommodation.includes(level.value)
                                ? 'bg-sky-500 text-white ring-1 ring-sky-400/50'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="font-semibold">{level.label}</div>
                            <div className={`text-[10px] mt-0.5 ${selectedAccommodation.includes(level.value) ? 'text-white/70' : 'text-gray-400'}`}>{level.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 7: Multi-city (hidden by default) ──────────── */}
                {!showMultiCity ? (
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => setShowMultiCity(true)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                    >
                      <span>&#x25B8;</span> Planning a multi-city trip?
                    </button>
                  </div>
                ) : (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      How many destinations
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNumCities(n)}
                          className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                            numCities === n
                              ? 'bg-sky-500 text-white ring-1 ring-sky-400/50'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {numCities === 1
                        ? (knowDestination ? 'AI will plan your trip to ' + (chosenDestination || '...') : 'AI picks one perfect destination')
                        : `AI will plan a ${numCities}-city mystery route`}
                    </p>
                    {numCities > 1 && (
                      <div className="mt-3">
                        <label htmlFor="region" className="block text-xs text-gray-500 mb-1">
                          Region preference
                        </label>
                        <select
                          id="region"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition text-slate-900 bg-white text-sm"
                        >
                          <option value="Any">Any Region</option>
                          <option value="Southeast Asia">Southeast Asia</option>
                          <option value="East Asia">East Asia</option>
                          <option value="Europe">Europe</option>
                          <option value="Middle East">Middle East</option>
                          <option value="Americas">Americas</option>
                        </select>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMultiCity(false)
                        setNumCities(1)
                      }}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      Back to single destination
                    </button>
                  </div>
                )}

              </fieldset>

              {/* Error Message */}
              {error && (
                <div
                  ref={errorRef}
                  className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 animate-shake"
                >
                  <p className="text-red-700 font-medium text-center text-sm">{error}</p>
                </div>
              )}

              <style jsx>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                  20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                  animation: shake 0.5s ease-in-out;
                }
              `}</style>

              {/* Submit / Cancel Buttons */}
              {!isSearching ? (
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-500 text-slate-900 font-bold text-lg py-4 px-6 rounded-lg transition shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitText}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled
                    className="flex-1 bg-gradient-to-r from-sky-500/50 to-sky-600/50 text-slate-900/60 font-bold text-lg py-4 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <div className="inline-block w-5 h-5 border-2 border-slate-900/40 border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-4 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* ── Live Preview Card (sidebar on desktop, below on mobile) ── */}
          <div className="lg:w-64 lg:flex-shrink-0 order-first lg:order-last">
            <div className="lg:sticky lg:top-24">
              <LivePreviewCard
                tripDuration={tripDuration}
                originDisplay={origin || originInputText || ''}
                budget={budget}
                currencySymbol={currency.symbol}
                selectedVibes={selectedVibes}
                travelStyle={travelStyle}
                knowDestination={knowDestination}
                chosenDestination={chosenDestination}
                numCities={numCities}
              />
            </div>
          </div>
        </div>

        {/* Active search indicator for single-city */}
        {isSingleCitySearching && (
          <div className="mt-6 text-center max-w-3xl mx-auto">
            <button
              onClick={() => mystery.expand()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer backdrop-blur-sm"
            >
              {mystery.state.status === 'searching' && (
                <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
              )}
              {mystery.state.status === 'quick-ready' && (
                <span>&#x2708;&#xFE0F;</span>
              )}
              {mystery.state.status === 'ready' && (
                <span>&#x2705;</span>
              )}
              {mystery.state.status === 'error' && (
                <span>&#x26A0;&#xFE0F;</span>
              )}
              <span className="text-sm font-medium">
                {mystery.state.status === 'searching' && 'Finding your destination...'}
                {mystery.state.status === 'quick-ready' && `${mystery.state.destination?.destination || 'Destination'} found! Loading details...`}
                {mystery.state.status === 'ready' && 'Your mystery trip is ready! Click to view'}
                {mystery.state.status === 'error' && 'Search failed. Click to see details'}
              </span>
              <span className="text-white/40 text-xs">&#x2197;&#xFE0F;</span>
            </button>
            <p className="text-white/40 text-xs mt-2">
              Your search runs in the background -- feel free to browse other pages!
            </p>

            {/* Alternatives from quick route */}
            {alternatives && <AlternativesBar alternatives={alternatives} />}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sky-300 text-sm">
            Our AI will find you a unique destination that matches your preferences and budget
          </p>
        </div>

        {/* Multi-city results (stays in-page, not in popup) */}
        {hasMultiCityResults && (
          <div ref={resultsRef} className="mt-12">
            <MultiCityResults
              result={multiCityResult!}
              origin={origin}
              totalBudget={budget}
              totalDays={tripDuration}
              onStartOver={handleReset}
            />
          </div>
        )}
      </div>

      {/* Floating Passport Button */}
      <PassportButton />

      {/* Trip History Drawer */}
      <TripHistory
        isOpen={tripHistoryOpen}
        onClose={() => setTripHistoryOpen(false)}
        onSelectTrip={() => setTripHistoryOpen(false)}
        onCompare={(trips) => {
          setTripHistoryOpen(false)
          setCompareTrips(trips)
        }}
      />

      {/* Compare Reveals Modal */}
      {compareTrips && compareTrips.length >= 2 && (
        <CompareReveals
          trips={compareTrips}
          onClose={() => setCompareTrips(null)}
          onBook={() => setCompareTrips(null)}
        />
      )}

      <Footer />
    </div>
  )
}

export default function MysteryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <MysteryPageContent />
    </Suspense>
  )
}
