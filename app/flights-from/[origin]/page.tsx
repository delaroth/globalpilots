import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import {
  getAllDestinations,
  type DestinationCost,
  type DailyCosts,
} from '@/lib/destination-costs'
import { majorAirports } from '@/lib/geolocation'

function slugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function destSlugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function dailyTotal(costs: DailyCosts): number {
  return costs.hotel + costs.food + costs.transport + costs.activities
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Region proximity mapping for sorting destinations from a given origin
const regionProximity: Record<string, string[]> = {
  'North America': ['Americas', 'Europe', 'East Asia', 'Southeast Asia', 'Oceania', 'Middle East', 'South Asia', 'Africa', 'Caucasus'],
  'Europe': ['Europe', 'Caucasus', 'Middle East', 'Africa', 'South Asia', 'East Asia', 'Southeast Asia', 'Americas', 'Oceania'],
  'Southeast Asia': ['Southeast Asia', 'East Asia', 'South Asia', 'Oceania', 'Middle East', 'Caucasus', 'Europe', 'Africa', 'Americas'],
  'East Asia': ['East Asia', 'Southeast Asia', 'South Asia', 'Oceania', 'Middle East', 'Caucasus', 'Europe', 'Africa', 'Americas'],
  'South Asia': ['South Asia', 'Southeast Asia', 'Middle East', 'East Asia', 'Caucasus', 'Europe', 'Africa', 'Oceania', 'Americas'],
  'Middle East': ['Middle East', 'Caucasus', 'South Asia', 'Europe', 'Africa', 'Southeast Asia', 'East Asia', 'Oceania', 'Americas'],
  'South America': ['Americas', 'Europe', 'Africa', 'Middle East', 'Southeast Asia', 'East Asia', 'Oceania', 'South Asia', 'Caucasus'],
  'Central America': ['Americas', 'Europe', 'Africa', 'Middle East', 'Southeast Asia', 'East Asia', 'Oceania', 'South Asia', 'Caucasus'],
  'Africa': ['Africa', 'Middle East', 'Europe', 'Caucasus', 'South Asia', 'Southeast Asia', 'East Asia', 'Oceania', 'Americas'],
  'Oceania': ['Oceania', 'Southeast Asia', 'East Asia', 'South Asia', 'Middle East', 'Europe', 'Africa', 'Americas', 'Caucasus'],
  'Caucasus': ['Caucasus', 'Middle East', 'Europe', 'South Asia', 'East Asia', 'Africa', 'Southeast Asia', 'Oceania', 'Americas'],
}

// Major origin airports for static generation (top 40 busiest airports with good coverage)
const originAirports = majorAirports
  .filter((a) =>
    [
      'ATL', 'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS',
      'LHR', 'CDG', 'AMS', 'FRA', 'BCN', 'MAD', 'FCO', 'LIS',
      'BKK', 'SIN', 'HKG', 'NRT', 'ICN', 'TPE', 'KUL', 'CGK',
      'DXB', 'DOH', 'IST',
      'SYD', 'MEL',
      'DEL', 'BOM',
      'GRU', 'EZE', 'BOG', 'LIM', 'SCL', 'MEX',
      'YYZ', 'YVR',
    ].includes(a.code)
  )

function findAirportBySlug(slug: string) {
  return majorAirports.find((a) => slugify(a.city) === slug)
}

export async function generateStaticParams() {
  return originAirports.map((a) => ({
    origin: slugify(a.city),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ origin: string }>
}): Promise<Metadata> {
  const { origin } = await params
  const airport = findAirportBySlug(origin)
  if (!airport) return { title: 'Not Found' }

  const title = `Cheapest Flights from ${airport.city} 2026 | GlobePilot`
  const description = `Find the cheapest flights from ${airport.city} (${airport.code}). Browse top budget destinations, compare daily travel costs, and plan your next trip.`

  return {
    title,
    description,
    keywords: [
      `cheap flights from ${airport.city}`,
      `flights from ${airport.code}`,
      `${airport.city} flight deals`,
      `cheapest destinations from ${airport.city}`,
    ],
    openGraph: {
      title,
      description,
      url: `https://globepilots.com/flights-from/${origin}`,
      type: 'website',
    },
  }
}

export default async function FlightsFromOriginPage({
  params,
}: {
  params: Promise<{ origin: string }>
}) {
  const { origin } = await params
  const airport = findAirportBySlug(origin)
  if (!airport) notFound()

  const allDestinations = getAllDestinations()

  // Sort by region proximity, then by budget cost
  const proximity = regionProximity[airport.region] || Object.keys(regionProximity)[0]
  const sorted = [...allDestinations].sort((a, b) => {
    const aRegionIdx = proximity.indexOf(a.region)
    const bRegionIdx = proximity.indexOf(b.region)
    if (aRegionIdx !== bRegionIdx) return aRegionIdx - bRegionIdx
    return dailyTotal(a.dailyCosts.budget) - dailyTotal(b.dailyCosts.budget)
  })

  // Top 20 destinations
  const topDestinations = sorted.slice(0, 20)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://globepilots.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Flights From',
        item: 'https://globepilots.com/flights-from',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Flights from ${airport.city}`,
        item: `https://globepilots.com/flights-from/${origin}`,
      },
    ],
  }

  return (
    <main className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navigation />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-skyblue font-medium mb-2 tracking-wide uppercase text-sm">
            {airport.country} &middot; {airport.code}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Cheapest Flights from{' '}
            <span className="text-skyblue">{airport.city}</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Discover the best budget destinations you can fly to from {airport.city} ({airport.code}).
            Sorted by proximity and daily travel cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/deals?origin=${airport.code}`}
              className="bg-skyblue text-navy font-bold py-3 px-8 rounded-full hover:bg-skyblue-light transition transform hover:scale-105"
            >
              See Live Deals from {airport.code}
            </Link>
            <Link
              href={`/search?origin=${airport.code}`}
              className="border-2 border-skyblue text-skyblue font-bold py-3 px-8 rounded-full hover:bg-skyblue/10 transition transform hover:scale-105"
            >
              Search Flights from {airport.code}
            </Link>
          </div>
        </div>
      </section>

      {/* Top Destinations */}
      <section className="px-6 py-16 bg-navy-light/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Top {topDestinations.length} Budget Destinations from {airport.city}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topDestinations.map((dest, i) => {
              const budget = dailyTotal(dest.dailyCosts.budget)
              const mid = dailyTotal(dest.dailyCosts.mid)
              return (
                <Link
                  key={dest.code}
                  href={`/cheap-flights/${destSlugify(dest.city)}`}
                  className="group flex items-center gap-4 bg-white/[0.04] border border-white/10 hover:border-skyblue/40 rounded-xl p-5 transition-all hover:bg-white/[0.06]"
                >
                  <div className="w-10 h-10 bg-skyblue/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-skyblue font-bold text-sm">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold group-hover:text-skyblue transition truncate">
                        {dest.city}
                      </h3>
                      <span className="text-xs text-white/40 font-mono">{dest.code}</span>
                    </div>
                    <p className="text-white/50 text-sm">
                      {dest.country} &middot; {dest.region}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-skyblue font-bold text-lg">${budget}</p>
                    <p className="text-white/40 text-xs">budget/day</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* All Destinations Table */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            All Destinations from {airport.city}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Destination</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Region</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Budget/Day</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Mid/Day</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Best Months</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((dest) => {
                  const budget = dailyTotal(dest.dailyCosts.budget)
                  const mid = dailyTotal(dest.dailyCosts.mid)
                  return (
                    <tr key={dest.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <Link
                          href={`/cheap-flights/${destSlugify(dest.city)}`}
                          className="text-white hover:text-skyblue font-medium transition"
                        >
                          {dest.city}, {dest.country}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-white/60 text-sm">{dest.region}</td>
                      <td className="py-3 px-4 text-skyblue font-medium">${budget}</td>
                      <td className="py-3 px-4 text-white/70">${mid}</td>
                      <td className="py-3 px-4 text-white/50 text-sm">
                        {dest.bestMonths.map((m) => monthNames[m - 1].slice(0, 3)).join(', ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Mystery CTA */}
      <section className="px-6 py-16 bg-gradient-to-br from-skyblue/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Mystery Vacation from {airport.city}
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Set your budget and departure from {airport.code} — we will surprise you with the perfect destination.
          </p>
          <Link
            href={`/mystery?origin=${airport.code}`}
            className="bg-skyblue text-navy font-bold py-3 px-8 rounded-full hover:bg-skyblue-light transition transform hover:scale-105"
          >
            Start Mystery Vacation from {airport.city}
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
