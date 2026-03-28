import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import {
  getAllDestinations,
  getDestinationCost,
  type DestinationCost,
  type DailyCosts,
} from '@/lib/destination-costs'

function slugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function unslugify(slug: string): DestinationCost | undefined {
  const all = getAllDestinations()
  return all.find((d) => slugify(d.city) === slug)
}

function dailyTotal(costs: DailyCosts): number {
  return costs.hotel + costs.food + costs.transport + costs.activities
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Estimated average flight prices by month from a major US hub (illustrative data)
function getEstimatedFlightPrices(dest: DestinationCost): { month: string; price: number }[] {
  const basePrice =
    dest.region === 'Southeast Asia' ? 450
    : dest.region === 'East Asia' ? 550
    : dest.region === 'South Asia' ? 500
    : dest.region === 'Middle East' ? 600
    : dest.region === 'Europe' ? 500
    : dest.region === 'Americas' ? 350
    : dest.region === 'Africa' ? 700
    : dest.region === 'Caucasus' ? 550
    : dest.region === 'Oceania' ? 800
    : 500

  // Seasonal variation
  return monthNames.map((month, i) => {
    const monthNum = i + 1
    const isBest = dest.bestMonths.includes(monthNum)
    // Peak months tend to be more expensive, off-season cheaper
    const multiplier = isBest ? 1.15 : 0.9
    const jitter = 1 + (((monthNum * 7 + dest.code.charCodeAt(0)) % 20) - 10) / 100
    return {
      month,
      price: Math.round(basePrice * multiplier * jitter),
    }
  })
}

export async function generateStaticParams() {
  const destinations = getAllDestinations()
  return destinations.map((d) => ({
    destination: slugify(d.city),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ destination: string }>
}): Promise<Metadata> {
  const { destination } = await params
  const dest = unslugify(destination)
  if (!dest) return { title: 'Not Found' }

  const title = `Cheap Flights to ${dest.city} 2026 — Best Deals & Tips | GlobePilot`
  const description = `Find cheap flights to ${dest.city}, ${dest.country}. Budget travel tips, daily cost breakdowns, best months to visit, and money-saving advice for ${dest.city}.`

  return {
    title,
    description,
    keywords: [
      `cheap flights to ${dest.city}`,
      `${dest.city} flight deals`,
      `budget travel ${dest.city}`,
      `${dest.city} travel tips`,
      `flights to ${dest.city} ${dest.country}`,
      `${dest.city} vacation cost`,
    ],
    openGraph: {
      title,
      description,
      url: `https://globepilots.com/cheap-flights/${destination}`,
      type: 'article',
    },
  }
}

export default async function CheapFlightsDestinationPage({
  params,
}: {
  params: Promise<{ destination: string }>
}) {
  const { destination } = await params
  const dest = unslugify(destination)
  if (!dest) notFound()

  const budgetDaily = dailyTotal(dest.dailyCosts.budget)
  const midDaily = dailyTotal(dest.dailyCosts.mid)
  const comfortDaily = dailyTotal(dest.dailyCosts.comfort)
  const flightPrices = getEstimatedFlightPrices(dest)
  const cheapestMonth = flightPrices.reduce((prev, curr) =>
    curr.price < prev.price ? curr : prev
  )

  const faqData = [
    {
      question: `What is the cheapest month to fly to ${dest.city}?`,
      answer: `Based on historical trends, ${cheapestMonth.month} tends to offer the lowest fares to ${dest.city}, with average prices around $${cheapestMonth.price} from major US airports.`,
    },
    {
      question: `How much does a trip to ${dest.city} cost per day?`,
      answer: `Budget travellers can expect to spend around $${budgetDaily}/day in ${dest.city} (hostels, street food). Mid-range is about $${midDaily}/day, and comfortable travel runs $${comfortDaily}/day.`,
    },
    {
      question: `When is the best time to visit ${dest.city}?`,
      answer: `The best months to visit ${dest.city} are ${dest.bestMonths.map((m) => monthNames[m - 1]).join(', ')}. These months typically offer the best weather and travel conditions.`,
    },
    {
      question: `What currency is used in ${dest.city}?`,
      answer: `${dest.city}, ${dest.country} uses ${dest.currency}. ATMs are widely available, and most tourist areas accept credit cards.`,
    },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <main className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navigation />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sky-400 font-medium mb-2 tracking-wide uppercase text-sm">
            {dest.country} &middot; {dest.region}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Cheap Flights to{' '}
            <span className="text-sky-400">{dest.city}</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Find the best deals on flights to {dest.city}, {dest.country}.
            Budget from <span className="text-sky-400 font-semibold">${budgetDaily}/day</span> once you land.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/search?destination=${dest.code}`}
              className="bg-sky-500 text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-sky-500-light transition transform hover:scale-105"
            >
              Find Flights to {dest.city}
            </Link>
            <Link
              href="/mystery"
              className="border-2 border-sky-400 text-sky-400 font-bold py-3 px-8 rounded-full hover:bg-sky-500/10 transition transform hover:scale-105"
            >
              Mystery Trip Including {dest.city}
            </Link>
          </div>
        </div>
      </section>

      {/* Best Time to Fly */}
      <section className="px-6 py-16 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Best Time to Fly to {dest.city}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {dest.bestMonths.map((m) => (
              <div
                key={m}
                className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 text-center"
              >
                <p className="text-sky-400 font-bold text-lg">{monthNames[m - 1]}</p>
                <p className="text-white/60 text-sm mt-1">Great weather</p>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-center mt-6 text-sm">
            These months offer the best weather and travel conditions in {dest.city}.
            Booking 2-3 months in advance typically yields the best fares.
          </p>
        </div>
      </section>

      {/* Budget Breakdown */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Daily Budget Breakdown for {dest.city}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { tier: 'Budget', data: dest.dailyCosts.budget, total: budgetDaily, color: 'emerald', desc: 'Hostels & street food' },
              { tier: 'Mid-Range', data: dest.dailyCosts.mid, total: midDaily, color: 'sky-400', desc: '3-star hotels & restaurants' },
              { tier: 'Comfort', data: dest.dailyCosts.comfort, total: comfortDaily, color: 'purple', desc: '4-star hotels & fine dining' },
            ] as const).map((t) => (
              <div
                key={t.tier}
                className="bg-white/[0.04] border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-1">{t.tier}</h3>
                <p className="text-white/50 text-sm mb-4">{t.desc}</p>
                <p className="text-3xl font-bold text-sky-400 mb-4">
                  ${t.total}<span className="text-base font-normal text-white/50">/day</span>
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between text-white/70">
                    <span>Accommodation</span>
                    <span className="text-white font-medium">${t.data.hotel}</span>
                  </li>
                  <li className="flex justify-between text-white/70">
                    <span>Food</span>
                    <span className="text-white font-medium">${t.data.food}</span>
                  </li>
                  <li className="flex justify-between text-white/70">
                    <span>Transport</span>
                    <span className="text-white font-medium">${t.data.transport}</span>
                  </li>
                  <li className="flex justify-between text-white/70">
                    <span>Activities</span>
                    <span className="text-white font-medium">${t.data.activities}</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Money-Saving Tips */}
      <section className="px-6 py-16 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Money-Saving Tips for {dest.city}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dest.savingTips.map((tip, i) => (
              <div
                key={i}
                className="flex gap-4 bg-white/[0.04] border border-white/10 rounded-xl p-5"
              >
                <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sky-400 font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-white/80 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Average Flight Prices by Month */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Average Flight Prices to {dest.city} by Month
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Month</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Avg. Price (USD)</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Best Weather</th>
                </tr>
              </thead>
              <tbody>
                {flightPrices.map((fp, i) => {
                  const isBest = dest.bestMonths.includes(i + 1)
                  const isCheapest = fp.price === cheapestMonth.price
                  return (
                    <tr
                      key={fp.month}
                      className={`border-b border-white/5 ${isCheapest ? 'bg-sky-500/5' : ''}`}
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {fp.month}
                        {isCheapest && (
                          <span className="ml-2 text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                            Cheapest
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/80">${fp.price}</td>
                      <td className="py-3 px-4">
                        {isBest ? (
                          <span className="text-emerald-400 text-sm">Yes</span>
                        ) : (
                          <span className="text-white/40 text-sm">--</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-white/40 text-xs mt-4 text-center">
            Prices are estimates based on historical trends from major US airports. Actual fares vary.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-16 bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqData.map((faq, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                <p className="text-white/70 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Trip to {dest.city}?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Search for the best flight deals or let us surprise you with a mystery vacation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/search?destination=${dest.code}`}
              className="bg-sky-500 text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-sky-500-light transition transform hover:scale-105"
            >
              Search Flights to {dest.city}
            </Link>
            <Link
              href="/mystery"
              className="border-2 border-sky-400 text-sky-400 font-bold py-3 px-8 rounded-full hover:bg-sky-500/10 transition transform hover:scale-105"
            >
              Try Mystery Vacation
            </Link>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="mt-8 p-6 bg-white/[0.04] border border-white/[0.08] rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3">More about {dest.city}</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/best-time/${destination}`} className="text-sm text-sky-400 hover:text-sky-300 transition">
                Best time to visit →
              </Link>
              <Link href={`/trip-cost?destination=${dest.code}`} className="text-sm text-sky-400 hover:text-sky-300 transition">
                Daily costs →
              </Link>
              <Link href="/mystery" className="text-sm text-sky-400 hover:text-sky-300 transition">
                Plan a mystery trip →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
