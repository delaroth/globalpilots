'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface SocialProofData {
  weeklyReveals: number
  topDestinations: string[]
  lastRevealMinutesAgo: number
}

function useAnimatedCount(target: number, duration: number = 1500): number {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return

    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for a natural deceleration feel
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration])

  return count
}

export default function SocialProof() {
  const [data, setData] = useState<SocialProofData | null>(null)
  const animatedCount = useAnimatedCount(data?.weeklyReveals ?? 0)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/social-proof')
      if (!res.ok) return
      const json: SocialProofData = await res.json()
      setData(json)
    } catch {
      // Silently fail — component simply won't render
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Re-fetch every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Render nothing until data loads (no layout shift)
  if (!data) return null

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: count + text */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0" aria-hidden="true">
            🔥
          </span>
          <p className="text-sm text-white/50 truncate">
            <span className="text-white/70 font-medium tabular-nums">
              {animatedCount.toLocaleString()}
            </span>{' '}
            travelers explored mystery trips this week
          </p>
        </div>

        {/* Right: trending + last reveal (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 shrink-0 text-sm">
          {data.topDestinations.length > 0 && (
            <span className="text-white/40">
              Trending:{' '}
              <span className="text-skyblue-light/60">
                {data.topDestinations.slice(0, 3).join(', ')}
              </span>
            </span>
          )}

          <span className="text-white/20">·</span>

          <span className="flex items-center gap-1.5 text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Last reveal: {data.lastRevealMinutesAgo}m ago
          </span>
        </div>
      </div>
    </div>
  )
}
