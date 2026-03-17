import { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { majorAirports } from '@/lib/geolocation'

function slugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export const metadata: Metadata = {
  title: 'Cheapest Flights from Every City 2026 | GlobePilot',
  description:
    'Find cheap flights from your city. Browse departure airports worldwide and discover the best budget destinations from each origin.',
  keywords: [
    'cheap flights from',
    'flights from my city',
    'cheapest flights by origin',
    'budget flights departure',
    'flight deals 2026',
  ],
  openGraph: {
    title: 'Cheapest Flights from Every City 2026 | GlobePilot',
    description:
      'Find cheap flights from your city. Browse departure airports worldwide and discover the best budget destinations.',
    url: 'https://globepilots.com/flights-from',
    type: 'website',
  },
}

// Group airports by region
function groupByRegion() {
  const groups: Record<string, typeof majorAirports> = {}
  for (const airport of majorAirports) {
    if (!groups[airport.region]) groups[airport.region] = []
    groups[airport.region].push(airport)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export default function FlightsFromIndexPage() {
  const regionGroups = groupByRegion()

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Cheapest Flights from{' '}
            <span className="text-skyblue">Your City</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Select your departure city to discover the cheapest destinations you can fly to,
            with daily cost breakdowns and budget tips.
          </p>
        </div>
      </section>

      {/* Airports by Region */}
      {regionGroups.map(([region, airports]) => (
        <section key={region} className="px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              {region}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {airports.map((airport) => (
                <Link
                  key={airport.code}
                  href={`/flights-from/${slugify(airport.city)}`}
                  className="group bg-white/[0.04] border border-white/10 hover:border-skyblue/40 rounded-xl p-4 transition-all hover:bg-white/[0.06]"
                >
                  <h3 className="text-white font-medium group-hover:text-skyblue transition text-sm truncate">
                    {airport.city}
                  </h3>
                  <p className="text-white/40 text-xs mt-1">
                    {airport.code} &middot; {airport.country}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section className="px-6 py-16 bg-gradient-to-br from-skyblue/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Don&apos;t See Your City?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Search flights from any airport in the world with our flight search tool.
          </p>
          <Link
            href="/search"
            className="bg-skyblue text-navy font-bold py-3 px-8 rounded-full hover:bg-skyblue-light transition transform hover:scale-105"
          >
            Search All Flights
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
