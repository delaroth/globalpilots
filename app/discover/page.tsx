'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import WhatNext from '@/components/WhatNext'
import { buildFlightLink } from '@/lib/affiliate'
import { saveRecentSearch } from '@/lib/recent-searches'
import RecentSearches from '@/components/RecentSearches'
import DestinationImage from '@/components/DestinationImage'

interface DiscoverResult {
  destination: string
  city: string
  price: number
  departDate: string
  returnDate: string
  airline: string | null
}

export default function DiscoverPage() {
  const [origin, setOrigin] = useState('')
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<DiscoverResult[]>([])
  const [searched, setSearched] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResults([])
    setSearched(false)

    if (!origin) { setError('Please select a departure airport'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/discover?origin=${origin}&depart_date=${departDate}&limit=5`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `API error: ${res.status}`)
      }
      const data = await res.json()
      const resultsList = data.results || []
      setResults(resultsList)
      setSearched(true)
      if (resultsList.length > 0) {
        const dateLabel = new Date(departDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        saveRecentSearch({
          origin, mode: 'discover', date: departDate,
          label: `${origin} · cheapest · ${dateLabel}`,
          url: `/discover?origin=${origin}&depart_date=${departDate}`,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <Navigation />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Cheapest Destinations</h1>
          <p className="text-xl text-skyblue-light max-w-2xl mx-auto">
            Pick your airport and date — we&apos;ll show you the 5 cheapest places you can fly to
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-5">
            <AirportAutocomplete id="discover-origin" label="From" value={origin} onChange={setOrigin} placeholder="Your airport..." />

            <div className="space-y-2">
              <label htmlFor="discover-date" className="block text-sm font-medium text-navy">Around this date</label>
              <input
                type="date" id="discover-date" value={departDate}
                onChange={e => setDepartDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                required
              />
              <p className="text-xs text-gray-400">We&apos;ll search within a few days of this date</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg">
              {loading ? 'Finding cheapest flights...' : 'Find Cheapest Destinations'}
            </button>
          </div>
        </form>

        <RecentSearches />

        {/* Error */}
        {error && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue"></div>
            <p className="text-white mt-4 text-lg">Scanning destinations...</p>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <div className="max-w-3xl mx-auto">
            {results.length > 0 ? (
              <>
                <p className="text-skyblue-light/60 text-xs text-center mb-6">
                  Prices are cached estimates — click to see live prices on Aviasales
                </p>
                <div className="space-y-4">
                  {results.map((r, i) => (
                    <div key={r.destination} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                      <button
                        onClick={() => {
                          const link = buildFlightLink(origin, r.destination, r.departDate)
                          window.open(link, '_blank')
                        }}
                        className="w-full text-left"
                      >
                        <div className="flex items-center">
                          {/* Rank */}
                          <div className={`w-16 h-full flex items-center justify-center text-2xl font-bold shrink-0 py-6 ${
                            i === 0 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            #{i + 1}
                          </div>

                          {/* Destination thumbnail */}
                          <div className="w-16 h-16 shrink-0 my-2 ml-3 rounded-lg overflow-hidden">
                            <DestinationImage code={r.destination} city={r.city} height="h-full" className="w-full" />
                          </div>

                          {/* Details */}
                          <div className="flex-1 px-5 py-4">
                            <div className="flex items-baseline gap-2">
                              <h3 className="text-xl font-bold text-navy">{r.city}</h3>
                              <span className="text-gray-400 text-sm">{r.destination}</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              {formatDate(r.departDate)} — {formatDate(r.returnDate)}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right px-5 py-4 shrink-0">
                            <p className="text-xs text-gray-400">from ~</p>
                            <p className={`text-3xl font-bold ${i === 0 ? 'text-green-600' : 'text-navy'}`}>
                              ${r.price}
                            </p>
                            <p className="text-skyblue text-xs font-medium mt-1">Search live price &rarr;</p>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-4 px-5 pb-3 pt-0">
                        <Link
                          href={`/trip-cost?destination=${encodeURIComponent(r.destination)}`}
                          className="text-xs text-gray-400 hover:text-skyblue transition"
                        >
                          Plan a trip
                        </Link>
                        <Link
                          href={`/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(r.destination)}`}
                          className="text-xs text-gray-400 hover:text-skyblue transition"
                        >
                          Layover routes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <WhatNext
                  origin={origin}
                  destination={results[0]?.destination}
                  destinationCity={results[0]?.city}
                  departDate={departDate}
                  context="discover"
                />
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-3">No destinations found</h3>
                <p className="text-skyblue-light">Try a different date or airport</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searched && !loading && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-skyblue/20">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-white font-semibold text-lg mb-2">Don&apos;t know where to go?</h3>
              <p className="text-skyblue-light text-sm">
                Enter your departure airport and a travel date. We&apos;ll find the 5 cheapest destinations you can fly to — then click any result to see live prices and book.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
