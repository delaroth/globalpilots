'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-lg mx-auto text-center">
        {/* Turbulence icon */}
        <div className="text-6xl mb-6">
          <span role="img" aria-label="airplane in turbulence">✈️</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-lg text-white/70 mb-2">
          We hit some unexpected turbulence. Don&apos;t worry — your journey isn&apos;t over.
        </p>
        <p className="text-sm text-white/40 mb-10">
          {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred.'}
        </p>

        {/* Glassmorphism error card */}
        <div className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-8">
          <p className="text-white/60 text-sm">
            The flight crew is working on it. You can try again or head back to the terminal.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 bg-skyblue hover:bg-skyblue-dark text-navy font-bold rounded-xl transition cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-8 py-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white font-semibold rounded-xl transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
