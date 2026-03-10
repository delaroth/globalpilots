'use client'

import { useState } from 'react'
import Link from 'next/link'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import MysteryLoading from '@/components/MysteryLoading'
import MysteryReveal from '@/components/MysteryReveal'

const vibeOptions = [
  { emoji: '🏖', label: 'Beach', value: 'beach' },
  { emoji: '🏙', label: 'City Break', value: 'city' },
  { emoji: '🏔', label: 'Adventure', value: 'adventure' },
  { emoji: '🍜', label: 'Food & Culture', value: 'food' },
  { emoji: '🌿', label: 'Nature', value: 'nature' },
]

const travellerTypes = ['Solo', 'Couple', 'Group']

export default function MysteryPage() {
  // Default date to next week
  const getNextWeekDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const [step, setStep] = useState<'form' | 'loading' | 'reveal'>('form')
  const [budget, setBudget] = useState('')
  const [origin, setOrigin] = useState('')
  const [departDate, setDepartDate] = useState(getNextWeekDate())
  const [flexibleDates, setFlexibleDates] = useState(false)
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [travellerType, setTravellerType] = useState('Solo')
  const [destination, setDestination] = useState(null)
  const [error, setError] = useState('')

  const handleVibeToggle = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe))
    } else {
      setSelectedVibes([...selectedVibes, vibe])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!origin) {
      setError('Please select your departure city!')
      return
    }

    if (!budget || parseFloat(budget) < 100) {
      setError('Please enter a budget of at least $100!')
      return
    }

    if (selectedVibes.length === 0) {
      setError('Please select at least one vibe!')
      return
    }

    if (!departDate) {
      setError('Please select a departure date!')
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(departDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      setError('Please select a future date! Time travel tickets are unfortunately not available yet. 🕰️')
      return
    }

    console.log('[Mystery] Starting search with:', { origin, budget, vibes: selectedVibes, departDate })
    setStep('loading')

    try {
      const response = await fetch('/api/ai-mystery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          budget: parseFloat(budget),
          vibes: selectedVibes,
          dates: `${departDate}${flexibleDates ? ' (flexible ±3 days)' : ''}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate destination')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setDestination(data)
      setStep('reveal')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
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
                    onChange={(e) => setBudget(e.target.value)}
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
              <div className="mb-8">
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

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">❌ {error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-skyblue to-skyblue-dark hover:from-skyblue-dark hover:to-skyblue text-navy font-bold text-xl py-5 px-6 rounded-lg transition shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                ✨ Surprise Me! ✨
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
        {step === 'reveal' && destination && (
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
      </div>
    </div>
  )
}
