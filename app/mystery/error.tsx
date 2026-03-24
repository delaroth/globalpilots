'use client'

import { useEffect } from 'react'

export default function MysteryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[MysteryError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🔮</div>
        <h1 className="text-2xl font-bold text-white mb-3">Mystery trip hit a snag</h1>
        <p className="text-white/60 mb-6">
          We couldn&apos;t load the mystery trip planner. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold py-2.5 px-6 rounded-lg transition"
          >
            Go Home
          </a>
        </div>
        {error.digest && (
          <p className="text-white/20 text-xs mt-6">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
