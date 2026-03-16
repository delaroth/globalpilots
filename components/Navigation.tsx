'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const links = [
    { href: '/mystery', label: 'Mystery Vacation' },
    { href: '/inspire', label: 'Inspire' },
    { href: '/deals', label: 'Deals' },
    { href: '/stopover', label: 'Stopovers' },
    { href: '/whats-happening', label: "What's Happening" },
    { href: '/trip-cost', label: 'Trip Costs' },
    { href: '/quiz', label: 'Quiz' },
    { href: '/tools', label: 'All Tools' },
  ]

  return (
    <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
            <span className="text-navy text-xl font-bold">G</span>
          </div>
          <span className="text-white text-xl font-bold">GlobePilot</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition ${
                pathname === link.href
                  ? 'text-skyblue font-semibold'
                  : 'text-white hover:text-skyblue'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth section */}
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition text-sm"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-skyblue flex items-center justify-center text-navy text-xs font-bold">
                    {(session.user.name || session.user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-white/80 hidden xl:inline">
                  {session.user.name || session.user.email?.split('@')[0]}
                </span>
                <span className="text-white/30 text-xs">▾</span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm text-white font-medium truncate">
                        {session.user.name || 'Traveler'}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] transition"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-white/80 hover:text-white transition text-sm"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-skyblue hover:bg-skyblue/90 text-navy font-semibold px-4 py-1.5 rounded-full text-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-3">
          {/* Mobile auth quick access */}
          {status !== 'loading' && !session?.user && (
            <Link
              href="/login"
              className="text-skyblue text-sm font-medium"
            >
              Log In
            </Link>
          )}
          {session?.user && (
            <Link href="/dashboard" className="flex items-center">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-skyblue flex items-center justify-center text-navy text-xs font-bold">
                  {(session.user.name || session.user.email || '?')[0].toUpperCase()}
                </div>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-skyblue/20 pt-4">
          <div className="flex flex-col space-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`transition px-4 py-2 rounded-lg ${
                  pathname === link.href
                    ? 'bg-skyblue text-navy font-semibold'
                    : 'text-white hover:bg-navy-light'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile auth links */}
            <div className="border-t border-skyblue/20 pt-3 mt-1">
              {session?.user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-white hover:bg-navy-light rounded-lg transition"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="block w-full text-left px-4 py-2 text-red-400 hover:bg-navy-light rounded-lg transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-white hover:bg-navy-light rounded-lg transition"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-skyblue font-semibold hover:bg-navy-light rounded-lg transition"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
