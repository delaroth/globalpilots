'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import { majorHubs, LayoverRoute } from '@/lib/hubs'
import WhatNext from '@/components/WhatNext'
import { generateAffiliateLink } from '@/lib/affiliate'
import { saveRecentSearch } from '@/lib/recent-searches'
import RecentSearches from '@/components/RecentSearches'

// Lazy load RouteComparison (includes CityGuide) — only shown after search results
const RouteComparison = dynamic(() => import('@/components/RouteComparison'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-skyblue"></div>
      <p className="text-white mt-4">Loading route comparison...</p>
    </div>
  ),
})

function ExplorePageContent() {
  const searchParams = useSearchParams()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  // Pre-fill from URL params (e.g., /explore?origin=BKK&destination=NRT)
  useEffect(() => {
    const o = searchParams.get('origin')
    const d = searchParams.get('destination') || searchParams.get('dest')
    if (o) setOrigin(o.toUpperCase())
    if (d) setDestination(d.toUpperCase())
  }, [searchParams])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [directPrice, setDirectPrice] = useState<number | null>(null)
  const [layoverRoutes, setLayoverRoutes] = useState<LayoverRoute[]>([])
  const [priceSource, setPriceSource] = useState<'travelpayouts-cached' | 'kiwi-live' | 'flightapi-live' | 'serpapi-live'>('travelpayouts-cached')
  const [searched, setSearched] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDirectPrice(null)
    setLayoverRoutes([])
    setSearched(false)

    if (!origin || !destination) { setError('Please select both origin and destination'); return }
    if (origin === destination) { setError('Origin and destination must be different'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/layover?origin=${origin}&destination=${destination}&depart_date=${departDate}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `API error: ${res.status}`)
      }
      const data = await res.json()

      if (data.directPrice !== undefined) setDirectPrice(data.directPrice)
      if (data.priceSource) setPriceSource(data.priceSource)

      if (data.layoverRoutes?.length > 0) {
        const routes: LayoverRoute[] = data.layoverRoutes.map((route: any) => {
          const hub = majorHubs.find(h => h.code === route.hub)
          if (!hub) return null
          return {
            hub,
            leg1Price: route.leg1Price,
            leg2Price: route.leg2Price,
            totalPrice: route.totalPrice,
            savings: route.savings ?? null,
            savingsPercent: route.savingsPercent ?? null,
            sideQuest: route.sideQuest ? {
              verdict: route.sideQuest.verdict,
              pitch: route.sideQuest.pitch,
              netValue: route.sideQuest.netValue,
              dailyCost: route.sideQuest.dailyCost,
              experienceCost: route.sideQuest.experienceCost,
              layoverDays: route.sideQuest.layoverDays,
              breakdown: route.sideQuest.breakdown,
            } : undefined,
          }
        }).filter(Boolean)
        setLayoverRoutes(routes)
      }
      setSearched(true)
      const dateLabel = new Date(departDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      saveRecentSearch({
        origin, destination, date: departDate, mode: 'explore',
        label: `${origin} → ${destination} via hubs · ${dateLabel}`,
        url: `/explore?origin=${origin}&dest=${destination}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <Navigation />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Layover Explorer</h1>
          <p className="text-xl text-skyblue-light max-w-2xl mx-auto">
            Turn your layover into a bonus destination. Compare direct flights vs. stopover routes through major hub cities.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AirportAutocomplete id="explore-origin" label="From" value={origin} onChange={setOrigin} placeholder="Departure airport..." />
              <AirportAutocomplete id="explore-dest" label="To" value={destination} onChange={setDestination} placeholder="Final destination..." />
            </div>

            <div className="space-y-2">
              <label htmlFor="explore-date" className="block text-sm font-medium text-navy">Departure Date</label>
              <input
                type="date" id="explore-date" value={departDate}
                onChange={e => setDepartDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                required
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg">
              {loading ? 'Searching stopover routes...' : 'Find Stopover Routes'}
            </button>
          </div>
        </form>

        <RecentSearches />

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue"></div>
            <p className="text-white mt-4 text-lg">Comparing direct vs. stopover routes...</p>
            <p className="text-skyblue-light/60 text-sm mt-1">Checking prices through major hub airports</p>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <div className="max-w-5xl mx-auto">
            {layoverRoutes.length > 0 ? (
              <RouteComparison
                origin={origin}
                destination={destination}
                departDate={departDate}
                directPrice={directPrice}
                layoverRoutes={layoverRoutes}
                priceSource={priceSource}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-3">No stopover routes found</h3>
                <p className="text-skyblue-light mb-6">
                  We couldn&apos;t find stopover options for this route. Try a different date or destination.
                </p>
                {directPrice !== null && (
                  <button
                    onClick={() => {
                      const link = generateAffiliateLink({ origin, destination, departDate })
                      window.open(link, '_blank')
                    }}
                    className="bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-8 rounded-lg transition"
                  >
                    Search Direct Flight (~${directPrice})
                  </button>
                )}
              </div>
            )}

            <WhatNext origin={origin} destination={destination} departDate={departDate} context="explore" />
          </div>
        )}

        {/* How it works — shown before search */}
        {!searched && !loading && (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">1️⃣</div>
                <h3 className="text-white font-semibold mb-2">Enter Your Route</h3>
                <p className="text-skyblue-light text-sm">Tell us where you&apos;re flying from and to</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">2️⃣</div>
                <h3 className="text-white font-semibold mb-2">We Compare Routes</h3>
                <p className="text-skyblue-light text-sm">We check prices through major hub airports like Dubai, Singapore, Istanbul</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">3️⃣</div>
                <h3 className="text-white font-semibold mb-2">Explore &amp; Save</h3>
                <p className="text-skyblue-light text-sm">Book two cheaper flights and enjoy a bonus destination in between</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <ExplorePageContent />
    </Suspense>
  )
}
