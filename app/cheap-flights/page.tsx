import { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getAllDestinations, getAllRegions, getDestinationsByRegion, type DailyCosts } from '@/lib/destination-costs'

function slugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function dailyTotal(costs: DailyCosts): number {
  return costs.hotel + costs.food + costs.transport + costs.activities
}

function regionSlug(region: string): string {
  return region.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export const metadata: Metadata = {
  title: 'Cheap Flights to Every Destination 2026 | GlobePilot',
  description:
    'Find cheap flights to 60+ destinations worldwide. Compare prices, see daily travel costs, and get budget tips for every destination.',
  keywords: [
    'cheap flights',
    'budget flights',
    'flight deals',
    'cheap airfare',
    'budget travel destinations',
    'cheapest flights 2026',
  ],
  openGraph: {
    title: 'Cheap Flights to Every Destination 2026 | GlobePilot',
    description:
      'Find cheap flights to 60+ destinations worldwide. Compare prices, see daily travel costs, and get budget tips.',
    url: 'https://globepilots.com/cheap-flights',
    type: 'website',
  },
}

export default function CheapFlightsIndexPage() {
  const regions = getAllRegions()

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Cheap Flights to{' '}
            <span className="text-sky-400">Every Destination</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Browse 60+ destinations with daily cost breakdowns, money-saving tips,
            and the best months to fly. Find your next adventure on a budget.
          </p>
        </div>
      </section>

      {/* Destinations by Region */}
      {regions.map((region) => {
        const destinations = getDestinationsByRegion(region)
        const sorted = [...destinations].sort(
          (a, b) => dailyTotal(a.dailyCosts.budget) - dailyTotal(b.dailyCosts.budget)
        )

        return (
          <section key={region} className="px-6 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {region}
                </h2>
                <Link
                  href={`/budget-travel/${regionSlug(region)}`}
                  className="text-sky-400 text-sm hover:underline"
                >
                  View {region} guide &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sorted.map((dest) => {
                  const budget = dailyTotal(dest.dailyCosts.budget)
                  return (
                    <Link
                      key={dest.code}
                      href={`/cheap-flights/${slugify(dest.city)}`}
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
                      <p className="text-sky-400 font-bold text-lg">
                        ${budget}<span className="text-sm font-normal text-white/50">/day</span>
                      </p>
                      <p className="text-white/40 text-xs mt-1">Budget tier</p>
                    </Link>
                  )
                })}
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
            Let our Mystery Vacation tool surprise you with a destination that fits your budget.
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
