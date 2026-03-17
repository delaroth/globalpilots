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
import { getClimateData, type ClimateData } from '@/lib/enrichment/climate'

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

const monthAbbrev = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Determine which months are "shoulder season" — adjacent to bestMonths but not
 * bestMonths themselves. We consider +/- 1 month from any best month.
 */
function getShoulderMonths(bestMonths: number[]): number[] {
  const bestSet = new Set(bestMonths)
  const shoulder = new Set<number>()
  for (const m of bestMonths) {
    const prev = m === 1 ? 12 : m - 1
    const next = m === 12 ? 1 : m + 1
    if (!bestSet.has(prev)) shoulder.add(prev)
    if (!bestSet.has(next)) shoulder.add(next)
  }
  return [...shoulder]
}

/**
 * Estimate flight prices for each month — peak months cost more.
 */
function getEstimatedFlightPrices(dest: DestinationCost): number[] {
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

  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1
    const isBest = dest.bestMonths.includes(monthNum)
    const multiplier = isBest ? 1.15 : 0.9
    const jitter = 1 + (((monthNum * 7 + dest.code.charCodeAt(0)) % 20) - 10) / 100
    return Math.round(basePrice * multiplier * jitter)
  })
}

export async function generateStaticParams() {
  const destinations = getAllDestinations()
  return destinations.map((d) => ({
    destination: slugify(d.city),
  }))
}

export default async function BestTimePage({
  params,
}: {
  params: Promise<{ destination: string }>
}) {
  const { destination } = await params
  const dest = unslugify(destination)
  if (!dest) notFound()

  const budgetDaily = dailyTotal(dest.dailyCosts.budget)
  const midDaily = dailyTotal(dest.dailyCosts.mid)
  const bestSet = new Set(dest.bestMonths)
  const shoulderMonths = getShoulderMonths(dest.bestMonths)
  const shoulderSet = new Set(shoulderMonths)

  // Climate data for all 12 months
  const climateByMonth: (ClimateData | null)[] = Array.from(
    { length: 12 },
    (_, i) => getClimateData(dest.code, i + 1)
  )

  // Flight price estimates
  const flightPrices = getEstimatedFlightPrices(dest)

  // Budget comparison: peak vs shoulder daily costs (use mid-range + flights)
  const peakFlightAvg =
    dest.bestMonths.length > 0
      ? Math.round(
          dest.bestMonths.reduce((s, m) => s + flightPrices[m - 1], 0) /
            dest.bestMonths.length
        )
      : 0
  const shoulderFlightAvg =
    shoulderMonths.length > 0
      ? Math.round(
          shoulderMonths.reduce((s, m) => s + flightPrices[m - 1], 0) /
            shoulderMonths.length
        )
      : 0
  const flightSaving = peakFlightAvg - shoulderFlightAvg

  // FAQ data
  const faqData = [
    {
      question: `What is the best month to visit ${dest.city}?`,
      answer: `The best months to visit ${dest.city} are ${dest.bestMonths.map((m) => monthNames[m - 1]).join(', ')}. During these months you'll enjoy the most favorable weather and travel conditions.`,
    },
    {
      question: `What is the cheapest time to visit ${dest.city}?`,
      answer: `Shoulder season (${shoulderMonths.length > 0 ? shoulderMonths.map((m) => monthNames[m - 1]).join(', ') : 'off-peak months'}) typically offers lower flight prices — around $${shoulderFlightAvg} vs $${peakFlightAvg} during peak season. Budget travellers can spend as little as $${budgetDaily}/day on the ground.`,
    },
    {
      question: `What is the weather like in ${dest.city}?`,
      answer: climateByMonth[dest.bestMonths[0] - 1]
        ? `During the best months, expect ${climateByMonth[dest.bestMonths[0] - 1]!.description.toLowerCase()} with average temperatures around ${climateByMonth[dest.bestMonths[0] - 1]!.avgTempC}°C (${climateByMonth[dest.bestMonths[0] - 1]!.avgTempF}°F). Check the month-by-month breakdown above for detailed climate info.`
        : `${dest.city} has varied weather throughout the year. The best months (${dest.bestMonths.map((m) => monthNames[m - 1]).join(', ')}) generally offer the most pleasant conditions.`,
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
        name: 'Best Time to Visit',
        item: 'https://globepilots.com/best-time',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: dest.city,
        item: `https://globepilots.com/best-time/${destination}`,
      },
    ],
  }

  return (
    <main className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navigation />

      {/* Breadcrumb */}
      <nav className="px-6 pt-6 max-w-5xl mx-auto w-full">
        <ol className="flex items-center gap-2 text-sm text-white/40">
          <li>
            <Link href="/" className="hover:text-white/60 transition">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/best-time" className="hover:text-white/60 transition">Best Time to Visit</Link>
          </li>
          <li>/</li>
          <li className="text-white/70">{dest.city}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sky-400 font-medium mb-2 tracking-wide uppercase text-sm">
            {dest.country} &middot; {dest.region}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Best Time to Visit{' '}
            <span className="text-sky-400">{dest.city}</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            When to go for the best experience &mdash; weather, prices &amp; tips
          </p>
        </div>
      </section>

      {/* 12-Month Grid */}
      <section className="px-6 py-16 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Month-by-Month Guide to {dest.city}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const monthNum = i + 1
              const isBest = bestSet.has(monthNum)
              const isShoulder = shoulderSet.has(monthNum)
              const climate = climateByMonth[i]

              let borderClass = 'border-white/10'
              let bgClass = 'bg-white/[0.03]'
              let labelClass = 'text-white/30'
              let label = ''

              if (isBest) {
                borderClass = 'border-emerald-500/40'
                bgClass = 'bg-emerald-500/10'
                labelClass = 'text-emerald-400'
                label = 'Best'
              } else if (isShoulder) {
                borderClass = 'border-amber-500/30'
                bgClass = 'bg-amber-500/10'
                labelClass = 'text-amber-400'
                label = 'Shoulder'
              }

              return (
                <div
                  key={monthNum}
                  className={`${bgClass} border ${borderClass} rounded-xl p-4 text-center transition-all`}
                >
                  <p className="text-white font-bold text-lg">{monthAbbrev[i]}</p>
                  {climate && (
                    <p className="text-white/60 text-xs mt-1">
                      {climate.avgTempC}°C / {climate.avgTempF}°F
                    </p>
                  )}
                  {climate && (
                    <p className="text-white/40 text-xs">
                      {climate.rainyDays}d rain
                    </p>
                  )}
                  {label && (
                    <span className={`text-xs font-medium mt-1 inline-block ${labelClass}`}>
                      {label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="text-white/60">Best months</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500/50" />
              <span className="text-white/60">Shoulder season</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-white/60">Off-season</span>
            </span>
          </div>
        </div>
      </section>

      {/* Recommended Months Detail */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Recommended Months in Detail
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dest.bestMonths.map((m) => {
              const climate = climateByMonth[m - 1]
              const estDailyCost = midDaily
              return (
                <div
                  key={m}
                  className="bg-white/[0.04] border border-emerald-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{monthNames[m - 1]}</h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      Best
                    </span>
                  </div>
                  {climate && (
                    <div className="space-y-2 mb-4">
                      <p className="text-white/70 text-sm">
                        <span className="text-white font-medium">Weather:</span>{' '}
                        {climate.description}
                      </p>
                      <p className="text-white/70 text-sm">
                        <span className="text-white font-medium">Temp:</span>{' '}
                        {climate.avgTempC}°C ({climate.avgTempF}°F) &middot;{' '}
                        {climate.humidity}% humidity
                      </p>
                      <p className="text-white/70 text-sm">
                        <span className="text-white font-medium">Rain:</span>{' '}
                        ~{climate.rainyDays} rainy days
                      </p>
                      <p className="text-white/70 text-sm">
                        <span className="text-white font-medium">Pack:</span>{' '}
                        {climate.packingTip}
                      </p>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="text-white/50 text-sm">Est. daily cost</span>
                    <span className="text-sky-400 font-bold">${estDailyCost}/day</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/50 text-sm">Est. flights</span>
                    <span className="text-white font-medium">${flightPrices[m - 1]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Budget Comparison: Peak vs Shoulder */}
      {shoulderMonths.length > 0 && (
        <section className="px-6 py-16 bg-slate-800/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Save Money in Shoulder Season
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/[0.04] border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-1">Peak Season</h3>
                <p className="text-white/50 text-sm mb-4">
                  {dest.bestMonths.map((m) => monthAbbrev[m - 1]).join(', ')}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Avg. flights</span>
                    <span className="text-white font-medium">${peakFlightAvg}</span>
                  </div>
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Daily cost (mid-range)</span>
                    <span className="text-white font-medium">${midDaily}/day</span>
                  </div>
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>7-day trip total</span>
                    <span className="text-white font-bold">${peakFlightAvg + midDaily * 7}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.04] border border-amber-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-1">Shoulder Season</h3>
                <p className="text-white/50 text-sm mb-4">
                  {shoulderMonths.map((m) => monthAbbrev[m - 1]).join(', ')}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Avg. flights</span>
                    <span className="text-white font-medium">${shoulderFlightAvg}</span>
                  </div>
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>Daily cost (mid-range)</span>
                    <span className="text-white font-medium">${midDaily}/day</span>
                  </div>
                  <div className="flex justify-between text-white/70 text-sm">
                    <span>7-day trip total</span>
                    <span className="text-white font-bold">${shoulderFlightAvg + midDaily * 7}</span>
                  </div>
                </div>
              </div>
            </div>
            {flightSaving > 0 && (
              <p className="text-center mt-6 text-emerald-400 font-medium">
                Fly shoulder season and save ~${flightSaving} on flights alone
              </p>
            )}
          </div>
        </section>
      )}

      {/* Saving Tips */}
      <section className="px-6 py-16">
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

      {/* Bottom CTAs */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Visit {dest.city}?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Search for flights or let us surprise you with a mystery trip.
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
              Plan a Mystery Trip
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
