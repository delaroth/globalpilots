'use client'

import { useEffect, useState } from 'react'

const loadingMessages = [
  'Scanning 500+ destinations...',
  'Checking your budget...',
  'Finding hidden gems...',
  'Calculating flight costs...',
  'Matching your vibes...',
  'Discovering local secrets...',
  'Planning your perfect itinerary...',
]

export default function MysteryLoading() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      {/* Animated Plane */}
      <div className="relative w-full max-w-2xl h-32 mb-8 overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 animate-[fly_3s_ease-in-out_infinite]">
          <span className="text-6xl">✈️</span>
        </div>
        {/* Dotted line trail */}
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dotted border-skyblue/50"></div>
      </div>

      {/* Loading Message */}
      <div className="text-center">
        <p className="text-2xl font-semibold text-white mb-2 animate-pulse">
          {loadingMessages[messageIndex]}
        </p>
        <p className="text-skyblue-light">
          This might take a few seconds...
        </p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-2 mt-8">
        <div className="w-3 h-3 bg-skyblue rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-skyblue rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 bg-skyblue rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>

      <style jsx>{`
        @keyframes fly {
          0% {
            left: -100px;
          }
          100% {
            left: calc(100% + 100px);
          }
        }
      `}</style>
    </div>
  )
}
