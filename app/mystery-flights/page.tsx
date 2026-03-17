import type { Metadata } from 'next'
import Link from 'next/link'
import { majorAirports } from '@/lib/geolocation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Mystery Flights from Every Airport | Surprise Vacation Deals | GlobePilot',
  description: 'Browse mystery flight deals from 150+ airports worldwide. Our AI picks surprise destinations within your budget. Departures from the US, Europe, Asia, and more.',
  openGraph: {
    title: 'Mystery Flights from Every Airport | GlobePilot',
    description: 'Browse mystery flight deals from 150+ airports worldwide. Our AI picks surprise destinations within your budget.',
    type: 'website',
    siteName: 'GlobePilot',
    url: 'https://globepilots.com/mystery-flights',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mystery Flights from Every Airport | GlobePilot',
    description: 'Browse mystery flight deals from 150+ airports worldwide.',
  },
  alternates: {
    canonical: 'https://globepilots.com/mystery-flights',
  },
}

// Region display order and labels
const regionConfig: { key: string; label: string; description: string }[] = [
  { key: 'North America', label: 'North America', description: 'US, Canada & Mexico' },
  { key: 'Europe', label: 'Europe', description: 'UK, Western, Southern, Eastern & Nordic Europe' },
  { key: 'Asia', label: 'Asia', description: 'East, Southeast & South Asia' },
  { key: 'Middle East', label: 'Middle East', description: 'UAE, Qatar, Turkey, Israel & more' },
  { key: 'Oceania', label: 'Oceania', description: 'Australia & New Zealand' },
  { key: 'South America', label: 'South America', description: 'Brazil, Argentina, Chile & more' },
  { key: 'Central America', label: 'Central America', description: 'Costa Rica & Panama' },
  { key: 'Caribbean', label: 'Caribbean', description: 'Puerto Rico & Bahamas' },
  { key: 'Africa', label: 'Africa', description: 'South Africa, Kenya, Morocco & more' },
]

// Country flag map for airport cards
const countryFlags: Record<string, string> = {
  'USA': '\u{1F1FA}\u{1F1F8}',
  'Canada': '\u{1F1E8}\u{1F1E6}',
  'Mexico': '\u{1F1F2}\u{1F1FD}',
  'UK': '\u{1F1EC}\u{1F1E7}',
  'Ireland': '\u{1F1EE}\u{1F1EA}',
  'France': '\u{1F1EB}\u{1F1F7}',
  'Germany': '\u{1F1E9}\u{1F1EA}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}',
  'Belgium': '\u{1F1E7}\u{1F1EA}',
  'Switzerland': '\u{1F1E8}\u{1F1ED}',
  'Austria': '\u{1F1E6}\u{1F1F9}',
  'Spain': '\u{1F1EA}\u{1F1F8}',
  'Italy': '\u{1F1EE}\u{1F1F9}',
  'Portugal': '\u{1F1F5}\u{1F1F9}',
  'Greece': '\u{1F1EC}\u{1F1F7}',
  'Sweden': '\u{1F1F8}\u{1F1EA}',
  'Denmark': '\u{1F1E9}\u{1F1F0}',
  'Norway': '\u{1F1F3}\u{1F1F4}',
  'Finland': '\u{1F1EB}\u{1F1EE}',
  'Poland': '\u{1F1F5}\u{1F1F1}',
  'Czech Republic': '\u{1F1E8}\u{1F1FF}',
  'Hungary': '\u{1F1ED}\u{1F1FA}',
  'Romania': '\u{1F1F7}\u{1F1F4}',
  'Bulgaria': '\u{1F1E7}\u{1F1EC}',
  'Serbia': '\u{1F1F7}\u{1F1F8}',
  'Croatia': '\u{1F1ED}\u{1F1F7}',
  'Latvia': '\u{1F1F1}\u{1F1FB}',
  'Estonia': '\u{1F1EA}\u{1F1EA}',
  'Lithuania': '\u{1F1F1}\u{1F1F9}',
  'Turkey': '\u{1F1F9}\u{1F1F7}',
  'Japan': '\u{1F1EF}\u{1F1F5}',
  'South Korea': '\u{1F1F0}\u{1F1F7}',
  'China': '\u{1F1E8}\u{1F1F3}',
  'Hong Kong': '\u{1F1ED}\u{1F1F0}',
  'Macau': '\u{1F1F2}\u{1F1F4}',
  'Taiwan': '\u{1F1F9}\u{1F1FC}',
  'Singapore': '\u{1F1F8}\u{1F1EC}',
  'Thailand': '\u{1F1F9}\u{1F1ED}',
  'Malaysia': '\u{1F1F2}\u{1F1FE}',
  'Indonesia': '\u{1F1EE}\u{1F1E9}',
  'Philippines': '\u{1F1F5}\u{1F1ED}',
  'Vietnam': '\u{1F1FB}\u{1F1F3}',
  'Cambodia': '\u{1F1F0}\u{1F1ED}',
  'Laos': '\u{1F1F1}\u{1F1E6}',
  'India': '\u{1F1EE}\u{1F1F3}',
  'Pakistan': '\u{1F1F5}\u{1F1F0}',
  'Bangladesh': '\u{1F1E7}\u{1F1E9}',
  'Sri Lanka': '\u{1F1F1}\u{1F1F0}',
  'Nepal': '\u{1F1F3}\u{1F1F5}',
  'UAE': '\u{1F1E6}\u{1F1EA}',
  'Qatar': '\u{1F1F6}\u{1F1E6}',
  'Bahrain': '\u{1F1E7}\u{1F1ED}',
  'Kuwait': '\u{1F1F0}\u{1F1FC}',
  'Oman': '\u{1F1F4}\u{1F1F2}',
  'Jordan': '\u{1F1EF}\u{1F1F4}',
  'Israel': '\u{1F1EE}\u{1F1F1}',
  'Egypt': '\u{1F1EA}\u{1F1EC}',
  'Australia': '\u{1F1E6}\u{1F1FA}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
  'Brazil': '\u{1F1E7}\u{1F1F7}',
  'Argentina': '\u{1F1E6}\u{1F1F7}',
  'Chile': '\u{1F1E8}\u{1F1F1}',
  'Peru': '\u{1F1F5}\u{1F1EA}',
  'Colombia': '\u{1F1E8}\u{1F1F4}',
  'Panama': '\u{1F1F5}\u{1F1E6}',
  'Costa Rica': '\u{1F1E8}\u{1F1F7}',
  'Puerto Rico': '\u{1F1F5}\u{1F1F7}',
  'Bahamas': '\u{1F1E7}\u{1F1F8}',
  'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Kenya': '\u{1F1F0}\u{1F1EA}',
  'Nigeria': '\u{1F1F3}\u{1F1EC}',
  'Morocco': '\u{1F1F2}\u{1F1E6}',
}

function getFlag(country: string): string {
  return countryFlags[country] ?? '\u{1F30D}'
}

export default function MysteryFlightsIndexPage() {
  // Group airports by region
  const grouped: Record<string, typeof majorAirports> = {}
  for (const airport of majorAirports) {
    if (!grouped[airport.region]) grouped[airport.region] = []
    // Deduplicate by code (CAI appears in both Middle East and Africa)
    if (!grouped[airport.region].find(a => a.code === airport.code)) {
      grouped[airport.region].push(airport)
    }
  }

  const totalAirports = majorAirports.length

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mystery Flights from Every Airport',
    description: `Browse mystery flight deals from ${totalAirports}+ airports worldwide. AI-powered surprise vacation planning.`,
    url: 'https://globepilots.com/mystery-flights',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalAirports,
      itemListElement: majorAirports.slice(0, 50).map((airport, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: `Mystery Flights from ${airport.city} (${airport.code})`,
        url: `https://globepilots.com/mystery-flights/${airport.code}`,
      })),
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Navigation />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 md:py-24 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-sky-300 text-sm font-medium uppercase tracking-widest mb-4">
              {totalAirports}+ Departure Airports
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Mystery Flights from{' '}
              <span className="text-sky-400">Every Airport</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Find your departure airport and let our AI surprise you with the perfect vacation destination. Set your budget, pick a vibe, and go.
            </p>
            <Link
              href="/mystery"
              className="inline-block bg-sky-500 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-sky-500-light transition transform hover:scale-105 shadow-lg"
            >
              Start a Mystery Trip Now
            </Link>
          </div>
        </section>

        {/* Airport Grid by Region */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {regionConfig.map(regionInfo => {
              const airports = grouped[regionInfo.key]
              if (!airports || airports.length === 0) return null

              return (
                <div key={regionInfo.key} className="mb-12">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {regionInfo.label}
                    </h2>
                    <p className="text-white/50 text-sm mt-1">
                      {regionInfo.description} &middot; {airports.length} airport{airports.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {airports.map(airport => (
                      <Link
                        key={`${regionInfo.key}-${airport.code}`}
                        href={`/mystery-flights/${airport.code}`}
                        className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 hover:border-sky-500/30 hover:bg-white/[0.07] transition group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{getFlag(airport.country)}</span>
                          <span className="text-white font-semibold text-sm group-hover:text-sky-400 transition truncate">
                            {airport.city}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-xs">{airport.code}</span>
                          <span className="text-white/30 text-xs">{airport.country}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Don&apos;t See Your Airport?
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              No worries -- our mystery vacation tool supports any departure city. Just type in your airport and let our AI do the rest.
            </p>
            <Link
              href="/mystery"
              className="inline-block bg-sky-500 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-sky-500-light transition transform hover:scale-105 shadow-lg"
            >
              Start Your Mystery Trip
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
