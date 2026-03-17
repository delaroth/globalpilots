'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession()

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4" role="img" aria-label="lock">
            {'\uD83D\uDD12'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Sign in to continue
          </h2>
          <p className="text-sky-300 text-sm mb-6">
            Create a free account or sign in to access this page.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?callbackUrl=/dashboard"
              className="block w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-sky-500-light transition text-center"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated
  return <>{children}</>
}
