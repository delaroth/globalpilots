'use client'

import { useEffect, useState, useMemo } from 'react'

interface MysteryLoadingProps {
  budget?: string
  origin?: string
  vibes?: string[]
  numCities?: number
  tripDuration?: number
}

const stages = [
  { icon: '🌍', label: 'Scanning 500+ destinations...', duration: 3000 },
  { icon: '✈️', label: 'Calculating flight costs...', duration: 3000 },
  { icon: '📅', label: 'Building your itinerary...', duration: 3000 },
  { icon: '✨', label: 'Adding finishing touches...', duration: 3000 },
]

export default function MysteryLoading({
  budget,
  origin,
  vibes,
  numCities,
  tripDuration,
}: MysteryLoadingProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      setElapsed(Date.now() - start)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const currentStageIndex = Math.min(
    Math.floor(elapsed / 3000),
    stages.length - 1
  )
  const currentStage = stages[currentStageIndex]

  // Progress within the current stage (0 to 1)
  const stageProgress = Math.min((elapsed % 3000) / 3000, 1)
  // Overall progress (0 to 100)
  const overallProgress = Math.min(
    ((currentStageIndex + stageProgress) / stages.length) * 100,
    100
  )

  // Build a search recap line from the user's actual inputs
  const recapLine = useMemo(() => {
    const parts: string[] = []
    if (vibes && vibes.length > 0) {
      const vibeLabels: Record<string, string> = {
        beach: 'beach',
        city: 'city',
        adventure: 'adventure',
        food: 'foodie',
        nature: 'nature',
      }
      const labels = vibes.map((v) => vibeLabels[v] || v)
      parts.push(labels.join(' & '))
    }
    if (budget) parts.push(`$${budget}`)
    if (numCities && numCities > 1) parts.push(`${numCities}-city`)
    if (tripDuration) parts.push(`${tripDuration}-day`)
    if (origin) parts.push(`from ${origin}`)

    if (parts.length === 0) return 'Finding your perfect mystery getaway...'
    return `Searching for a ${parts.join(' ')} getaway...`
  }, [budget, origin, vibes, numCities, tripDuration])

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Search Recap */}
      <p className="text-skyblue-light text-lg font-medium mb-6 text-center">
        {recapLine}
      </p>

      {/* Progress bar with plane */}
      <div className="relative w-full max-w-lg mb-8">
        {/* Track */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-skyblue to-skyblue-light rounded-full transition-all duration-300 ease-linear"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {/* Plane riding the bar */}
        <div
          className="absolute -top-5 transition-all duration-300 ease-linear"
          style={{ left: `calc(${overallProgress}% - 16px)` }}
        >
          <span className="text-3xl">✈️</span>
        </div>
      </div>

      {/* Stages */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-lg mb-6">
        {stages.map((stage, i) => {
          const done = i < currentStageIndex
          const active = i === currentStageIndex
          return (
            <div
              key={stage.label}
              className={`text-center transition-all duration-500 ${
                active
                  ? 'opacity-100 scale-105'
                  : done
                  ? 'opacity-60'
                  : 'opacity-30'
              }`}
            >
              <div className="text-2xl mb-1">{stage.icon}</div>
              <p className="text-xs text-white leading-tight">{stage.label}</p>
              {done && <span className="text-green-400 text-xs">Done</span>}
            </div>
          )
        })}
      </div>

      {/* Current stage message */}
      <p className="text-2xl font-semibold text-white mb-2 animate-pulse text-center">
        {currentStage.icon} {currentStage.label}
      </p>

      {/* Estimated time */}
      <p className="text-skyblue-light/70 text-sm mt-4">
        Usually takes 8-12 seconds
      </p>

      {/* Loading dots */}
      <div className="flex gap-2 mt-4">
        <div className="w-3 h-3 bg-skyblue rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-skyblue rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 bg-skyblue rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
    </div>
  )
}
