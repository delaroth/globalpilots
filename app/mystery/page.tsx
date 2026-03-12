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

const travellerTypes = ['Solo', 'Couple', 'Group']

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
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [travellerType, setTravellerType] = useState('Solo')
  const [destination, setDestination] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false) // Track button state
  const errorRef = useRef<HTMLDivElement>(null)

  // NEW: Package builder state
  const [tripDuration, setTripDuration] = useState(3)
  const [packageComponents, setPackageComponents] = useState({
    includeFlight: true,
    includeHotel: true,
    includeItinerary: true,
    includeTransportation: false,
  })
  const [emailForUpdates, setEmailForUpdates] = useState('')

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

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
          dates: `${departDate}${flexibleDates ? ' (flexible ±3 days)' : ''}`,
          tripDuration,
          packageComponents,
          email: emailForUpdates || undefined,
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
    setStep('loading')
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleReset = () => {
    setStep('form')
    setDestination(null)
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
                <label htmlFor="departDate" className="block text-lg font-semibold text-navy mb-2">
                  When do you want to go? 📅
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
                  max="7"
                  value={tripDuration}
                  onChange={(e) => setTripDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>3 days</span>
                  <span>7 days</span>
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
          <div className="max-w-3xl mx-auto">
            <div className="bg-navy-light/50 backdrop-blur-sm rounded-2xl p-12 border border-skyblue/20">
              <MysteryLoading />
            </div>
          </div>
        )}

        {/* Step 3: Reveal */}
        {step === 'reveal' && destination && destination.destination && destination.city_code_IATA && (
          <div>
            <MysteryReveal
              destination={destination}
              origin={origin}
              departDate={departDate}
              onShowAnother={handleShowAnother}
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
