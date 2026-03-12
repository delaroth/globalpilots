'use client'

import Link from 'next/link'

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <div className="bg-skyblue/20 border-b border-skyblue/30 px-6 py-3 text-center">
        <p className="text-sm text-white">
          This page has moved.
          <Link href="/search?mode=flexible-month" className="text-skyblue font-semibold ml-1 underline">
            Try the new unified Search page &rarr;
          </Link>
        </p>
      </div>
      <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <Link href="/search" className="text-skyblue hover:text-skyblue-light transition">
            Go to Search &rarr;
          </Link>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Page Moved</h1>
        <p className="text-skyblue-light text-lg mb-8">
          The Calendar page has been merged into our new unified Search page.
        </p>
        <Link
          href="/search?mode=flexible-month"
          className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-bold py-4 px-8 rounded-lg transition shadow-lg"
        >
          Go to Search Page
        </Link>
      </div>
    </div>
  )
}
