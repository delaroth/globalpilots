'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

// ── Navigation structure ────────────────────────────────────────────────────

interface NavLink {
  href: string
  label: string
  description: string
}

interface NavCategory {
  label: string
  gradient?: boolean // for "AI Trip Planner" special styling
  items: NavLink[]
}

const navCategories: NavCategory[] = [
  {
    label: 'AI Trip Planner',
    gradient: true,
    items: [
      { href: '/mystery', label: 'Mystery Vacation', description: 'Let AI surprise you with a destination' },
      { href: '/plan-my-trip', label: 'Plan My Trip', description: 'Choose your destination, AI plans the rest' },
    ],
  },
  {
    label: 'Find Flights',
    items: [
      { href: '/search', label: 'Flight Search', description: 'Compare prices across dates and airlines' },
      { href: '/search?tab=stopovers', label: 'Smart Stopovers', description: 'Turn layovers into free vacations' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { href: '/trip-cost', label: 'Trip Costs', description: 'Know the real price before you go' },
      { href: '/whats-happening', label: 'Festival Calendar', description: 'Events and festivals worldwide' },
      { href: '/inspire', label: 'Inspire Me', description: 'Explore trending destinations' },
      { href: '/quiz', label: 'Destination Quiz', description: 'Find your perfect match' },
    ],
  },
  {
    label: 'Deals',
    items: [
      { href: '/deals', label: "This Month's Deals", description: 'Cheapest flights from your airport' },
      { href: '/leaderboard', label: 'Leaderboard', description: 'Top destinations by popularity' },
    ],
  },
]

// ── Desktop dropdown ─────────────────────────────────────────────────────────

function DesktopDropdown({
  category,
  pathname,
  isOpen,
  onOpen,
  onClose,
}: {
  category: NavCategory
  pathname: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const isActive = category.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
  )

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
          category.gradient
            ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold'
            : isActive
              ? 'text-sky-400 bg-sky-400/10'
              : 'text-white/90 hover:text-sky-400 hover:bg-white/[0.04]'
        }`}
      >
        {category.label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            category.gradient ? 'text-pink-400' : isActive ? 'text-sky-400' : 'text-white/50'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full pt-2 z-50">
          <div className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2">
            {category.items.map((item) => {
              const isItemActive =
                pathname === item.href ||
                (item.href.includes('?') && pathname === item.href.split('?')[0])
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`block px-4 py-2.5 transition ${
                    isItemActive
                      ? 'bg-sky-50 text-sky-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-sky-600'
                  }`}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{item.description}</span>
                </Link>
              )
            })}
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
          category.gradient
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white'
            : isActive
              ? 'bg-sky-500/10 text-sky-400'
              : 'text-white hover:bg-white/[0.04]'
        }`}
      >
        <span className={`font-medium ${category.gradient ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold' : ''}`}>
          {category.label}
        </span>
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
              className={`block px-4 py-2.5 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-white/40 mt-0.5">{item.description}</span>
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null)
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-8 h-8 bg-sky-400 rounded-full flex items-center justify-center">
            <span className="text-navy text-xl font-bold">G</span>
          </div>
          <span className="text-white text-xl font-bold">GlobePilots</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navCategories.map((cat) => (
            <DesktopDropdown
              key={cat.label}
              category={cat}
              pathname={pathname}
              isOpen={openDropdown === cat.label}
              onOpen={() => setOpenDropdown(cat.label)}
              onClose={() => setOpenDropdown(null)}
            />
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
                    <div className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-navy text-xs font-bold">
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
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-900 font-medium truncate">
                          {session.user.name || 'Traveler'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {session.user.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-sky-600 transition"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition"
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
                  className="bg-sky-400 hover:bg-sky-300 text-navy font-semibold px-4 py-1.5 rounded-full text-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-3">
          {status !== 'loading' && !session?.user && (
            <Link
              href="/login"
              className="text-sky-400 text-sm font-medium"
            >
              Log In
            </Link>
          )}
          {session?.user && (
            <Link href="/dashboard" className="flex items-center">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center text-navy text-xs font-bold">
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
        <div className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4">
          <div className="flex flex-col space-y-1">
            {navCategories.map((cat) => (
              <MobileCategory
                key={cat.label}
                category={cat}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            ))}

            {/* Mobile auth links */}
            <div className="border-t border-white/10 pt-3 mt-2">
              {session?.user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-white hover:bg-white/[0.04] rounded-lg transition"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="block w-full text-left px-4 py-2 text-red-400 hover:bg-white/[0.04] rounded-lg transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-white hover:bg-white/[0.04] rounded-lg transition"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sky-400 font-semibold hover:bg-white/[0.04] rounded-lg transition"
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
