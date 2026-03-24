'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { majorAirports } from '@/lib/geolocation'

export default function NaturalLanguageSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Convert city name or code to IATA code
  const toIataCode = (location: string): string => {
    if (!location) return ''

    const upperLocation = location.toUpperCase()

    // If it's already a 3-letter code, check if it's valid
    if (/^[A-Z]{3}$/.test(upperLocation)) {
      const airport = majorAirports.find(a => a.code === upperLocation)
      if (airport) return upperLocation
    }

    // Otherwise, search by city name
    const airport = majorAirports.find(a =>
      a.city.toUpperCase() === upperLocation ||
      a.city.toUpperCase().includes(upperLocation) ||
      a.code === upperLocation
    )

    return airport ? airport.code : location
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setError("You're searching too fast — please wait a moment")
          return
        }
        setError('Search is temporarily unavailable — please try again')
        return
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Route based on parsed data
      if (data.origin && data.destination) {
        // Has both origin and destination - go to calendar
        const originCode = toIataCode(data.origin)
        const destCode = toIataCode(data.destination)
        console.log('[NL Search] Redirecting to calendar:', { origin: data.origin, originCode, dest: data.destination, destCode })
        router.push(`/calendar?origin=${originCode}&destination=${destCode}`)
      } else if (data.origin) {
        // Has only origin - go to weekend deals
        const originCode = toIataCode(data.origin)
        console.log('[NL Search] Redirecting to weekend:', { origin: data.origin, originCode })
        router.push(`/weekend?origin=${originCode}`)
      } else if (data.destination && !data.origin) {
        // Has destination but no origin
        setError("Got it! Where are you flying from? Try: 'Bangkok to Bali' or 'from London'")
        return
      } else if (data.vibe && data.vibe.length > 0) {
        // Has vibes - go to mystery
        router.push(`/mystery`)
      } else if (data.confidence === 'low' && !data.origin && !data.destination) {
        // Nothing useful was parsed
        setError("I didn't catch that. Try something like 'cheap flights from Bangkok to Tokyo in March'")
        return
      } else {
        // Generic search - show results page or default to calendar
        router.push('/calendar')
      }
    } catch (err) {
      // Network errors, timeouts, JSON parse failures, etc.
      setError('Search is temporarily unavailable — please try again')
    } finally {
      setLoading(false)
    }
  }

  const quickQueries = [
    'Beach vacation under $1500',
    'Cheap weekend from NYC',
    'JFK to Tokyo in summer',
    'Adventure trip in Asia',
  ]

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="mb-4">
          <label htmlFor="nlsearch" className="block text-sm font-medium text-slate-900 mb-2">
            🔍 Search naturally - just type what you want
          </label>
          <input
            type="text"
            id="nlsearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'Beach vacation under $1500' or 'NYC to Paris this summer'"
            disabled={loading}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-lg disabled:bg-gray-100"
          />
        </div>

        {error && (
          <div className={`mb-4 rounded-lg p-3 ${
            error.includes('Try') || error.includes('flying from')
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              error.includes('Try') || error.includes('flying from')
                ? 'text-amber-700'
                : 'text-red-700'
            }`}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-500 text-slate-900 font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Understanding...' : 'Search'}
        </button>

        {/* Quick queries */}
        <div className="mt-4">
          <p className="text-xs text-gray-600 mb-2">Try these:</p>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuery(q)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Info */}
      <div className="mt-4 text-center">
        <p className="text-sky-300 text-sm">
          Powered by AI - our system understands natural language and finds the best tool for your search
        </p>
      </div>
    </div>
  )
}
