'use client'

import { useState, useEffect } from 'react'
import { findNearbyAirports } from '@/lib/nearby-airports'

interface NearbyAirportPricesProps {
  origin: string
  destination: string
  departDate: string
  currentPrice: number
}

interface NearbyResult {
  code: string
  city: string
  distanceKm: number
  price: number | null
  savings: number | null
}

export default function NearbyAirportPrices({
  origin,
  destination,
  departDate,
  currentPrice,
}: NearbyAirportPricesProps) {
  const [expanded, setExpanded] = useState(false)
  const [results, setResults] = useState<NearbyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  // Find nearby airports on mount
  useEffect(() => {
    if (!origin || !destination || !departDate) return

    const nearby = findNearbyAirports(origin, 200).slice(0, 3)
    if (nearby.length === 0) return

    // Pre-populate results without prices
    setResults(nearby.map(a => ({
      code: a.code,
      city: a.city,
      distanceKm: a.distanceKm,
      price: null,
      savings: null,
    })))
  }, [origin, destination, departDate])

  // Fetch prices when expanded
  useEffect(() => {
    if (!expanded || fetched || results.length === 0) return

    setLoading(true)
    setFetched(true)

    const fetchPrices = async () => {
      const token = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || ''
      const updated = await Promise.all(
        results.map(async (airport) => {
          try {
            const res = await fetch(
              `/api/nearby-price?origin=${airport.code}&destination=${destination}&departDate=${departDate}`
            )
            if (!res.ok) return airport
            const data = await res.json()
            if (data.price != null) {
              const savings = currentPrice - data.price
              return { ...airport, price: data.price, savings }
            }
          } catch {
            // Silently fail — this is a nice-to-have feature
          }
          return airport
        })
      )
      setResults(updated)
      setLoading(false)
    }

    fetchPrices()
  }, [expanded, fetched, results, destination, departDate, currentPrice])

  // Don't render if no nearby airports found
  if (results.length === 0) return null

  // Filter to only show cheaper airports when we have prices
  const cheaperAirports = results.filter(r => r.price != null && r.savings != null && r.savings > 0)

  return (
    <div className="max-w-md mx-auto mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm"
      >
        <span className="text-skyblue-light font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Also check nearby airports
        </span>
        <svg
          className={`w-4 h-4 text-white/50 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-skyblue"></div>
              <p className="text-white/50 text-xs mt-1">Checking prices...</p>
            </div>
          )}

          {!loading && results.map((airport) => (
            <div
              key={airport.code}
              className="px-4 py-3 flex items-center justify-between border-b border-white/5 last:border-b-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{airport.code}</span>
                  <span className="text-white/50 text-xs">({airport.city})</span>
                </div>
                <p className="text-white/30 text-xs">{airport.distanceKm} km away</p>
              </div>
              <div className="text-right">
                {airport.price == null ? (
                  <span className="text-white/30 text-xs italic">No data</span>
                ) : airport.savings != null && airport.savings > 0 ? (
                  <>
                    <span className="text-white font-medium text-sm">~${airport.price}</span>
                    <p className="text-emerald-400 text-xs font-medium">Save ${airport.savings}</p>
                  </>
                ) : (
                  <>
                    <span className="text-white/50 text-sm">~${airport.price}</span>
                    <p className="text-white/30 text-xs">More expensive</p>
                  </>
                )}
              </div>
            </div>
          ))}

          {!loading && cheaperAirports.length > 0 && (
            <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20">
              <p className="text-emerald-400 text-xs text-center">
                Tip: Flying from {cheaperAirports[0].code} could save you ${cheaperAirports[0].savings}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
