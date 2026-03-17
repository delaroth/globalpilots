import Link from 'next/link'
import { notFound } from 'next/navigation'
import { majorAirports } from '@/lib/geolocation'
import { getAllDestinations } from '@/lib/destination-costs'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// ─── Country flag emoji map ───
const countryFlags: Record<string, string> = {
  'Thailand': '\u{1F1F9}\u{1F1ED}',
  'Indonesia': '\u{1F1EE}\u{1F1E9}',
  'Japan': '\u{1F1EF}\u{1F1F5}',
  'South Korea': '\u{1F1F0}\u{1F1F7}',
  'China': '\u{1F1E8}\u{1F1F3}',
  'Hong Kong': '\u{1F1ED}\u{1F1F0}',
  'Taiwan': '\u{1F1F9}\u{1F1FC}',
  'Singapore': '\u{1F1F8}\u{1F1EC}',
  'Malaysia': '\u{1F1F2}\u{1F1FE}',
  'Vietnam': '\u{1F1FB}\u{1F1F3}',
  'Philippines': '\u{1F1F5}\u{1F1ED}',
  'Cambodia': '\u{1F1F0}\u{1F1ED}',
  'Laos': '\u{1F1F1}\u{1F1E6}',
  'India': '\u{1F1EE}\u{1F1F3}',
  'Sri Lanka': '\u{1F1F1}\u{1F1F0}',
  'Nepal': '\u{1F1F3}\u{1F1F5}',
  'UAE': '\u{1F1E6}\u{1F1EA}',
  'Turkey': '\u{1F1F9}\u{1F1F7}',
  'Qatar': '\u{1F1F6}\u{1F1E6}',
  'Israel': '\u{1F1EE}\u{1F1F1}',
  'Jordan': '\u{1F1EF}\u{1F1F4}',
  'Egypt': '\u{1F1EA}\u{1F1EC}',
  'UK': '\u{1F1EC}\u{1F1E7}',
  'France': '\u{1F1EB}\u{1F1F7}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}',
  'Spain': '\u{1F1EA}\u{1F1F8}',
  'Portugal': '\u{1F1F5}\u{1F1F9}',
  'Italy': '\u{1F1EE}\u{1F1F9}',
  'Germany': '\u{1F1E9}\u{1F1EA}',
  'Austria': '\u{1F1E6}\u{1F1F9}',
  'Czech Republic': '\u{1F1E8}\u{1F1FF}',
  'Hungary': '\u{1F1ED}\u{1F1FA}',
  'Poland': '\u{1F1F5}\u{1F1F1}',
  'Greece': '\u{1F1EC}\u{1F1F7}',
  'Ireland': '\u{1F1EE}\u{1F1EA}',
  'Denmark': '\u{1F1E9}\u{1F1F0}',
  'USA': '\u{1F1FA}\u{1F1F8}',
  'Mexico': '\u{1F1F2}\u{1F1FD}',
  'Colombia': '\u{1F1E8}\u{1F1F4}',
  'Peru': '\u{1F1F5}\u{1F1EA}',
  'Argentina': '\u{1F1E6}\u{1F1F7}',
  'Brazil': '\u{1F1E7}\u{1F1F7}',
  'Chile': '\u{1F1E8}\u{1F1F1}',
  'Panama': '\u{1F1F5}\u{1F1E6}',
  'Costa Rica': '\u{1F1E8}\u{1F1F7}',
  'Morocco': '\u{1F1F2}\u{1F1E6}',
  'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Kenya': '\u{1F1F0}\u{1F1EA}',
  'Senegal': '\u{1F1F8}\u{1F1F3}',
  'Georgia': '\u{1F1EC}\u{1F1EA}',
  'Australia': '\u{1F1E6}\u{1F1FA}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
}

function getFlag(country: string): string {
  return countryFlags[country] ?? '\u{1F30D}'
}

// ─── Static generation for all airports ───
export function generateStaticParams() {
  return majorAirports.map(airport => ({
    from: airport.code,
  }))
}

export default async function MysteryFlightsFromPage({ params }: { params: Promise<{ from: string }> }) {
  const { from } = await params
  const code = from.toUpperCase()
  const airport = majorAirports.find(a => a.code === code)

  if (!airport) {
    notFound()
  }

  const allDestinations = getAllDestinations()

  // Pick 12 diverse destinations: shuffle by region, then take top 12
  const shuffled = [...allDestinations].sort(() => {
    // Deterministic sort based on airport code + destination code for stable builds
    return 0
  })

  // Group by region and pick evenly
  const regionMap: Record<string, typeof allDestinations> = {}
  for (const dest of allDestinations) {
    if (!regionMap[dest.region]) regionMap[dest.region] = []
    regionMap[dest.region].push(dest)
  }
  const regions = Object.keys(regionMap)
  const selected: typeof allDestinations = []
  let regionIndex = 0
  const regionPointers: Record<string, number> = {}
  regions.forEach(r => { regionPointers[r] = 0 })

  // Seed the pick order deterministically based on airport code
  const seed = code.charCodeAt(0) + code.charCodeAt(1) + (code.charCodeAt(2) ?? 0)
  const sortedRegions = [...regions].sort((a, b) => {
    const ha = (a.charCodeAt(0) * 31 + seed) % 100
    const hb = (b.charCodeAt(0) * 31 + seed) % 100
    return ha - hb
  })

  while (selected.length < 12) {
    const region = sortedRegions[regionIndex % sortedRegions.length]
    const pool = regionMap[region]
    const ptr = regionPointers[region]
    if (ptr < pool.length) {
      // Offset within region based on seed
      const idx = (ptr + seed) % pool.length
      const dest = pool[idx]
      if (!selected.find(s => s.code === dest.code)) {
        selected.push(dest)
      }
      regionPointers[region] = ptr + 1
    }
    regionIndex++
    // Safety: break if we've cycled too many times
    if (regionIndex > allDestinations.length * 2) break
  }

  const destinationCards = selected.slice(0, 12)

  // Compute daily budget costs
  const cards = destinationCards.map(dest => {
    const budgetDaily = dest.dailyCosts.budget
    const dailyTotal = budgetDaily.hotel + budgetDaily.food + budgetDaily.transport + budgetDaily.activities
    return { ...dest, dailyTotal }
  })

  // Month name helper
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // FAQ data
  const faqs = [
    {
      q: `What is a mystery flight from ${airport.city}?`,
      a: `A mystery flight from ${airport.city} (${code}) is a surprise vacation where our AI selects the perfect destination for you based on your budget and travel preferences. You set your budget, pick a vibe, and we handle the rest -- revealing a hand-picked destination with daily cost breakdowns, itinerary ideas, and booking links.`,
    },
    {
      q: `How much does a mystery trip from ${airport.city} cost?`,
      a: `Mystery trips from ${airport.city} can fit any budget. Budget travellers can find destinations from as low as $19/day (excluding flights), while mid-range options run $50-100/day. Our tool is completely free to use -- you only pay for the flights and accommodation you choose to book.`,
    },
    {
      q: `Can I choose my travel dates for a mystery flight from ${code}?`,
      a: `Yes! You can either pick a specific departure date or choose a flexible timeframe (this month, next 3 months, anytime). Flexible dates often unlock cheaper flight deals from ${airport.city}.`,
    },
    {
      q: `What destinations can I fly to from ${airport.city}?`,
      a: `Our AI considers 60+ destinations worldwide across Southeast Asia, East Asia, Europe, the Americas, the Middle East, Africa, and Oceania. The specific destinations available depend on your budget, travel dates, and vibe preferences.`,
    },
    {
      q: `Is my mystery destination really a surprise?`,
      a: `Absolutely! The destination is hidden until you hit "Surprise Me." If you don't love the result, you can re-roll up to 3 times for free. Each reveal includes cost breakdowns, top tips, and direct booking links.`,
    },
  ]

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Mystery Flights from ${airport.city} (${code})`,
    description: `Discover surprise vacation deals from ${airport.city}. Our AI picks the perfect mystery destination within your budget.`,
    url: `https://globepilots.com/mystery-flights/${code}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: cards.length,
      itemListElement: cards.map((card, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: `${card.city}, ${card.country}`,
        description: `Mystery destination from ${airport.city}: ${card.city}, ${card.country} - from $${card.dailyTotal}/day`,
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
              Surprise Vacation Deals
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Mystery Flights from{' '}
              <span className="text-sky-400">{airport.city}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Set your budget, pick a vibe, and let our AI reveal the perfect surprise destination from {airport.city} ({code}). Completely free to use.
            </p>
            <Link
              href={`/mystery?origin=${code}`}
              className="inline-block bg-sky-500 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-sky-500-light transition transform hover:scale-105 shadow-lg"
            >
              Start Your Mystery Trip
            </Link>
          </div>
        </section>

        {/* Destination Cards Grid */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
              Where Could You End Up?
            </h2>
            <p className="text-white/60 text-center mb-10 max-w-xl mx-auto">
              Here are some of the surprise destinations our AI might pick for you. Each includes daily cost breakdowns so you can budget with confidence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map(card => (
                <div
                  key={card.code}
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-sky-500/30 transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition">
                        {getFlag(card.country)} {card.city}
                      </h3>
                      <p className="text-white/50 text-sm">{card.country}</p>
                    </div>
                    <span className="bg-sky-500/10 text-sky-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {card.region}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sky-300 text-2xl font-bold">
                      from ${card.dailyTotal}<span className="text-sm font-normal text-white/50">/day</span>
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      Budget tier: ${card.dailyCosts.budget.hotel} hotel + ${card.dailyCosts.budget.food} food + ${card.dailyCosts.budget.transport} transport + ${card.dailyCosts.budget.activities} activities
                    </p>
                  </div>

                  <div className="mb-5">
                    <p className="text-white/50 text-xs">
                      Best months: {card.bestMonths.map(m => monthNames[m - 1]).join(', ')}
                    </p>
                  </div>

                  <Link
                    href={`/mystery?origin=${code}`}
                    className="block w-full text-center bg-sky-500 text-slate-900 font-bold py-2.5 rounded-xl hover:bg-sky-500-light transition text-sm"
                  >
                    Reveal This Mystery
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
              How Mystery Flights Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Set Your Budget',
                  desc: `Tell us your total budget for the trip from ${airport.city}. Our AI works with any amount.`,
                },
                {
                  step: '2',
                  title: 'Pick Your Vibe',
                  desc: 'Beach, city break, adventure, food & culture, or nature -- choose what excites you.',
                },
                {
                  step: '3',
                  title: 'Get Surprised',
                  desc: 'Our AI reveals a hand-picked destination with cost breakdowns, itinerary ideas, and booking links.',
                },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-sky-500 text-slate-900 font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready for a Surprise?
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Join thousands of travelers who have discovered unexpected destinations from {airport.city}. Your next adventure is one click away.
            </p>
            <Link
              href={`/mystery?origin=${code}`}
              className="inline-block bg-sky-500 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-sky-500-light transition transform hover:scale-105 shadow-lg"
            >
              Surprise Me from {airport.city}
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                  <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Airports */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-white mb-6">
              Mystery Flights from Other Airports
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {majorAirports
                .filter(a => a.code !== code)
                .slice(0, 30)
                .map(a => (
                  <Link
                    key={a.code}
                    href={`/mystery-flights/${a.code}`}
                    className="text-sky-300 hover:text-sky-400 text-sm px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/5 hover:border-sky-500/20 transition"
                  >
                    {a.city} ({a.code})
                  </Link>
                ))}
              <Link
                href="/mystery-flights"
                className="text-sky-400 font-semibold text-sm px-3 py-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20 hover:bg-sky-500/20 transition"
              >
                View All Airports
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
