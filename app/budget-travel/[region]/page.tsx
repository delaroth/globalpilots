import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

function findRegionBySlug(slug: string): string | undefined {
  const regions = getAllRegions()
  return regions.find((r) => slugify(r) === slug)
}

// Region descriptions for SEO
const regionDescriptions: Record<string, string> = {
  'Southeast Asia':
    'Southeast Asia is the ultimate budget travel destination. From the street food capitals of Bangkok and Hanoi to the beaches of Bali and Phuket, this region offers incredible value for money. Most countries offer visa-free entry, affordable accommodation, and world-class cuisine for under $5 a meal.',
  'East Asia':
    'East Asia blends ultra-modern cities with ancient traditions. While Tokyo and Hong Kong can be pricey, cities like Taipei and Seoul offer surprising value. The region excels at efficient public transit, incredible food scenes, and a fascinating mix of old and new.',
  'South Asia':
    'South Asia is one of the most affordable regions on Earth. India, Nepal, and Sri Lanka offer jaw-dropping cultural experiences, diverse landscapes, and delicious food — all at rock-bottom prices. Expect to spend as little as $15-25 per day on a backpacker budget.',
  'Middle East':
    'The Middle East ranges from luxury hubs like Dubai to surprisingly affordable gems like Istanbul and Amman. Rich in history, culture, and cuisine, this region rewards curious travelers with unforgettable experiences. Visa policies vary, so check before you go.',
  'Europe':
    'Europe is the classic travel destination, and it does not have to break the bank. Eastern and Southern Europe — think Lisbon, Budapest, and Athens — offer excellent value. Budget airlines connect the continent cheaply, and free walking tours are available in every major city.',
  'Americas':
    'The Americas span everything from the bustling streets of Mexico City to the natural wonders of Patagonia. Central and South America are particularly budget-friendly, with rich cultures, incredible biodiversity, and a growing backpacker infrastructure.',
  'Africa':
    'Africa offers some of the most unique travel experiences on the planet. From the markets of Marrakech to the savannas of Kenya, this continent is rich in culture and natural beauty. Many destinations are extremely affordable, though safari costs can add up.',
  'Caucasus':
    'The Caucasus region is an emerging travel gem. Georgia and its neighbors offer stunning mountain scenery, incredible wine and food traditions, and warm hospitality — all at very reasonable prices. Tbilisi is one of the most underrated cities in the world.',
  'Oceania':
    'Oceania features some of the most beautiful landscapes on Earth. While Australia and New Zealand are not cheap, they offer excellent value for outdoor adventures. Working holiday visas can extend your budget significantly.',
}

export async function generateStaticParams() {
  const regions = getAllRegions()
  return regions.map((r) => ({
    region: slugify(r),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>
}): Promise<Metadata> {
  const { region: regionSlug } = await params
  const regionName = findRegionBySlug(regionSlug)
  if (!regionName) return { title: 'Not Found' }

  const title = `Best Budget Destinations in ${regionName} 2026 | GlobePilot`
  const description = `Discover the cheapest travel destinations in ${regionName}. Compare daily costs, see the best months to visit, and get money-saving tips for budget travel in ${regionName}.`

  return {
    title,
    description,
    keywords: [
      `budget travel ${regionName}`,
      `cheap destinations ${regionName}`,
      `${regionName} on a budget`,
      `backpacking ${regionName}`,
      `${regionName} travel costs`,
      `cheapest places in ${regionName}`,
    ],
    openGraph: {
      title,
      description,
      url: `https://globepilots.com/budget-travel/${regionSlug}`,
      type: 'article',
    },
  }
}

export default async function BudgetTravelRegionPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region: regionSlug } = await params
  const regionName = findRegionBySlug(regionSlug)
  if (!regionName) notFound()

  const destinations = getDestinationsByRegion(regionName)
  const sorted = [...destinations].sort(
    (a, b) => dailyTotal(a.dailyCosts.budget) - dailyTotal(b.dailyCosts.budget)
  )

  const cheapest = sorted[0]
  const cheapestBudget = cheapest ? dailyTotal(cheapest.dailyCosts.budget) : 0
  const avgBudget = Math.round(
    sorted.reduce((sum, d) => sum + dailyTotal(d.dailyCosts.budget), 0) / sorted.length
  )

  const description = regionDescriptions[regionName] || `Discover budget-friendly destinations in ${regionName}.`

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
        name: 'Budget Travel',
        item: 'https://globepilots.com/budget-travel',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: regionName,
        item: `https://globepilots.com/budget-travel/${regionSlug}`,
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
            Budget Travel Guide
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Best Budget Destinations in{' '}
            <span className="text-skyblue">{regionName}</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            {sorted.length} destinations starting from{' '}
            <span className="text-skyblue font-semibold">${cheapestBudget}/day</span>.
            Average budget cost: ${avgBudget}/day.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-6 py-8 bg-navy-light/30">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-skyblue">{sorted.length}</p>
            <p className="text-white/50 text-sm">Destinations</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-skyblue">${cheapestBudget}</p>
            <p className="text-white/50 text-sm">Cheapest/day</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-skyblue">${avgBudget}</p>
            <p className="text-white/50 text-sm">Average/day</p>
          </div>
        </div>
      </section>

      {/* Region Description */}
      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-lg leading-relaxed">{description}</p>
        </div>
      </section>

      {/* Destination Cards */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {regionName} Destinations Ranked by Budget Cost
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((dest, i) => {
              const budget = dailyTotal(dest.dailyCosts.budget)
              const mid = dailyTotal(dest.dailyCosts.mid)
              const bestTip = dest.savingTips[0]
              return (
                <div
                  key={dest.code}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-skyblue/20 text-skyblue px-2 py-0.5 rounded-full font-medium">
                          #{i + 1}
                        </span>
                        <span className="text-xs text-white/40 font-mono">{dest.code}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-2">{dest.city}</h3>
                      <p className="text-white/50 text-sm">{dest.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-skyblue">${budget}</p>
                      <p className="text-white/40 text-xs">budget/day</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm mb-4">
                    <div>
                      <p className="text-white/40">Mid-range</p>
                      <p className="text-white font-medium">${mid}/day</p>
                    </div>
                    <div>
                      <p className="text-white/40">Best months</p>
                      <p className="text-white font-medium">
                        {dest.bestMonths
                          .slice(0, 3)
                          .map((m) => monthNames[m - 1].slice(0, 3))
                          .join(', ')}
                        {dest.bestMonths.length > 3 && '...'}
                      </p>
                    </div>
                  </div>

                  {bestTip && (
                    <p className="text-white/60 text-sm mb-4 flex-1 leading-relaxed">
                      <span className="text-skyblue font-medium">Top tip:</span> {bestTip}
                    </p>
                  )}

                  <Link
                    href={`/cheap-flights/${destSlugify(dest.city)}`}
                    className="text-center bg-white/[0.06] border border-white/10 hover:border-skyblue/40 text-white hover:text-skyblue font-medium py-2.5 px-4 rounded-xl transition text-sm mt-auto"
                  >
                    View flights &amp; details
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 py-16 bg-navy-light/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Cost Comparison Table
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">#</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Destination</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Budget/Day</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Mid/Day</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Comfort/Day</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Best Months</th>
                  <th className="py-3 px-4 text-white/60 font-medium text-sm">Currency</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((dest, i) => (
                  <tr key={dest.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white/40 text-sm">{i + 1}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/cheap-flights/${destSlugify(dest.city)}`}
                        className="text-white hover:text-skyblue font-medium transition"
                      >
                        {dest.city}, {dest.country}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-skyblue font-medium">
                      ${dailyTotal(dest.dailyCosts.budget)}
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      ${dailyTotal(dest.dailyCosts.mid)}
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      ${dailyTotal(dest.dailyCosts.comfort)}
                    </td>
                    <td className="py-3 px-4 text-white/50 text-sm">
                      {dest.bestMonths.map((m) => monthNames[m - 1].slice(0, 3)).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-white/50 text-sm">{dest.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Other Regions */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Explore Other Regions
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {getAllRegions()
              .filter((r) => r !== regionName)
              .map((r) => (
                <Link
                  key={r}
                  href={`/budget-travel/${slugify(r)}`}
                  className="bg-white/[0.06] border border-white/10 hover:border-skyblue/40 text-white hover:text-skyblue px-5 py-2.5 rounded-full transition text-sm font-medium"
                >
                  {r}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 bg-gradient-to-br from-skyblue/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Plan Your {regionName} Trip
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Use our tools to find flights, estimate costs, and discover your perfect destination in {regionName}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mystery"
              className="bg-skyblue text-navy font-bold py-3 px-8 rounded-full hover:bg-skyblue-light transition transform hover:scale-105"
            >
              Mystery Vacation
            </Link>
            <Link
              href="/trip-cost"
              className="border-2 border-skyblue text-skyblue font-bold py-3 px-8 rounded-full hover:bg-skyblue/10 transition transform hover:scale-105"
            >
              Trip Cost Calculator
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
