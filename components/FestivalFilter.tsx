'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { Festival } from '@/data/festivals'
import { CATEGORY_LABELS, CATEGORY_COLORS, MONTH_NAMES } from '@/data/festivals'

interface FestivalFilterProps {
  festivals: Festival[]
  currentMonth: number // 1-12
}

const CROWD_COLORS: Record<Festival['crowdLevel'], string> = {
  extreme: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  moderate: 'bg-green-500/20 text-green-300 border border-green-500/30',
}

const BUDGET_BADGE: Record<Festival['budgetImpact'], { className: string; label: string } | null> = {
  higher: { className: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', label: 'Higher costs' },
  normal: null,
  lower: { className: 'bg-green-500/20 text-green-300 border border-green-500/30', label: 'Good value' },
}

type Category = Festival['category']
const ALL_CATEGORIES: Category[] = ['cultural', 'religious', 'music', 'food', 'nature', 'sports', 'carnival']

export default function FestivalFilter({ festivals, currentMonth }: FestivalFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set())
  const [expandedFestival, setExpandedFestival] = useState<string | null>(null)

  const toggleCategory = useCallback((cat: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }, [])

  const filteredFestivals = useMemo(() => {
    return festivals.filter(f => {
      if (f.month !== selectedMonth) return false
      if (activeCategories.size > 0 && !activeCategories.has(f.category)) return false
      return true
    })
  }, [festivals, selectedMonth, activeCategories])

  const getRandomFestivalLink = useCallback(() => {
    const now = currentMonth
    const upcomingMonths = [now, now % 12 + 1, (now + 1) % 12 + 1]
    const upcoming = festivals.filter(f => upcomingMonths.includes(f.month) && f.iata)
    if (upcoming.length === 0) return '/mystery'
    const random = upcoming[Math.floor(Math.random() * upcoming.length)]
    return `/mystery?hint=festival&destination=${random.iata}`
  }, [festivals, currentMonth])

  return (
    <div>
      {/* Month Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MONTH_NAMES.map((name, i) => {
          const month = i + 1
          const isActive = month === selectedMonth
          const festivalCount = festivals.filter(f => f.month === month).length
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-500 text-slate-900 shadow-lg shadow-sky-500/20'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
              }`}
            >
              {name.slice(0, 3)}
              {festivalCount > 0 && (
                <span className={`ml-1 text-xs ${isActive ? 'text-slate-900/60' : 'text-white/40'}`}>
                  {festivalCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategories(new Set())}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategories.size === 0
              ? 'bg-sky-500 text-slate-900'
              : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12]'
          }`}
        >
          All
        </button>
        {ALL_CATEGORIES.map(cat => {
          const isActive = activeCategories.has(cat)
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-l-2 ${
                CATEGORY_COLORS[cat]
              } ${
                isActive
                  ? 'bg-white/[0.15] text-white'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* Month Title */}
      <h2 className="text-2xl font-bold text-white mb-6">
        {MONTH_NAMES[selectedMonth - 1]} 2026
        <span className="text-white/40 text-lg font-normal ml-3">
          {filteredFestivals.length} {filteredFestivals.length === 1 ? 'event' : 'events'}
        </span>
      </h2>

      {/* Festival Cards */}
      {filteredFestivals.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/60 text-lg">
            No events found for this month with the selected filters.
          </p>
          <p className="text-white/40 text-sm mt-2">
            Try selecting a different month or removing category filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFestivals.map((festival, idx) => {
            const isExpanded = expandedFestival === `${festival.name}-${idx}`
            const budgetBadge = BUDGET_BADGE[festival.budgetImpact]
            return (
              <div
                key={`${festival.name}-${idx}`}
                className={`bg-white/[0.04] border border-white/10 rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/20 ${
                  CATEGORY_COLORS[festival.category]
                } border-l-2`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Emoji */}
                  <div className="text-3xl flex-shrink-0">{festival.emoji}</div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {festival.name}
                      </h3>
                      <span className="text-white/40">—</span>
                      <span className="text-sky-300 text-sm">
                        {festival.city}, {festival.country}
                      </span>
                    </div>

                    <p className="text-sky-300/80 text-sm font-medium mb-2">
                      &ldquo;{festival.highlight}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                      <span className="bg-white/[0.08] text-white/70 px-2 py-0.5 rounded">
                        {festival.duration}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${CROWD_COLORS[festival.crowdLevel]}`}>
                        {festival.crowdLevel.charAt(0).toUpperCase() + festival.crowdLevel.slice(1)} crowds
                      </span>
                      {budgetBadge && (
                        <span className={`px-2 py-0.5 rounded ${budgetBadge.className}`}>
                          {budgetBadge.label}
                        </span>
                      )}
                      <span className="text-white/40">
                        {festival.bookAdvance}
                      </span>
                    </div>

                    {/* Expandable Description */}
                    <button
                      onClick={() =>
                        setExpandedFestival(
                          isExpanded ? null : `${festival.name}-${idx}`
                        )
                      }
                      className="text-white/50 text-xs hover:text-white/70 transition mb-2"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>

                    {isExpanded && (
                      <p className="text-white/60 text-sm mb-3 leading-relaxed animate-slide-up">
                        {festival.description}
                      </p>
                    )}

                    {/* CTA */}
                    {festival.iata && (
                      <Link
                        href={`/mystery?hint=festival&destination=${festival.iata}`}
                        className="inline-flex items-center gap-1.5 bg-sky-500 text-slate-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-sky-500-light transition-colors"
                      >
                        Mystery Trip to {festival.city}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    )}
                  </div>

                  {/* Date badge */}
                  <div className="hidden sm:flex flex-col items-center bg-white/[0.06] rounded-lg px-3 py-2 flex-shrink-0">
                    <span className="text-xs text-white/40 uppercase">{MONTH_NAMES[festival.month - 1].slice(0, 3)}</span>
                    <span className="text-lg font-bold text-white">
                      {festival.startDay || '~'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Surprise Me CTA */}
      <div className="mt-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-xl p-6 sm:p-8 text-center">
        <p className="text-2xl mb-2">
          <span role="img" aria-label="lightbulb">&#x1F4A1;</span>
        </p>
        <h3 className="text-xl font-bold text-white mb-2">
          Surprise me with a festival trip
        </h3>
        <p className="text-white/60 text-sm mb-4 max-w-md mx-auto">
          We&apos;ll pick a random festival happening in the next 3 months and set up a mystery trip for you.
        </p>
        <Link
          href={getRandomFestivalLink()}
          className="inline-flex items-center gap-2 bg-sky-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-sky-500-light transition-colors text-lg"
        >
          Surprise Me
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
