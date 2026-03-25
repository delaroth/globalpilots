'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import SocialProof from '@/components/SocialProof'
import { useCurrency } from '@/hooks/useCurrency'

// Static fallback destinations
const staticDestinations = [
  { name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', dailyCost: 40 },
  { name: 'Lisbon', country: 'Portugal', flag: '🇵🇹', dailyCost: 70 },
  { name: 'Bali', country: 'Indonesia', flag: '🇮🇩', dailyCost: 35 },
  { name: 'Budapest', country: 'Hungary', flag: '🇭🇺', dailyCost: 50 },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', dailyCost: 80 },
  { name: 'Medellin', country: 'Colombia', flag: '🇨🇴', dailyCost: 35 },
]

export default function Home() {
  const currency = useCurrency()
  const [trending, setTrending] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Use user's saved origin airport if available, otherwise API defaults to BKK
    const savedOrigin = typeof window !== 'undefined' ? localStorage.getItem('gp_origin') : null
    let originParam = ''
    if (savedOrigin) {
      try {
        const parsed = JSON.parse(savedOrigin)
        if (parsed?.code) originParam = `?origin=${parsed.code}`
      } catch {
        if (/^[A-Z]{3}$/.test(savedOrigin)) originParam = `?origin=${savedOrigin}`
      }
    }

    fetch(`/api/inspire${originParam}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.destinations?.length > 0) setTrending(data.destinations.slice(0, 8))
        else setTrending(staticDestinations as any[])
      })
      .catch(() => setTrending(staticDestinations as any[]))
  }, [])

  return (
    <main className="min-h-screen flex flex-col bg-slate-950">
      <Navigation />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-[50vh] md:w-[800px] md:h-[600px] rounded-full blur-3xl bg-sky-600/[0.06]" />

        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-5">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400">
              Budget In. Adventure Out.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-4">
            AI-powered trip planning with live flight prices, total cost breakdowns, and destinations you&apos;d never think of.
          </p>
          <p className="text-sm text-slate-500 mb-6 md:mb-12">
            200+ destinations · 30 currencies · Live Google Flights data
          </p>

          {/* Mobile hero CTA — above the fold */}
          <div className="md:hidden mb-8">
            <Link
              href="/mystery"
              className="inline-block w-full text-center py-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold text-lg shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
            >
              Plan My Trip &rarr;
            </Link>
          </div>

          {/* ── Trust Bar ── */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-slate-400 mb-10">
            <span className="flex items-center gap-1.5">🔒 100% Free</span>
            <span className="flex items-center gap-1.5">✈️ Powered by Google Flights</span>
            <span className="flex items-center gap-1.5">💳 No Payment Info Collected</span>
            <span className="flex items-center gap-1.5">🛡️ No Hidden Fees</span>
          </div>

          {/* ── 3 Feature Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">

            {/* Card 1: AI Trip Planner */}
            <Link href="/mystery" className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-sky-500/20 transition-all duration-300">
              <div className="text-3xl mb-4">✨</div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition">
                AI Trip Planner
              </h2>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Set your budget and vibe — AI finds the perfect destination, plans your itinerary, and shows live flight prices. Or pick your own destination and let AI plan the rest.
              </p>
              <span className="text-sky-400 text-sm font-medium group-hover:translate-x-1 inline-block transition-transform">
                Start planning →
              </span>
            </Link>

            {/* Card 2: Flight Search */}
            <Link href="/search" className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-sky-500/20 transition-all duration-300">
              <div className="text-3xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition">
                Smart Flight Search
              </h2>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Real-time prices from Google Flights. Flexible dates, price calendar, nearby airport comparison, and one-way vs round-trip cost checks — all built to save you money.
              </p>
              <span className="text-sky-400 text-sm font-medium group-hover:translate-x-1 inline-block transition-transform">
                Search flights →
              </span>
            </Link>

            {/* Card 3: Deals */}
            <Link href="/deals" className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-sky-500/20 transition-all duration-300">
              <div className="text-3xl mb-4">🏷️</div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition">
                Today&apos;s Deals
              </h2>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                The cheapest flights from your airport right now, ranked by total trip cost — not just the flight. See which destinations give you the most value for your budget.
              </p>
              <span className="text-sky-400 text-sm font-medium group-hover:translate-x-1 inline-block transition-transform">
                View deals →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
        <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xl flex items-center justify-center mx-auto mb-4">1</div>
            <h3 className="text-lg font-semibold text-white mb-2">Set Your Budget & Vibe</h3>
            <p className="text-sm text-slate-400">Tell us how much you want to spend and what kind of trip you&apos;re after — beach, city, adventure, food, or anything else.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xl flex items-center justify-center mx-auto mb-4">2</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Picks Your Destination</h3>
            <p className="text-sm text-slate-400">Our AI searches real flight prices, checks visa requirements, and finds a destination that fits your budget perfectly.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xl flex items-center justify-center mx-auto mb-4">3</div>
            <h3 className="text-lg font-semibold text-white mb-2">Book & Go</h3>
            <p className="text-sm text-slate-400">Get a full daily itinerary, hotel links, cost breakdown, and booking links. You book directly — we never handle your payment.</p>
          </div>
        </div>
      </section>

      {/* ── Trending Destinations ── */}
      {trending.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Trending Destinations</h2>
            <Link href="/inspire" className="text-sm text-sky-400 hover:text-sky-300 transition">
              See all →
            </Link>
          </div>
          <div className="relative">
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {trending.map((dest, i) => (
                <Link
                  key={dest.airportCode || dest.name}
                  href={`/mystery?dest=${dest.airportCode || ''}`}
                  className="flex-shrink-0 w-44 bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.07] hover:border-sky-500/20 transition-all group"
                >
                  <p className="text-lg mb-1">{dest.flag || '🌍'}</p>
                  <p className="text-white font-semibold text-sm group-hover:text-sky-400 transition">{dest.name}</p>
                  <p className="text-slate-500 text-xs">{dest.country}</p>
                  {(dest.flightPrice || dest.dailyCost) && (
                    <p className="text-sky-400 text-xs mt-2 font-medium">
                      {dest.flightPrice ? `From ${currency.format(dest.flightPrice)}` : `~${currency.format(dest.dailyCost)}/day`}
                    </p>
                  )}
                </Link>
              ))}
            </div>
            {/* Fade hint on right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none lg:hidden" />
          </div>
        </section>
      )}

      {/* ── Value Props ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto text-xl">🎲</div>
            <h3 className="text-white font-bold">Destinations You&apos;d Never Think Of</h3>
            <p className="text-slate-500 text-sm">AI picks from 50+ live-priced destinations matched to your vibe and budget</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto text-xl">💰</div>
            <h3 className="text-white font-bold">Total Trip Cost, Not Just Flights</h3>
            <p className="text-slate-500 text-sm">Flights + hotels + food + activities — know the real price before you book</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto text-xl">🗺️</div>
            <h3 className="text-white font-bold">Turn Layovers Into Free Vacations</h3>
            <p className="text-slate-500 text-sm">Add a visa-free stopover city to your route and actually save money</p>
          </div>
        </div>
      </section>

      {/* ── Why GlobePilots? ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Why GlobePilots?</h2>
        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
          Google Flights shows flight prices. We show your total trip cost — flights + hotels + food + activities — so you know the real price before you book.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-sm">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white font-medium mb-1">Google Flights</p>
            <p className="text-slate-500">Shows flight prices only</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white font-medium mb-1">Skyscanner / Kayak</p>
            <p className="text-slate-500">Compares flight prices across airlines</p>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
            <p className="text-sky-400 font-medium mb-1">GlobePilots</p>
            <p className="text-slate-300">Total trip cost + AI destination picking + visa checks + stopover savings + 30 currencies</p>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
        <SocialProof />
      </section>

      {/* Extra bottom padding on mobile for sticky CTA */}
      <div className="pb-16 lg:pb-0" />

      <Footer />

      {/* ── Mobile Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/95 backdrop-blur border-t border-white/10 lg:hidden">
        <Link
          href="/mystery"
          className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
        >
          Plan My Trip →
        </Link>
      </div>
    </main>
  )
}
