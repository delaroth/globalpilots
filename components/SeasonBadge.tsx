'use client'

import { getDestinationCost } from '@/lib/destination-costs'

interface SeasonBadgeProps {
  destinationCode: string
  travelMonth?: number // 1-12
  className?: string
}

type SeasonType = 'peak' | 'shoulder' | 'off' | null

function getSeasonType(bestMonths: number[], travelMonth: number): SeasonType {
  if (!bestMonths || bestMonths.length === 0) return null

  // Check if travel month is in peak season
  if (bestMonths.includes(travelMonth)) {
    return 'peak'
  }

  // Check if travel month is within 1 month of any best month (shoulder season)
  for (const bm of bestMonths) {
    // Handle wrap-around (e.g., December=12 is 1 month from January=1)
    const diff = Math.abs(bm - travelMonth)
    const wrapDiff = 12 - diff
    if (diff === 1 || wrapDiff === 1) {
      return 'shoulder'
    }
  }

  return 'off'
}

export default function SeasonBadge({
  destinationCode,
  travelMonth,
  className = '',
}: SeasonBadgeProps) {
  if (!travelMonth || travelMonth < 1 || travelMonth > 12) return null

  const dest = getDestinationCost(destinationCode)
  if (!dest || !dest.bestMonths || dest.bestMonths.length === 0) return null

  const seasonType = getSeasonType(dest.bestMonths, travelMonth)
  if (!seasonType) return null

  const config = {
    peak: {
      label: 'Peak Season',
      bgClass: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
      icon: (
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
    },
    shoulder: {
      label: 'Shoulder Season',
      subtitle: 'up to 30% cheaper',
      bgClass: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
    off: {
      label: 'Off Season',
      subtitle: 'cheapest prices',
      bgClass: 'bg-sky-500/20 border-sky-500/30 text-sky-300',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }

  const c = config[seasonType]

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${c.bgClass} ${className}`}
    >
      {c.icon}
      {c.label}
      {'subtitle' in c && c.subtitle && (
        <span className="opacity-70"> &mdash; {c.subtitle}</span>
      )}
    </span>
  )
}
