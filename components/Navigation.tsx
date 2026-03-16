'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

// ── Navigation categories ────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  emoji: string
}

interface NavCategory {
  label: string
  items: NavItem[]
}

const categories: NavCategory[] = [
  {
    label: 'Discover',
    items: [
      { href: '/mystery', label: 'Mystery Vacation', emoji: '\u2708\uFE0F' },
      { href: '/quiz', label: 'Destination Quiz', emoji: '\uD83E\uDDE9' },
      { href: '/inspire', label: 'Inspire Me', emoji: '\uD83D\uDCA1' },
    ],
  },
  {
    label: 'Flights',
    items: [
      { href: '/search', label: 'Flight Search', emoji: '\uD83D\uDD0D' },
      { href: '/search?tab=stopovers', label: 'Smart Stopovers', emoji: '\uD83D\uDDFA\uFE0F' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { href: '/trip-cost', label: 'Trip Costs', emoji: '\uD83D\uDCB0' },
      { href: '/whats-happening', label: 'Festival Calendar', emoji: '\uD83C\uDF89' },
    ],
  },
  {
    label: 'Deals',
    items: [
      { href: '/deals', label: "This Month's Deals", emoji: '\uD83C\uDFF7\uFE0F' },
      { href: '/leaderboard', label: 'Leaderboard', emoji: '\uD83C\uDFC6' },
    ],
  },
]

// ── Desktop dropdown ─────────────────────────────────────────────────────────

function DesktopDropdown({ category, pathname }: { category: NavCategory; pathname: string }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = category.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
  )

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
          isActive
            ? 'text-skyblue bg-skyblue/10'
            : 'text-white hover:text-skyblue hover:bg-white/[0.04]'
        }`}
      >
        {category.label}
        <svg
          className={`inline-block w-3.5 h-3.5 ml-1 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[200px]">
            {category.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                  pathname === item.href || (item.href.includes('?') && pathname === item.href.split('?')[0])
                    ? 'bg-skyblue/10 text-skyblue'
                    : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mobile accordion category ────────────────────────────────────────────────

function MobileCategory({
  category,
  pathname,
  onNavigate,
}: {
  category: NavCategory
  pathname: string
  onNavigate: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const isActive = category.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
  )

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
          isActive ? 'bg-skyblue/10 text-skyblue' : 'text-white hover:bg-white/[0.04]'
        }`}
      >
        <span className="font-medium">{category.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="ml-4 mt-1 space-y-0.5">
          {category.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition ${
                pathname === item.href
                  ? 'bg-skyblue text-navy font-semibold'
                  : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Navigation ──────────────────────────────────────────────────────────

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

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
        <div className="hidden lg:flex items-center space-x-1">
          {categories.map((cat) => (
            <DesktopDropdown key={cat.label} category={cat} pathname={pathname} />
          ))}

          {/* Auth section */}
          <div className="ml-4 pl-4 border-l border-white/10">
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
                  <span className="text-white/30 text-xs">&#9662;</span>
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
          <div className="flex flex-col space-y-1">
            {categories.map((cat) => (
              <MobileCategory
                key={cat.label}
                category={cat}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            ))}

            {/* Mobile auth links */}
            <div className="border-t border-skyblue/20 pt-3 mt-2">
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
