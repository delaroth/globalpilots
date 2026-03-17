'use client'

import Link from 'next/link'

export default function WeekendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="bg-sky-500/20 border-b border-sky-500/30 px-6 py-3 text-center">
        <p className="text-sm text-white">
          This page has moved.
          <Link href="/search" className="text-sky-400 font-semibold ml-1 underline">
            Try the new unified Search page &rarr;
          </Link>
        </p>
      </div>
      <nav className="w-full px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-sky-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
              <span className="text-slate-900 text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <Link href="/search" className="text-sky-400 hover:text-sky-300 transition">
            Go to Search &rarr;
          </Link>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Page Moved</h1>
        <p className="text-sky-300 text-lg mb-8">
          The Weekend Deals page has been merged into our new unified Search page.
        </p>
        <Link
          href="/search"
          className="inline-block bg-sky-500 hover:bg-sky-600 text-slate-900 font-bold py-4 px-8 rounded-lg transition shadow-lg"
        >
          Go to Search Page
        </Link>
      </div>
    </div>
  )
}
