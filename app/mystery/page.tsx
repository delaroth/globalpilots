'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
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

const vibeOptions = [
  { label: 'Beach', value: 'beach' },
  { label: 'City', value: 'city' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Food', value: 'food' },
  { label: 'Nature', value: 'nature' },
]

const timeframeOptions = [
  { label: 'This Month', value: 'this-month' },
  { label: 'Next Month', value: 'next-month' },
  { label: 'Next 3 Months', value: 'next-3-months' },
  { label: 'Next 6 Months', value: 'next-6-months' },
  { label: 'Anytime', value: 'anytime' },
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

const travellerTypes = ['Solo', 'Couple', 'Group']

const regionOptions = [
  { label: 'Any Region', value: 'Any' },
  { label: 'Southeast Asia', value: 'Southeast Asia' },
  { label: 'East Asia', value: 'East Asia' },
  { label: 'Europe', value: 'Europe' },
  { label: 'Middle East', value: 'Middle East' },
  { label: 'Americas', value: 'Americas' },
]

export default function MysteryPage() {
  const getTwoWeeksFromNow = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const currency = useCurrency()
  const mystery = useMystery()

  // Form state
  const [budget, setBudget] = useState('')
  const [origin, setOrigin] = useState('')
  const [originInputText, setOriginInputText] = useState('')
  const [departDate, setDepartDate] = useState(getTwoWeeksFromNow())
  const [flexibleDates, setFlexibleDates] = useState(false)
  const [dateMode, setDateMode] = useState<'specific' | 'flexible'>('specific')
  const [timeframe, setTimeframe] = useState('next-3-months')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [travellerType, setTravellerType] = useState('Solo')
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  // Multi-city state
  const [numCities, setNumCities] = useState(1)
  const [region, setRegion] = useState('Any')
  const [multiCityResult, setMultiCityResult] = useState<TripResult | null>(null)
  const [multiCitySearching, setMultiCitySearching] = useState(false)
  const multiCityAbortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Trip history & compare
  const [tripHistoryOpen, setTripHistoryOpen] = useState(false)
  const [compareTrips, setCompareTrips] = useState<SavedTrip[] | null>(null)

  // "I know my destination" mode
  const [knowDestination, setKnowDestination] = useState(false)
  const [chosenDestination, setChosenDestination] = useState('')

  // Package builder state
  const [tripDuration, setTripDuration] = useState(3)
  const [packageComponents, setPackageComponents] = useState({
    includeFlight: true,
    includeHotel: true,
    includeItinerary: true,
    includeTransportation: false,
  })
  const [emailForUpdates, setEmailForUpdates] = useState('')
  const [accommodationLevel, setAccommodationLevel] = useState('mid-range')
  const [budgetPriority, setBudgetPriority] = useState('balanced')
  const [showAdvancedBudget, setShowAdvancedBudget] = useState(false)
  const [customSplit, setCustomSplit] = useState({ flights: 35, hotels: 35, activities: 30 })

  // More Options section toggle
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)

  // Whether a single-city mystery search is active (from context)
  const isSingleCitySearching = mystery.isVisible && numCities === 1

  // Overall "searching" indicator for the form
  const isSearching = isSingleCitySearching || multiCitySearching

  // Adjust trip duration when numCities changes
  useEffect(() => {
    if (numCities === 1) {
      setTripDuration(prev => Math.min(prev, 14))
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

  const handleVibeToggle = (vibe: string) => {
    if (error) setError('')
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe))
    } else {
      setSelectedVibes([...selectedVibes, vibe])
    }
  }

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
    console.log('[Mystery] Form submitted - starting validation...')
    setError('')

    // Auto-resolve origin if user typed text but didn't select from dropdown
    let resolvedOrigin = origin
    if (!origin && originInputText.trim()) {
      console.log('[Mystery] Attempting to auto-resolve origin from text:', originInputText)
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

    // Validate required fields
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

    if (selectedVibes.length === 0) {
      setError('Please select at least one vibe!')
      return
    }

    if (dateMode === 'specific') {
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

    console.log('[Mystery] All validations passed!')

    // --- Multi-city mystery flow (stays in-page) ---
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
            totalDays: tripDuration,
            numCities,
            region: region !== 'Any' ? region : undefined,
            vibe: selectedVibes.length > 0 ? selectedVibes : undefined,
            departureDate: dateMode === 'specific' ? departDate : undefined,
            departureTimeframe: dateMode === 'flexible' ? timeframe : undefined,
            accommodationLevel,
            budgetPriority,
            customSplit: showAdvancedBudget ? customSplit : undefined,
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
    const requestDates = dateMode === 'specific'
      ? `${departDate}${flexibleDates ? ' (flexible \u00B13 days)' : ''}`
      : `flexible:${timeframe}`

    if (knowDestination && chosenDestination) {
      // User knows their destination -- use plan-my-trip API via mystery context
      mystery.startSearch({
        origin: resolvedOrigin,
        budget: currency.toUSD(parseFloat(budget)),
        vibes: selectedVibes,
        dates: requestDates,
        tripDuration,
        packageComponents,
        email: emailForUpdates || undefined,
        accommodationLevel,
        budgetPriority,
        customSplit: showAdvancedBudget ? customSplit : undefined,
        destination: chosenDestination, // pre-selected destination
      })
    } else {
      // Mystery mode -- AI picks the destination
      mystery.startSearch({
        origin: resolvedOrigin,
        budget: currency.toUSD(parseFloat(budget)),
        vibes: selectedVibes,
        dates: requestDates,
        tripDuration,
        packageComponents,
        email: emailForUpdates || undefined,
        accommodationLevel,
        budgetPriority,
        customSplit: showAdvancedBudget ? customSplit : undefined,
      })
    }
  }

  const handleReset = () => {
    handleCancel()
  }

  // Multi-city results visible
  const hasMultiCityResults = numCities > 1 && multiCityResult && !multiCitySearching

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Trip Planner
          </h1>
          <p className="text-xl text-skyblue-light">
            Set your budget and vibe. AI does the rest.
          </p>
          <div className="mt-4">
            <SocialProof />
          </div>
        </div>

        {/* Form -- always visible, greyed out while searching */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className={`bg-white rounded-2xl shadow-2xl p-6 md:p-8 transition-opacity ${isSearching ? 'opacity-60' : ''}`}>
            <fieldset disabled={isSearching}>

              {/* ===== SECTION 1: ESSENTIALS ===== */}

              {/* Row 1: Flying from */}
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

              {/* Row 2: Destination (single-city only) */}
              {numCities <= 1 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-600">
                      Destination
                    </label>
                    <button
                      type="button"
                      onClick={() => setKnowDestination(!knowDestination)}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition"
                    >
                      <span>{knowDestination ? 'I know where I\'m going' : 'Surprise me'}</span>
                      <div className={`relative w-9 h-5 rounded-full transition-colors ${
                        knowDestination ? 'bg-skyblue' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                          knowDestination ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </div>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-center">
                      <p className="text-blue-600 text-sm">AI picks your perfect destination</p>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Budget + Trip length (side by side on desktop) */}
              <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Budget */}
                <div>
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
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:border-skyblue focus:ring-1 focus:ring-skyblue focus:outline-none transition text-navy"
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
                </div>

                {/* Trip length */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Trip length
                  </label>
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-navy font-semibold text-lg tabular-nums">
                        {tripDuration} day{tripDuration !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={numCities === 1 ? 2 : Math.max(5, numCities * 2)}
                      max={numCities === 1 ? 21 : 60}
                      value={tripDuration}
                      onChange={(e) => setTripDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>{numCities === 1 ? 2 : Math.max(5, numCities * 2)} days</span>
                      <span>{numCities === 1 ? 21 : 60} days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Vibes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Vibes
                </label>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => handleVibeToggle(vibe.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedVibes.includes(vibe.value)
                          ? 'bg-skyblue text-navy shadow-sm ring-1 ring-skyblue/50'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {vibe.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== SECTION 2: MORE OPTIONS (collapsible) ===== */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
                >
                  <span className={`transition-transform inline-block ${moreOptionsOpen ? 'rotate-90' : ''}`}>&#x25B8;</span>
                  More options
                </button>

                {moreOptionsOpen && (
                  <div className="mt-4 space-y-5 pt-4 border-t border-gray-100">

                    {/* When to go */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        When to go
                      </label>
                      <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-3">
                        <button
                          type="button"
                          onClick={() => setDateMode('specific')}
                          className={`flex-1 py-2 text-sm font-medium transition-all ${
                            dateMode === 'specific'
                              ? 'bg-skyblue text-navy'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Specific Date
                        </button>
                        <button
                          type="button"
                          onClick={() => setDateMode('flexible')}
                          className={`flex-1 py-2 text-sm font-medium transition-all ${
                            dateMode === 'flexible'
                              ? 'bg-skyblue text-navy'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Flexible Timeframe
                        </button>
                      </div>

                      {dateMode === 'specific' && (
                        <>
                          <input
                            type="date"
                            id="departDate"
                            value={departDate}
                            onChange={(e) => setDepartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-skyblue focus:ring-1 focus:ring-skyblue focus:outline-none transition text-navy"
                            required
                          />
                          <label className="flex items-center mt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={flexibleDates}
                              onChange={(e) => setFlexibleDates(e.target.checked)}
                              className="w-4 h-4 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              My dates are flexible (&plusmn;3 days)
                            </span>
                          </label>
                        </>
                      )}

                      {dateMode === 'flexible' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {timeframeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTimeframe(option.value)}
                              className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                                timeframe === option.value
                                  ? 'bg-skyblue text-navy ring-1 ring-skyblue/50'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Accommodation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        Accommodation
                      </label>
                      <div className="flex gap-2">
                        {accommodationLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setAccommodationLevel(level.value)}
                            className={`flex-1 py-2 px-1 rounded-lg font-medium transition-all text-center text-xs ${
                              accommodationLevel === level.value
                                ? 'bg-skyblue text-navy ring-1 ring-skyblue/50'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-semibold">{level.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{level.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        Budget priority
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {budgetPriorities.map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            onClick={() => {
                              setBudgetPriority(priority.value)
                              setCustomSplit(priority.split)
                              setShowAdvancedBudget(false)
                            }}
                            className={`py-2 px-3 rounded-lg font-medium transition-all text-left text-sm ${
                              budgetPriority === priority.value
                                ? 'bg-skyblue text-navy ring-1 ring-skyblue/50'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-semibold text-xs">{priority.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{priority.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* Advanced Budget Split Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAdvancedBudget(!showAdvancedBudget)}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                      >
                        <span className={`transition-transform inline-block ${showAdvancedBudget ? 'rotate-90' : ''}`}>&#x25B8;</span>
                        {showAdvancedBudget ? 'Hide custom split' : 'Customize exact split'}
                      </button>

                      {/* Collapsible Advanced Sliders */}
                      {showAdvancedBudget && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                          {budget && Number(budget) > 0 && (
                            <p className="text-xs text-gray-500 mb-2">
                              After 8% buffer (${Math.floor(Number(budget) * 0.08)}), allocating ${Math.floor(Number(budget) * 0.92)}:
                            </p>
                          )}
                          {[
                            { key: 'flights' as const, label: 'Flights' },
                            { key: 'hotels' as const, label: 'Hotels' },
                            { key: 'activities' as const, label: 'Food & Activities' },
                          ].map(({ key, label }) => {
                            const pct = customSplit[key]
                            const amount = budget ? Math.floor(Number(budget) * 0.92 * (pct / 100)) : 0
                            return (
                              <div key={key}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">
                                    {label}
                                  </span>
                                  <span className="text-sm text-gray-600 font-semibold tabular-nums">
                                    {pct}%{amount > 0 ? ` ($${amount})` : ''}
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
                                  }}
                                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-skyblue bg-gray-200"
                                />
                              </div>
                            )
                          })}
                          <div className="flex gap-2 pt-1">
                            {budgetPriorities.map(p => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => {
                                  setCustomSplit(p.split)
                                  setBudgetPriority(p.value)
                                }}
                                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition"
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Multi-city: How many destinations (only show if not already 1, or allow changing) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        How many destinations
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setNumCities(n)}
                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                              numCities === n
                                ? 'bg-skyblue text-navy ring-1 ring-skyblue/50'
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
                    </div>

                    {/* Region -- multi-city only */}
                    {numCities > 1 && (
                      <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-600 mb-1.5">
                          Region preference
                        </label>
                        <select
                          id="region"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-skyblue focus:ring-1 focus:ring-skyblue focus:outline-none transition text-navy bg-white text-sm"
                        >
                          {regionOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Traveller Type -- single city only */}
                    {numCities === 1 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">
                          Travelling as
                        </label>
                        <div className="flex gap-2">
                          {travellerTypes.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setTravellerType(type)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                travellerType === type
                                  ? 'bg-skyblue text-navy ring-1 ring-skyblue/50'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Package Components -- single city only */}
                    {numCities === 1 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">
                          Include in your plan
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={packageComponents.includeFlight}
                              onChange={(e) => setPackageComponents({...packageComponents, includeFlight: e.target.checked})}
                              className="w-4 h-4 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition">
                              Flight (TravelPayouts affiliate link)
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={packageComponents.includeHotel}
                              onChange={(e) => setPackageComponents({...packageComponents, includeHotel: e.target.checked})}
                              className="w-4 h-4 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition">
                              Hotel recommendations with prices
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={packageComponents.includeItinerary}
                              onChange={(e) => setPackageComponents({...packageComponents, includeItinerary: e.target.checked})}
                              className="w-4 h-4 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition">
                              Daily itinerary with activities
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={packageComponents.includeTransportation}
                              onChange={(e) => setPackageComponents({...packageComponents, includeTransportation: e.target.checked})}
                              className="w-4 h-4 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition">
                              Local transportation tips
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Email Capture -- single city only */}
                    {numCities === 1 && (
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={emailForUpdates}
                          onChange={(e) => setEmailForUpdates(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-skyblue focus:ring-1 focus:ring-skyblue focus:outline-none transition text-navy text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Get your trip details and travel tips via email
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                className="w-full bg-gradient-to-r from-skyblue to-skyblue-dark hover:from-skyblue-dark hover:to-skyblue text-navy font-bold text-lg py-4 px-6 rounded-lg transition shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {numCities === 1 ? (
                  knowDestination
                    ? 'Plan My Trip'
                    : 'Find My Mystery Destination'
                ) : (
                  'Plan My Mystery Route'
                )}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled
                  className="flex-1 bg-gradient-to-r from-skyblue/50 to-skyblue-dark/50 text-navy/60 font-bold text-lg py-4 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <div className="inline-block w-5 h-5 border-2 border-navy/40 border-t-transparent rounded-full animate-spin"></div>
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

          {/* Active search indicator for single-city (popup is handling it) */}
          {isSingleCitySearching && (
            <div className="mt-6 text-center">
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
            </div>
          )}

          {/* Info */}
          <div className="mt-8 text-center">
            <p className="text-skyblue-light text-sm">
              Our AI will find you a unique destination that matches your preferences and budget
            </p>
          </div>
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
