'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRecentSearches, clearRecentSearches, RecentSearch } from '@/lib/recent-searches'

export default function RecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([])
  const router = useRouter()

  useEffect(() => {
    setSearches(getRecentSearches())
  }, [])

  if (searches.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto mb-6 px-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-white/40 shrink-0">Recent:</span>
        {searches.map((s, i) => (
          <button
            key={`${s.url}-${i}`}
            onClick={() => router.push(s.url)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/8 border border-white/10 text-white/70 text-xs hover:bg-white/15 hover:text-white hover:border-white/25 transition-all"
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => { clearRecentSearches(); setSearches([]) }}
          className="text-white/25 hover:text-white/50 text-xs ml-1 transition"
          title="Clear recent searches"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
