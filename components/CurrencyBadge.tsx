'use client'

import { useState, useEffect } from 'react'

interface CurrencyAdvantageData {
  currency: string
  advantagePercent: number
}

interface CurrencyBadgeProps {
  destinationCode: string
  homeCurrency?: string
  className?: string
}

// Client-side cache to avoid repeated fetches
let cachedAdvantages: Record<string, CurrencyAdvantageData> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export default function CurrencyBadge({
  destinationCode,
  homeCurrency = 'USD',
  className = '',
}: CurrencyBadgeProps) {
  const [advantage, setAdvantage] = useState<CurrencyAdvantageData | null>(null)

  useEffect(() => {
    async function fetchAdvantages() {
      const now = Date.now()

      // Use cache if still fresh
      if (cachedAdvantages && now - cacheTimestamp < CACHE_TTL) {
        const code = destinationCode.toUpperCase()
        if (cachedAdvantages[code]) {
          setAdvantage(cachedAdvantages[code])
        }
        return
      }

      try {
        const res = await fetch(`/api/currency/advantages?base=${homeCurrency}`)
        if (!res.ok) return

        const data = await res.json()
        const advantages = data.advantages || []

        // Build lookup map
        const map: Record<string, CurrencyAdvantageData> = {}
        for (const adv of advantages) {
          map[adv.destination] = {
            currency: adv.currency,
            advantagePercent: adv.advantagePercent,
          }
        }

        cachedAdvantages = map
        cacheTimestamp = Date.now()

        const code = destinationCode.toUpperCase()
        if (map[code]) {
          setAdvantage(map[code])
        }
      } catch {
        // Silently fail - this is an enhancement badge
      }
    }

    fetchAdvantages()
  }, [destinationCode, homeCurrency])

  if (!advantage || advantage.advantagePercent <= 5) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 ${className}`}
      title={`Your ${homeCurrency} buys ${advantage.advantagePercent}% more ${advantage.currency} than 6 months ago`}
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      {homeCurrency} +{advantage.advantagePercent}% vs 6mo
    </span>
  )
}
