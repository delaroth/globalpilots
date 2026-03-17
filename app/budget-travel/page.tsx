import { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import {
  getAllRegions,
  getDestinationsByRegion,
  type DailyCosts,
} from '@/lib/destination-costs'

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function dailyTotal(costs: DailyCosts): number {
  return costs.hotel + costs.food + costs.transport + costs.activities
}

export const metadata: Metadata = {
  title: 'Best Budget Travel Destinations by Region 2026 | GlobePilot',
  description:
    'Compare budget travel destinations across every region. Find the cheapest places to visit in Southeast Asia, Europe, South America, and more.',
  keywords: [
    'budget travel destinations',
    'cheapest places to travel',
    'budget travel by region',
    'backpacking destinations',
    'cheap travel 2026',
    'travel on a budget',
  ],
  openGraph: {
    title: 'Best Budget Travel Destinations by Region 2026 | GlobePilot',
    description:
      'Compare budget travel destinations across every region. Find the cheapest places to visit worldwide.',
    url: 'https://globepilots.com/budget-travel',
    type: 'website',
  },
}

export default function BudgetTravelIndexPage() {
  const regions = getAllRegions()

  const regionStats = regions.map((region) => {
    const destinations = getDestinationsByRegion(region)
    const budgets = destinations.map((d) => dailyTotal(d.dailyCosts.budget))
    const cheapest = Math.min(...budgets)
    const avg = Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
    const cheapestDest = destinations.find(
      (d) => dailyTotal(d.dailyCosts.budget) === cheapest
    )
    return {
      region,
      slug: slugify(region),
      count: destinations.length,
      cheapest,
      avg,
      cheapestCity: cheapestDest?.city || '',
    }
  })

  // Sort by average budget cost
  regionStats.sort((a, b) => a.avg - b.avg)

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Budget Travel by{' '}
            <span className="text-sky-400">Region</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Explore {regions.length} regions worldwide, ranked by daily travel cost.
            Find the perfect budget-friendly destination for your next trip.
          </p>
        </div>
      </section>

      {/* Region Cards */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regionStats.map((stat, i) => (
            <Link
              key={stat.region}
              href={`/budget-travel/${stat.slug}`}
              className="group bg-white/[0.04] border border-white/10 hover:border-sky-400/40 rounded-2xl p-6 transition-all hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-medium">
                  #{i + 1} cheapest
                </span>
                <span className="text-white/40 text-sm">
                  {stat.count} destinations
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-sky-400 transition mb-3">
                {stat.region}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-white/40 text-xs">Cheapest</p>
                  <p className="text-sky-400 font-bold text-xl">${stat.cheapest}/day</p>
                  <p className="text-white/50 text-xs">{stat.cheapestCity}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Average</p>
                  <p className="text-white font-bold text-xl">${stat.avg}/day</p>
                  <p className="text-white/50 text-xs">budget tier</p>
                </div>
              </div>
              <p className="text-sky-400 text-sm group-hover:underline">
                Explore {stat.region} &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 bg-gradient-to-br from-sky-500/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Not Sure Where to Start?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Let our Mystery Vacation tool pick the perfect destination based on your budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mystery"
              className="bg-sky-500 text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-sky-500-light transition transform hover:scale-105"
            >
              Try Mystery Vacation
            </Link>
            <Link
              href="/cheap-flights"
              className="border-2 border-sky-400 text-sky-400 font-bold py-3 px-8 rounded-full hover:bg-sky-500/10 transition transform hover:scale-105"
            >
              Browse All Destinations
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
