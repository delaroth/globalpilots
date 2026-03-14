'use client'

import Link from 'next/link'

type WhatNextContext = 'mystery' | 'search' | 'explore' | 'multi-city' | 'trip-cost'

interface WhatNextProps {
  origin?: string
  destination?: string
  destinationCity?: string
  departDate?: string
  context: WhatNextContext
}

interface Suggestion {
  emoji: string
  title: string
  description: string
  href: string
}

function buildSuggestions({
  origin,
  destination,
  destinationCity,
  departDate,
  context,
}: WhatNextProps): Suggestion[] {
  const destLabel = destinationCity || destination || 'destination'
  const suggestions: Suggestion[] = []

  if (context === 'mystery') {
    if (destination) {
      suggestions.push({
        emoji: '✈️',
        title: `Search flights to ${destLabel}`,
        description: 'Compare dates and prices',
        href: `/search${origin ? `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}` : `?destination=${encodeURIComponent(destination)}`}`,
      })
    }
    if (destination) {
      suggestions.push({
        emoji: '💰',
        title: 'Check daily costs',
        description: `See what ${destLabel} costs per day`,
        href: `/trip-cost?destination=${encodeURIComponent(destination)}`,
      })
    }
    if (origin && destination) {
      suggestions.push({
        emoji: '🗺️',
        title: 'Explore stopovers',
        description: 'Find cheaper routes with a bonus city',
        href: `/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      })
    }
  }

  if (context === 'search') {
    if (destination) {
      suggestions.push({
        emoji: '💰',
        title: `Trip costs for ${destLabel}`,
        description: 'Hotels, food, transport per day',
        href: `/trip-cost?destination=${encodeURIComponent(destination)}`,
      })
    }
    if (origin && destination) {
      suggestions.push({
        emoji: '🗺️',
        title: 'Try a stopover route',
        description: 'Save money with a bonus city',
        href: `/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${departDate ? `&departDate=${encodeURIComponent(departDate)}` : ''}`,
      })
    }
    suggestions.push({
      emoji: '🌐',
      title: 'Plan multi-city',
      description: 'String together multiple destinations',
      href: '/multi-city',
    })
  }

  if (context === 'explore') {
    if (destination) {
      suggestions.push({
        emoji: '💰',
        title: `Trip costs for ${destLabel}`,
        description: 'Budget your stay per day',
        href: `/trip-cost?destination=${encodeURIComponent(destination)}`,
      })
    }
    if (origin) {
      suggestions.push({
        emoji: '🌐',
        title: `Plan multi-city from ${origin}`,
        description: 'Add more stops to your trip',
        href: '/multi-city',
      })
    }
    suggestions.push({
      emoji: '✈️',
      title: 'Search direct flights',
      description: 'Compare dates and carriers',
      href: `/search${origin && destination ? `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}` : ''}`,
    })
  }

  if (context === 'multi-city') {
    suggestions.push({
      emoji: '💰',
      title: 'Check costs per city',
      description: 'See daily budgets for each stop',
      href: '/trip-cost',
    })
    suggestions.push({
      emoji: '🎲',
      title: 'Mystery vacation',
      description: 'Let us surprise you instead',
      href: '/mystery',
    })
  }

  if (context === 'trip-cost') {
    suggestions.push({
      emoji: '✈️',
      title: 'Search flights',
      description: 'Find the best prices to get there',
      href: `/search${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`,
    })
    suggestions.push({
      emoji: '🗺️',
      title: 'Explore stopovers',
      description: 'Save on flights via a hub city',
      href: `/explore${origin && destination ? `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}` : ''}`,
    })
    suggestions.push({
      emoji: '🎲',
      title: 'Mystery vacation',
      description: 'Feeling adventurous?',
      href: '/mystery',
    })
  }

  return suggestions.slice(0, 3)
}

export default function WhatNext(props: WhatNextProps) {
  const suggestions = buildSuggestions(props)

  // Don't render if no suggestions or not enough context
  if (suggestions.length === 0) return null

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-3">
        Continue planning
      </p>
      <div className={`grid gap-3 ${
        suggestions.length === 1
          ? 'grid-cols-1 max-w-xs mx-auto'
          : suggestions.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-3'
      }`}>
        {suggestions.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-sm border border-skyblue/10 hover:border-skyblue/30 rounded-xl px-4 py-3 transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5 shrink-0">{s.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 group-hover:text-white transition truncate">
                  {s.title}
                </p>
                <p className="text-xs text-white/35 group-hover:text-white/50 transition mt-0.5">
                  {s.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
