import { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import {
  getAllDestinations,
  getAllRegions,
  getDestinationsByRegion,
} from '@/lib/destination-costs'

function slugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const monthAbbrev = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const metadata: Metadata = {
  title: 'Best Time to Visit Every Destination — Weather & Travel Guide | GlobePilots',
  description:
    'Find the best time to visit 120+ destinations worldwide. Month-by-month weather, shoulder season tips, and budget comparisons for every city.',
  keywords: [
    'best time to visit',
    'travel season guide',
    'when to travel',
    'best months to visit',
    'shoulder season travel',
    'weather travel guide',
  ],
  openGraph: {
    title: 'Best Time to Visit Every Destination | GlobePilots',
    description:
      'Month-by-month weather and travel guide for 120+ destinations. Find the perfect time for your next trip.',
    url: 'https://globepilots.com/best-time',
    type: 'website',
  },
  alternates: {
    canonical: 'https://globepilots.com/best-time',
  },
}

export default function BestTimeIndexPage() {
  const regions = getAllRegions()

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Best Time to Visit{' '}
            <span className="text-sky-400">Every Destination</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Month-by-month weather guides, shoulder season tips, and budget
            comparisons for 120+ cities worldwide.
          </p>
        </div>
      </section>

      {/* Destinations by Region */}
      {regions.map((region) => {
        const destinations = getDestinationsByRegion(region)
        const sorted = [...destinations].sort((a, b) =>
          a.city.localeCompare(b.city)
        )

        return (
          <section key={region} className="px-6 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                {region}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sorted.map((dest) => (
                  <Link
                    key={dest.code}
                    href={`/best-time/${slugify(dest.city)}`}
                    className="group bg-white/[0.04] border border-white/10 hover:border-sky-400/40 rounded-xl p-5 transition-all hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold group-hover:text-sky-400 transition">
                          {dest.city}
                        </h3>
                        <p className="text-white/50 text-sm">{dest.country}</p>
                      </div>
                      <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded font-mono">
                        {dest.code}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {dest.bestMonths.map((m) => (
                        <span
                          key={m}
                          className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium"
                        >
                          {monthAbbrev[m - 1]}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* Bottom CTA */}
      <section className="px-6 py-16 bg-gradient-to-br from-sky-500/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Not Sure Where to Go?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Let our Mystery Vacation tool surprise you with a destination that
            fits your budget and travel dates.
          </p>
          <Link
            href="/mystery"
            className="bg-sky-500 text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-sky-500-light transition transform hover:scale-105"
          >
            Try Mystery Vacation
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
