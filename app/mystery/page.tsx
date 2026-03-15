'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
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
  { emoji: '\u{1F3D6}', label: 'Beach', value: 'beach' },
  { emoji: '\u{1F3D9}', label: 'City Break', value: 'city' },
  { emoji: '\u{1F3D4}', label: 'Adventure', value: 'adventure' },
  { emoji: '\u{1F35C}', label: 'Food & Culture', value: 'food' },
  { emoji: '\u{1F33F}', label: 'Nature', value: 'nature' },
]

const timeframeOptions = [
  { label: 'This Month', value: 'this-month' },
  { label: 'Next Month', value: 'next-month' },
  { label: 'Next 3 Months', value: 'next-3-months' },
  { label: 'Next 6 Months', value: 'next-6-months' },
  { label: 'Anytime', value: 'anytime' },
]

const accommodationLevels = [
  { label: 'Hostel', value: 'hostel', icon: '\u{1F3D5}\uFE0F', desc: '$10-30/night', maxPerNight: 30 },
  { label: 'Budget', value: 'budget', icon: '\u{1F3E0}', desc: '$30-60/night', maxPerNight: 60 },
  { label: 'Mid-Range', value: 'mid-range', icon: '\u{1F3E8}', desc: '$60-120/night', maxPerNight: 120 },
  { label: 'Upscale', value: 'upscale', icon: '\u{1F3E9}', desc: '$120-250/night', maxPerNight: 250 },
  { label: 'Luxury', value: 'luxury', icon: '\u2728', desc: '$250+/night', maxPerNight: 500 },
]

const budgetPriorities = [
  { label: 'Fly Further', value: 'flights', desc: 'Explore distant destinations', split: { flights: 50, hotels: 25, activities: 25 } },
  { label: 'Balanced', value: 'balanced', desc: 'Even split across everything', split: { flights: 35, hotels: 35, activities: 30 } },
  { label: 'Better Stays', value: 'hotels', desc: 'Nicer accommodation', split: { flights: 20, hotels: 50, activities: 30 } },
  { label: 'More Experiences', value: 'activities', desc: 'Tours, food, nightlife', split: { flights: 25, hotels: 25, activities: 50 } },
]

const travellerTypes = ['Solo', 'Couple', 'Group']

const quickThemes = [
  { emoji: '\u{1F3D6}\uFE0F', label: 'Beach Escape', vibes: ['beach'], budgetMin: '500', budgetMax: '800', color: 'from-cyan-400 to-blue-400' },
  { emoji: '\u{1F3D9}\uFE0F', label: 'City Culture', vibes: ['city', 'food'], budgetMin: '600', budgetMax: '1000', color: 'from-purple-400 to-pink-400' },
  { emoji: '\u{1F3D4}\uFE0F', label: 'Adventure Trip', vibes: ['adventure', 'nature'], budgetMin: '400', budgetMax: '700', color: 'from-green-400 to-emerald-500' },
  { emoji: '\u{1F35C}', label: 'Foodie Tour', vibes: ['food'], budgetMin: '500', budgetMax: '900', color: 'from-orange-400 to-red-400' },
  { emoji: '\u{1F392}', label: 'Budget Backpacker', vibes: [], budgetMin: '300', budgetMax: '500', color: 'from-yellow-400 to-amber-500' },
]

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

  // Theme state
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [themeNotification, setThemeNotification] = useState<string | null>(null)
  const originSectionRef = useRef<HTMLDivElement>(null)

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
        setError('Please select a future date! Time travel tickets are unfortunately not available yet. \u{1F570}\uFE0F')
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

    // --- Single-city mystery flow: delegate to global MysteryContext ---
    const requestDates = dateMode === 'specific'
      ? `${departDate}${flexibleDates ? ' (flexible \u00B13 days)' : ''}`
      : `flexible:${timeframe}`

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

  const handleReset = () => {
    handleCancel()
    setActiveTheme(null)
    setThemeNotification(null)
  }

  const handleThemeSelect = (theme: typeof quickThemes[number]) => {
    if (theme.vibes.length > 0) {
      setSelectedVibes(theme.vibes)
    }
    setBudget(theme.budgetMax)

    const maxBudget = parseInt(theme.budgetMax)
    if (maxBudget < 500) {
      setAccommodationLevel('budget')
    } else if (maxBudget <= 800) {
      setAccommodationLevel('mid-range')
    } else {
      setAccommodationLevel('upscale')
    }

    const durationMap: Record<string, number> = {
      'Beach Escape': 5,
      'City Culture': 4,
      'Adventure Trip': 7,
      'Foodie Tour': 4,
      'Budget Backpacker': 7,
    }
    setTripDuration(durationMap[theme.label] || 5)

    const priorityMap: Record<string, string> = {
      'Beach Escape': 'hotels',
      'City Culture': 'balanced',
      'Adventure Trip': 'flights',
      'Foodie Tour': 'activities',
      'Budget Backpacker': 'balanced',
    }
    setBudgetPriority(priorityMap[theme.label] || 'balanced')

    setActiveTheme(theme.label)
    setError('')
    setThemeNotification(`Form pre-filled from ${theme.label} theme`)

    setTimeout(() => {
      originSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Multi-city results visible
  const hasMultiCityResults = numCities > 1 && multiCityResult && !multiCitySearching

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTripHistoryOpen(true)}
              className="text-white/60 hover:text-white transition text-sm font-medium"
            >
              My Trips
            </button>
            <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Mystery Vacation &#x2728;
          </h1>
          <p className="text-xl text-skyblue-light">
            Let AI surprise you with the perfect destination
          </p>
          <div className="mt-4">
            <SocialProof />
          </div>
        </div>

        {/* Form -- always visible, greyed out while searching */}
        <div className="max-w-3xl mx-auto">
          {/* Quick Picks / Theme Buttons */}
          <div className={`mb-6 ${isSearching ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-semibold text-white text-center mb-4">Quick Picks</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {quickThemes.map((theme) => (
                <button
                  key={theme.label}
                  type="button"
                  onClick={() => handleThemeSelect(theme)}
                  disabled={isSearching}
                  className={`bg-gradient-to-r ${theme.color} text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 hover:shadow-xl active:scale-95 text-sm ${
                    activeTheme === theme.label ? 'ring-4 ring-white/60 scale-105' : ''
                  }`}
                >
                  {theme.emoji} {theme.label}
                  <span className="block text-xs font-normal opacity-80">
                    ${theme.budgetMin}-${theme.budgetMax}
                  </span>
                </button>
              ))}
            </div>
            {activeTheme && (
              <p className="text-center text-skyblue-light text-sm mt-3">
                {activeTheme} selected! Pick your city and dates below, then hit Surprise Me.
              </p>
            )}
          </div>

          {/* Theme auto-fill notification */}
          {themeNotification && (
            <div className="mb-4 bg-skyblue/10 border border-skyblue/30 rounded-lg px-4 py-3 flex items-center justify-between animate-fade-in">
              <p className="text-skyblue-light text-sm font-medium">
                {themeNotification}
              </p>
              <button
                type="button"
                onClick={() => setThemeNotification(null)}
                className="text-skyblue-light/70 hover:text-white ml-4 text-lg leading-none"
                aria-label="Dismiss notification"
              >
                &#x2715;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`bg-white rounded-2xl shadow-2xl p-6 md:p-8 transition-opacity ${isSearching ? 'opacity-60' : ''}`}>
            <fieldset disabled={isSearching}>
              {/* Number of Destinations */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  How many destinations? &#x1F5FA;&#xFE0F;
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumCities(n)}
                      className={`py-3 rounded-lg font-bold text-lg transition-all ${
                        numCities === n
                          ? 'bg-skyblue text-navy shadow-lg ring-2 ring-skyblue/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {numCities === 1
                    ? 'AI will surprise you with one perfect destination'
                    : `AI will plan a ${numCities}-city mystery route for you`}
                </p>
              </div>

              {/* Budget */}
              <div className="mb-6">
                <label htmlFor="budget" className="block text-lg font-semibold text-navy mb-2">
                  What&apos;s your budget? &#x1F4B0;
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
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
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy text-lg"
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
                <p className="text-sm text-gray-600 mt-1">
                  {numCities === 1
                    ? 'Total budget for flights + accommodation + activities'
                    : `Total budget for all ${numCities} cities \u2014 flights + daily expenses`}
                  {!currency.isUSD && budget && Number(budget) > 0 && currency.rate && (
                    <span className="text-gray-400 ml-1">
                      (\u2248 ${currency.toUSD(Number(budget))} USD)
                    </span>
                  )}
                </p>
              </div>

              {/* Accommodation Level */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  What kind of stays? &#x1F6CF;&#xFE0F;
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {accommodationLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setAccommodationLevel(level.value)}
                      className={`py-3 px-2 rounded-lg font-medium transition-all text-center ${
                        accommodationLevel === level.value
                          ? 'bg-skyblue text-navy shadow-lg ring-2 ring-skyblue/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{level.icon}</div>
                      <div className="text-sm font-semibold">{level.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Priority */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  Where should we focus your budget? &#x1F3AF;
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {budgetPriorities.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => {
                        setBudgetPriority(priority.value)
                        setCustomSplit(priority.split)
                        setShowAdvancedBudget(false)
                      }}
                      className={`py-3 px-4 rounded-lg font-medium transition-all text-left ${
                        budgetPriority === priority.value
                          ? 'bg-skyblue text-navy shadow-lg ring-2 ring-skyblue/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{priority.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {priority.desc}
                        <span className="text-gray-400 ml-1">
                          ({priority.split.flights}/{priority.split.hotels}/{priority.split.activities})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Advanced Budget Split Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedBudget(!showAdvancedBudget)}
                  className="mt-3 text-sm text-skyblue hover:text-skyblue/80 transition flex items-center gap-1"
                >
                  <span className={`transition-transform ${showAdvancedBudget ? 'rotate-90' : ''}`}>&#x25B8;</span>
                  {showAdvancedBudget ? 'Hide custom split' : 'Customize exact split'}
                </button>

                {/* Collapsible Advanced Sliders */}
                {showAdvancedBudget && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    {budget && Number(budget) > 0 && (
                      <p className="text-xs text-gray-500 mb-2">
                        After 8% buffer (${Math.floor(Number(budget) * 0.08)}), allocating ${Math.floor(Number(budget) * 0.92)}:
                      </p>
                    )}
                    {[
                      { key: 'flights' as const, label: 'Flights', emoji: '\u2708\uFE0F' },
                      { key: 'hotels' as const, label: 'Hotels', emoji: '\u{1F3E8}' },
                      { key: 'activities' as const, label: 'Food & Activities', emoji: '\u{1F3AD}' },
                    ].map(({ key, label, emoji }) => {
                      const pct = customSplit[key]
                      const amount = budget ? Math.floor(Number(budget) * 0.92 * (pct / 100)) : 0
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {emoji} {label}
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

              {/* Departure City */}
              <div className="mb-6" ref={originSectionRef}>
                <label htmlFor="origin" className="block text-lg font-semibold text-navy mb-2">
                  Where are you flying from? &#x2708;&#xFE0F;
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

              {/* Travel Dates */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-2">
                  When do you want to go? &#x1F4C5;
                </label>
                <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 mb-4">
                  <button
                    type="button"
                    onClick={() => setDateMode('specific')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
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
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                      required
                    />
                    <label className="flex items-center mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flexibleDates}
                        onChange={(e) => setFlexibleDates(e.target.checked)}
                        className="w-5 h-5 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                      />
                      <span className="ml-2 text-gray-700">
                        My dates are flexible (&plusmn;3 days)
                      </span>
                    </label>
                  </>
                )}

                {dateMode === 'flexible' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeframeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeframe(option.value)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all text-sm ${
                          timeframe === option.value
                            ? 'bg-skyblue text-navy shadow-lg ring-2 ring-skyblue/50'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vibes */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  What&apos;s your vibe? &#x1F3AD; (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-3">
                  {vibeOptions.map((vibe) => (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => handleVibeToggle(vibe.value)}
                      className={`px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
                        selectedVibes.includes(vibe.value)
                          ? 'bg-skyblue text-navy shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {vibe.emoji} {vibe.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region -- multi-city only */}
              {numCities > 1 && (
                <div className="mb-6">
                  <label htmlFor="region" className="block text-lg font-semibold text-navy mb-2">
                    Region preference &#x1F30D;
                  </label>
                  <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy bg-white"
                  >
                    {regionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Traveller Type -- single city only */}
              {numCities === 1 && (
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-navy mb-3">
                    Travelling as... &#x1F465;
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {travellerTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTravellerType(type)}
                        className={`py-3 rounded-lg font-medium transition-all ${
                          travellerType === type
                            ? 'bg-skyblue text-navy shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trip Duration */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-2">
                  Trip Duration: {tripDuration} day{tripDuration !== 1 ? 's' : ''} &#x1F5D3;&#xFE0F;
                </label>
                <input
                  type="range"
                  min={numCities === 1 ? 3 : Math.max(5, numCities * 2)}
                  max={numCities === 1 ? 14 : 60}
                  value={tripDuration}
                  onChange={(e) => setTripDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{numCities === 1 ? 3 : Math.max(5, numCities * 2)} days</span>
                  <span>{numCities === 1 ? 14 : 60} days</span>
                </div>
              </div>

              {/* Package Components -- single city only */}
              {numCities === 1 && (<div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  What should we include? &#x1F4E6;
                </label>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={packageComponents.includeFlight}
                      onChange={(e) => setPackageComponents({...packageComponents, includeFlight: e.target.checked})}
                      className="w-5 h-5 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-navy transition">
                      &#x2708;&#xFE0F; Flight (TravelPayouts affiliate link)
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={packageComponents.includeHotel}
                      onChange={(e) => setPackageComponents({...packageComponents, includeHotel: e.target.checked})}
                      className="w-5 h-5 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-navy transition">
                      &#x1F3E8; Hotel recommendations with prices
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={packageComponents.includeItinerary}
                      onChange={(e) => setPackageComponents({...packageComponents, includeItinerary: e.target.checked})}
                      className="w-5 h-5 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-navy transition">
                      &#x1F4CD; Daily itinerary with activities
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={packageComponents.includeTransportation}
                      onChange={(e) => setPackageComponents({...packageComponents, includeTransportation: e.target.checked})}
                      className="w-5 h-5 text-skyblue border-gray-300 rounded focus:ring-skyblue"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-navy transition">
                      &#x1F68C; Local transportation tips
                    </span>
                  </label>
                </div>
              </div>)}

              {/* Email Capture -- single city only */}
              {numCities === 1 && (
                <div className="mb-8">
                  <label htmlFor="email" className="block text-lg font-semibold text-navy mb-2">
                    Email (optional) &#x1F4E7;
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={emailForUpdates}
                    onChange={(e) => setEmailForUpdates(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Get your trip details and travel tips via email
                  </p>
                </div>
              )}
            </fieldset>

            {/* Error Message */}
            {error && (
              <div
                ref={errorRef}
                className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4 shadow-lg animate-shake"
              >
                <p className="text-red-700 font-semibold text-center text-lg">&#x274C; {error}</p>
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
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.3s ease-out;
              }
            `}</style>

            {/* Submit / Cancel Buttons */}
            {!isSearching ? (
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-skyblue to-skyblue-dark hover:from-skyblue-dark hover:to-skyblue text-navy font-bold text-xl py-5 px-6 rounded-lg transition shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {numCities === 1 ? (
                  <>&#x2728; Find My Destination &#x2728;</>
                ) : (
                  <>&#x1F5FA;&#xFE0F; Plan My Mystery Route</>
                )}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled
                  className="flex-1 bg-gradient-to-r from-skyblue/50 to-skyblue-dark/50 text-navy/60 font-bold text-xl py-5 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <div className="inline-block w-6 h-6 border-3 border-navy/40 border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-5 rounded-lg border-2 border-red-300 text-red-600 font-semibold hover:bg-red-50 transition"
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
            <p className="text-skyblue-light">
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
    </div>
  )
}
