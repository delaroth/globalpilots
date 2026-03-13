'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import MysteryLoading from '@/components/MysteryLoading'
import MysteryReveal from '@/components/MysteryReveal'
import { searchAirports, majorAirports } from '@/lib/geolocation'

const vibeOptions = [
  { emoji: '🏖', label: 'Beach', value: 'beach' },
  { emoji: '🏙', label: 'City Break', value: 'city' },
  { emoji: '🏔', label: 'Adventure', value: 'adventure' },
  { emoji: '🍜', label: 'Food & Culture', value: 'food' },
  { emoji: '🌿', label: 'Nature', value: 'nature' },
]

const timeframeOptions = [
  { label: 'This Month', value: 'this-month' },
  { label: 'Next Month', value: 'next-month' },
  { label: 'Next 3 Months', value: 'next-3-months' },
  { label: 'Next 6 Months', value: 'next-6-months' },
  { label: 'Anytime', value: 'anytime' },
]

const accommodationLevels = [
  { label: 'Hostel', value: 'hostel', icon: '🏕️', desc: '$10-30/night', maxPerNight: 30 },
  { label: 'Budget', value: 'budget', icon: '🏠', desc: '$30-60/night', maxPerNight: 60 },
  { label: 'Mid-Range', value: 'mid-range', icon: '🏨', desc: '$60-120/night', maxPerNight: 120 },
  { label: 'Upscale', value: 'upscale', icon: '🏩', desc: '$120-250/night', maxPerNight: 250 },
  { label: 'Luxury', value: 'luxury', icon: '✨', desc: '$250+/night', maxPerNight: 500 },
]

const budgetPriorities = [
  { label: 'Fly Further', value: 'flights', desc: 'Explore distant destinations', split: { flights: 50, hotels: 25, activities: 25 } },
  { label: 'Balanced', value: 'balanced', desc: 'Even split across everything', split: { flights: 35, hotels: 35, activities: 30 } },
  { label: 'Better Stays', value: 'hotels', desc: 'Nicer accommodation', split: { flights: 20, hotels: 50, activities: 30 } },
  { label: 'More Experiences', value: 'activities', desc: 'Tours, food, nightlife', split: { flights: 25, hotels: 25, activities: 50 } },
]

const travellerTypes = ['Solo', 'Couple', 'Group']

const quickThemes = [
  { emoji: '🏖️', label: 'Beach Escape', vibes: ['beach'], budgetMin: '500', budgetMax: '800', color: 'from-cyan-400 to-blue-400' },
  { emoji: '🏙️', label: 'City Culture', vibes: ['city', 'food'], budgetMin: '600', budgetMax: '1000', color: 'from-purple-400 to-pink-400' },
  { emoji: '🏔️', label: 'Adventure Trip', vibes: ['adventure', 'nature'], budgetMin: '400', budgetMax: '700', color: 'from-green-400 to-emerald-500' },
  { emoji: '🍜', label: 'Foodie Tour', vibes: ['food'], budgetMin: '500', budgetMax: '900', color: 'from-orange-400 to-red-400' },
  { emoji: '🎒', label: 'Budget Backpacker', vibes: [], budgetMin: '300', budgetMax: '500', color: 'from-yellow-400 to-amber-500' },
]

const MAX_REROLLS = 3

export default function MysteryPage() {
  // Default date to 2 weeks from now
  const getTwoWeeksFromNow = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const [step, setStep] = useState<'form' | 'loading' | 'reveal'>('form')
  const [budget, setBudget] = useState('')
  const [origin, setOrigin] = useState('')
  const [originInputText, setOriginInputText] = useState('') // Track raw input text
  const [departDate, setDepartDate] = useState(getTwoWeeksFromNow())
  const [flexibleDates, setFlexibleDates] = useState(false)
  const [dateMode, setDateMode] = useState<'specific' | 'flexible'>('specific')
  const [timeframe, setTimeframe] = useState('next-3-months')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [travellerType, setTravellerType] = useState('Solo')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [destination, setDestination] = useState<any>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false) // Track button state
  const errorRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)

  // Re-roll state
  const [excludeList, setExcludeList] = useState<string[]>([])
  const excludeListRef = useRef<string[]>([])
  const [rerollCount, setRerollCount] = useState(0)
  const [activeTheme, setActiveTheme] = useState<string | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    excludeListRef.current = excludeList
  }, [excludeList])

  // NEW: Package builder state
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

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Auto-scroll to reveal section when result arrives
  useEffect(() => {
    if (step === 'reveal' && destination && revealRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        revealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [step, destination])

  const handleVibeToggle = (vibe: string) => {
    if (error) setError('') // Clear error when user interacts
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe))
    } else {
      setSelectedVibes([...selectedVibes, vibe])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Mystery] Form submitted - starting validation...')
    setError('')
    setIsSubmitting(true) // Show loading state immediately

    // Auto-resolve origin if user typed text but didn't select from dropdown
    let resolvedOrigin = origin
    if (!origin && originInputText.trim()) {
      console.log('[Mystery] Attempting to auto-resolve origin from text:', originInputText)

      // Try to find exact city name match
      const normalizedInput = originInputText.trim()
      const matches = searchAirports(normalizedInput)

      if (matches.length > 0) {
        // Check for exact city name match (case-insensitive)
        const exactMatch = matches.find(a =>
          a.city.toLowerCase() === normalizedInput.toLowerCase()
        )

        if (exactMatch) {
          resolvedOrigin = exactMatch.code
          console.log('[Mystery] ✅ Auto-resolved "' + originInputText + '" to ' + resolvedOrigin)
        } else if (matches.length === 1) {
          // Only one match, use it
          resolvedOrigin = matches[0].code
          console.log('[Mystery] ✅ Auto-resolved "' + originInputText + '" to ' + resolvedOrigin + ' (single match)')
        }
      }
    }

    // Validate required fields
    if (!resolvedOrigin) {
      const errorMsg = originInputText.trim()
        ? 'Please select a city from the dropdown suggestions. Multiple cities match your search - click one to confirm.'
        : 'Please select your departure city!'
      console.error('[Mystery] Validation failed:', errorMsg)
      setError(errorMsg)
      setIsSubmitting(false)
      return
    }

    if (!budget || parseFloat(budget) <= 0) {
      const errorMsg = 'Please enter a budget greater than $0!'
      console.error('[Mystery] Validation failed:', errorMsg)
      setError(errorMsg)
      setIsSubmitting(false)
      return
    }

    if (parseFloat(budget) < 100) {
      const errorMsg = 'Please enter a budget of at least $100 for a realistic trip!'
      console.error('[Mystery] Validation failed:', errorMsg)
      setError(errorMsg)
      setIsSubmitting(false)
      return
    }

    if (selectedVibes.length === 0) {
      const errorMsg = 'Please select at least one vibe!'
      console.error('[Mystery] Validation failed:', errorMsg)
      setError(errorMsg)
      setIsSubmitting(false)
      return
    }

    if (dateMode === 'specific') {
      if (!departDate) {
        const errorMsg = 'Please select a departure date!'
        console.error('[Mystery] Validation failed:', errorMsg)
        setError(errorMsg)
        setIsSubmitting(false)
        return
      }

      // Validate date is not in the past
      const selectedDate = new Date(departDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        const errorMsg = 'Please select a future date! Time travel tickets are unfortunately not available yet. 🕰️'
        console.error('[Mystery] Validation failed:', errorMsg)
        setError(errorMsg)
        setIsSubmitting(false)
        return
      }
    }

    console.log('[Mystery] ✅ All validations passed! Starting search with:', { origin: resolvedOrigin, budget, vibes: selectedVibes, departDate })
    setStep('loading')

    try {
      console.log('[Mystery] 🚀 Making API call to /api/ai-mystery...')
      const response = await fetch('/api/ai-mystery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: resolvedOrigin, // Use resolved origin
          budget: parseFloat(budget),
          vibes: selectedVibes,
          dates: dateMode === 'specific'
            ? `${departDate}${flexibleDates ? ' (flexible ±3 days)' : ''}`
            : `flexible:${timeframe}`,
          tripDuration,
          packageComponents,
          email: emailForUpdates || undefined,
          exclude: excludeListRef.current.length > 0 ? excludeListRef.current : undefined,
          accommodationLevel,
          budgetPriority,
        }),
      })

      console.log('[Mystery] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        const errorMsg = errorData.error || `Failed to generate destination (HTTP ${response.status})`
        console.error('[Mystery] API error response:', errorData)
        throw new Error(errorMsg)
      }

      const data = await response.json()
      console.log('[Mystery] ✅ API success! Received destination:', data.destination)

      if (data.error) {
        console.error('[Mystery] API returned error in data:', data.error)
        throw new Error(data.error)
      }

      if (!data.destination || !data.city_code_IATA) {
        console.error('[Mystery] API returned invalid data structure:', data)
        throw new Error('Invalid response from server. Please try again.')
      }

      setDestination(data)
      setStep('reveal')
      setIsSubmitting(false) // Reset on success
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      console.error('[Mystery] ❌ Error during mystery destination generation:', err)
      setError(errorMsg)
      setStep('form')
      setIsSubmitting(false) // Reset on error
    }
  }

  const handleShowAnother = () => {
    // Reset re-roll state for a fresh "Show Another"
    setExcludeList([])
    excludeListRef.current = []
    setRerollCount(0)
    setStep('loading')
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleReroll = () => {
    if (rerollCount >= MAX_REROLLS) return

    // Add the current destination's IATA to the exclude list
    const currentIATA = destination?.city_code_IATA || destination?.iata
    if (currentIATA) {
      const updated = [...excludeList, currentIATA]
      setExcludeList(updated)
      excludeListRef.current = updated // Update ref synchronously for immediate use
    }
    setRerollCount(prev => prev + 1)
    setDestination(null)
    setStep('loading')
    // Directly trigger API call since ref is already updated
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }, 50)
  }

  const handleReset = () => {
    setStep('form')
    setDestination(null)
    setError('')
    setExcludeList([])
    excludeListRef.current = []
    setRerollCount(0)
    setActiveTheme(null)
  }

  const handleThemeSelect = (theme: typeof quickThemes[number]) => {
    // Pre-fill vibes (or keep all if empty = "any vibe")
    if (theme.vibes.length > 0) {
      setSelectedVibes(theme.vibes)
    }
    // Pre-fill budget as the midpoint of the range
    const midBudget = Math.round((parseInt(theme.budgetMin) + parseInt(theme.budgetMax)) / 2)
    setBudget(String(midBudget))
    setActiveTheme(theme.label)
    setError('')
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
            Mystery Vacation ✨
          </h1>
          <p className="text-xl text-skyblue-light">
            Let AI surprise you with the perfect destination
          </p>
        </div>

        {/* Step 1: Form */}
        {step === 'form' && (
          <div className="max-w-3xl mx-auto">
            {/* Quick Picks / Theme Buttons */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white text-center mb-4">Quick Picks</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {quickThemes.map((theme) => (
                  <button
                    key={theme.label}
                    type="button"
                    onClick={() => handleThemeSelect(theme)}
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

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              {/* Budget */}
              <div className="mb-6">
                <label htmlFor="budget" className="block text-lg font-semibold text-navy mb-2">
                  What's your budget? 💰
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                    $
                  </span>
                  <input
                    type="number"
                    id="budget"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value)
                      if (error) setError('') // Clear error when user types
                    }}
                    placeholder="1500"
                    min="100"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy text-lg"
                    required
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Total budget for flights + accommodation + activities
                </p>
              </div>

              {/* Accommodation Level */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  What kind of stays? 🛏️
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
                  Where should we focus your budget? 🎯
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {budgetPriorities.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setBudgetPriority(priority.value)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all text-left ${
                        budgetPriority === priority.value
                          ? 'bg-skyblue text-navy shadow-lg ring-2 ring-skyblue/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{priority.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{priority.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure City */}
              <div className="mb-6">
                <label htmlFor="origin" className="block text-lg font-semibold text-navy mb-2">
                  Where are you flying from? ✈️
                </label>
                <AirportAutocomplete
                  id="origin"
                  label=""
                  value={origin}
                  onChange={setOrigin}
                  onSearchChange={setOriginInputText} // Track raw text input
                  placeholder="Search your departure city..."
                />
              </div>

              {/* Travel Dates */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-2">
                  When do you want to go? 📅
                </label>
                {/* Date Mode Toggle */}
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

                {/* Specific Date Mode */}
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
                        My dates are flexible (±3 days)
                      </span>
                    </label>
                  </>
                )}

                {/* Flexible Timeframe Mode */}
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
                  What's your vibe? 🎭 (Select all that apply)
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

              {/* Traveller Type */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  Travelling as... 👥
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

              {/* Trip Duration */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-2">
                  Trip Duration: {tripDuration} day{tripDuration !== 1 ? 's' : ''} 🗓️
                </label>
                <input
                  type="range"
                  min="3"
                  max="14"
                  value={tripDuration}
                  onChange={(e) => setTripDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>3 days</span>
                  <span>14 days</span>
                </div>
              </div>

              {/* Package Components */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-navy mb-3">
                  What should we include? 📦
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
                      ✈️ Flight (TravelPayouts affiliate link)
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
                      🏨 Hotel recommendations with prices
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
                      📍 Daily itinerary with activities
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
                      🚌 Local transportation tips
                    </span>
                  </label>
                </div>
              </div>

              {/* Email Capture */}
              <div className="mb-8">
                <label htmlFor="email" className="block text-lg font-semibold text-navy mb-2">
                  Email (optional) 📧
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

              {/* Error Message - Always visible when present */}
              {error && (
                <div
                  ref={errorRef}
                  className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4 shadow-lg animate-shake"
                >
                  <p className="text-red-700 font-semibold text-center text-lg">❌ {error}</p>
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-skyblue to-skyblue-dark hover:from-skyblue-dark hover:to-skyblue text-navy font-bold text-xl py-5 px-6 rounded-lg transition shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-block w-6 h-6 border-3 border-navy border-t-transparent rounded-full animate-spin"></div>
                    <span>Finding your perfect destination...</span>
                  </>
                ) : (
                  <>✨ Surprise Me! ✨</>
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-8 text-center">
              <p className="text-skyblue-light">
                Our AI will find you a unique destination that matches your preferences and budget
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Loading */}
        {step === 'loading' && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-navy-dark/95 backdrop-blur-sm">
            <div className="max-w-3xl w-full mx-4">
              <div className="bg-navy-light/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-skyblue/40 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="text-7xl mb-6 animate-spin-slow inline-block">🌍</div>
                  <h2 className="text-3xl font-bold text-white mb-3">
                    Our AI is finding your perfect destination...
                  </h2>
                  <p className="text-skyblue-light text-lg">
                    Searching flights, hotels, and creating your custom itinerary
                  </p>
                </div>
                <MysteryLoading />
              </div>
            </div>
            <style jsx>{`
              @keyframes spin-slow {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
              .animate-spin-slow {
                animation: spin-slow 3s linear infinite;
              }
            `}</style>
          </div>
        )}

        {/* Step 3: Reveal */}
        {step === 'reveal' && destination && destination.destination && destination.city_code_IATA && (
          <div ref={revealRef}>
            <MysteryReveal
              destination={destination}
              origin={origin}
              departDate={departDate}
              onShowAnother={handleShowAnother}
              onReroll={handleReroll}
              rerollCount={rerollCount}
              maxRerolls={MAX_REROLLS}
            />
            <div className="text-center mt-6">
              <button
                onClick={handleReset}
                className="text-skyblue-light hover:text-skyblue transition underline"
              >
                ← Start Over
              </button>
            </div>
          </div>
        )}

        {/* Error State: If step is reveal but destination is invalid */}
        {step === 'reveal' && (!destination || !destination.destination || !destination.city_code_IATA) && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-8 shadow-2xl text-center">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-red-700 mb-4">Oops! Something went wrong</h2>
              <p className="text-red-600 mb-6">
                We couldn't generate a valid destination. This might be a temporary issue.
              </p>
              <button
                onClick={handleReset}
                className="bg-skyblue hover:bg-skyblue-dark text-navy font-bold py-3 px-8 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
