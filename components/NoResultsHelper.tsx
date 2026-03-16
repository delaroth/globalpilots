'use client'

import Link from 'next/link'

interface NoResultsHelperProps {
  origin?: string
  destination?: string
  date?: string
  className?: string
}

export default function NoResultsHelper({
  origin,
  destination,
  date,
  className = '',
}: NoResultsHelperProps) {
  const suggestions = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Try flexible dates',
      desc: 'Shifting by a few days often reveals much cheaper options.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Check nearby airports',
      desc: 'Flying from a neighboring airport can unlock better deals.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Try a different month',
      desc: 'Shoulder season (just before/after peak) offers the best value.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Search anywhere',
      desc: 'Let us find the cheapest destination from your airport.',
    },
  ]

  return (
    <div className={`w-full max-w-xl mx-auto text-center ${className}`}>
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">No results found</h3>
        <p className="text-white/50 text-sm">
          {origin && destination
            ? `We couldn't find flights from ${origin} to ${destination}${date ? ` on ${date}` : ''}.`
            : 'We couldn\'t find any results for your search.'}
        </p>
      </div>

      <div className="space-y-3 text-left mb-6">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="flex-shrink-0 text-sky-400 mt-0.5">{s.icon}</div>
            <div>
              <p className="text-white text-sm font-medium">{s.title}</p>
              <p className="text-white/40 text-xs">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/inspire"
          className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm font-medium hover:bg-sky-500/30 transition"
        >
          Browse destinations
        </Link>
        <Link
          href="/deals"
          className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition"
        >
          View deals
        </Link>
      </div>
    </div>
  )
}
