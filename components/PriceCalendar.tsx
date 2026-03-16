'use client'

import { useState, useEffect } from 'react'

interface DayPrice {
  date: string
  price: number
  isLowest: boolean
}

interface PriceCalendarProps {
  origin: string
  destination: string
  month: string // YYYY-MM
  onSelectDate?: (date: string) => void
}

type PriceTier = 'cheap' | 'mid' | 'expensive' | 'none'

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function getPriceTier(price: number, percentiles: { p25: number; p75: number }): PriceTier {
  if (price <= percentiles.p25) return 'cheap'
  if (price <= percentiles.p75) return 'mid'
  return 'expensive'
}

function tierColors(tier: PriceTier): string {
  switch (tier) {
    case 'cheap':
      return 'bg-emerald-500/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/40'
    case 'mid':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
    case 'expensive':
      return 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30'
    case 'none':
      return 'bg-white/[0.04] border-white/[0.06] text-white/20'
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function PriceCalendar({ origin, destination, month, onSelectDate }: PriceCalendarProps) {
  const [prices, setPrices] = useState<DayPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [year, monthNum] = month.split('-').map(Number)
  const daysInMonth = getDaysInMonth(year, monthNum)
  const firstDay = getFirstDayOfWeek(year, monthNum)

  useEffect(() => {
    if (!origin || !destination || !month) return

    async function fetchPrices() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/price-calendar?origin=${origin.toUpperCase()}&destination=${destination.toUpperCase()}&month=${month}`
        )
        if (!res.ok) {
          throw new Error('Failed to load price data')
        }
        const data = await res.json()
        setPrices(data.prices || [])
      } catch {
        setError('Could not load price calendar')
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
  }, [origin, destination, month])

  // Calculate percentiles for coloring
  const pricesWithData = prices.filter(p => p.price > 0)
  const sortedPrices = [...pricesWithData].sort((a, b) => a.price - b.price)
  const percentiles = {
    p25: sortedPrices[Math.floor(sortedPrices.length * 0.25)]?.price ?? 0,
    p75: sortedPrices[Math.floor(sortedPrices.length * 0.75)]?.price ?? Infinity,
  }

  // Build price lookup by day number
  const priceByDay: Record<number, DayPrice> = {}
  for (const p of prices) {
    const dayNum = parseInt(p.date.split('-')[2], 10)
    priceByDay[dayNum] = p
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 animate-pulse">
        <div className="h-4 bg-white/[0.08] rounded w-1/3 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.04] rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-center">
        <p className="text-white/40 text-sm">{error}</p>
      </div>
    )
  }

  if (pricesWithData.length === 0) {
    return (
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-center">
        <p className="text-white/40 text-sm">No price data available for this route/month</p>
      </div>
    )
  }

  const monthLabel = new Date(year, monthNum - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const lowestPrice = sortedPrices[0]

  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">
          Price Calendar: {monthLabel}
        </h3>
        {lowestPrice && (
          <span className="text-emerald-400 text-xs font-medium">
            Lowest: ${lowestPrice.price}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />
          <span className="text-white/40 text-[10px]">Cheap</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
          <span className="text-white/40 text-[10px]">Average</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
          <span className="text-white/40 text-[10px]">Expensive</span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-white/30 text-[10px] font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1
          const dayPrice = priceByDay[dayNum]
          const tier: PriceTier = dayPrice ? getPriceTier(dayPrice.price, percentiles) : 'none'
          const isClickable = !!dayPrice && !!onSelectDate

          return (
            <button
              key={dayNum}
              onClick={() => {
                if (isClickable && dayPrice) {
                  onSelectDate(dayPrice.date)
                }
              }}
              disabled={!isClickable}
              className={`h-12 rounded border text-center flex flex-col items-center justify-center transition ${tierColors(tier)} ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              } ${dayPrice?.isLowest ? 'ring-1 ring-emerald-400' : ''}`}
            >
              <span className="text-[10px] opacity-60">{dayNum}</span>
              {dayPrice ? (
                <span className="text-[11px] font-semibold">${dayPrice.price}</span>
              ) : (
                <span className="text-[10px]">-</span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-white/20 text-[10px] mt-2 text-center">
        Prices are cached estimates. Click a day to search that date.
      </p>
    </div>
  )
}
