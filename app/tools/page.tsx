import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

const tools = [
  {
    title: 'Mystery Vacation',
    emoji: '\u2728',
    href: '/mystery',
    description:
      'Set your budget and let AI surprise you with the perfect destination. Get a complete trip plan with flights, hotels, and activities — all within your budget.',
    cta: 'Surprise Me',
    gradient: 'from-purple-600/30 to-pink-600/30',
    border: 'border-purple-400/30 hover:border-purple-400/60',
    accent: 'text-purple-300',
    keywords: 'mystery vacation generator, surprise trip, random destination',
  },
  {
    title: 'Layover Explorer',
    emoji: '\uD83C\uDF0D',
    href: '/explore',
    description:
      'Turn your layover into a bonus destination. Compare direct flights vs. multi-city stopover routes through major hub airports and save money while exploring more.',
    cta: 'Explore Routes',
    gradient: 'from-emerald-600/30 to-teal-600/30',
    border: 'border-emerald-400/30 hover:border-emerald-400/60',
    accent: 'text-emerald-300',
    keywords: 'layover hack flights, hidden city ticketing, stopover routes',
  },
  {
    title: 'Multi-City Trip Planner',
    emoji: '\uD83D\uDDFA\uFE0F',
    href: '/multi-city',
    description:
      'Plan an optimized multi-stop adventure across 2-5 cities. AI handles route planning, budget allocation, and flight connections so you can focus on the fun.',
    cta: 'Plan My Trip',
    gradient: 'from-amber-600/30 to-orange-600/30',
    border: 'border-amber-400/30 hover:border-amber-400/60',
    accent: 'text-amber-300',
    keywords: 'multi-city flight planner, multi-stop trip, route optimizer',
  },
  {
    title: 'Smart Flight Search',
    emoji: '\u2708\uFE0F',
    href: '/search',
    description:
      'Search flights with exact dates, a monthly calendar view, or flexible day-of-week mode. Discover the cheapest days to fly and save on every trip.',
    cta: 'Search Flights',
    gradient: 'from-blue-600/30 to-cyan-600/30',
    border: 'border-blue-400/30 hover:border-blue-400/60',
    accent: 'text-blue-300',
    keywords: 'cheap flight search, flexible date flights, flight calendar',
  },
  {
    title: 'Cheapest Destinations',
    emoji: '\uD83D\uDCB0',
    href: '/discover',
    description:
      'Find the 5 cheapest places to fly from your airport on any date. Browse real-time low fares and discover budget-friendly destinations you never considered.',
    cta: 'Find Deals',
    gradient: 'from-green-600/30 to-lime-600/30',
    border: 'border-green-400/30 hover:border-green-400/60',
    accent: 'text-green-300',
    keywords: 'cheapest flights, budget destinations, low fare finder',
  },
  {
    title: 'Trip Cost Calculator',
    emoji: '\uD83D\uDCCA',
    href: '/trip-cost',
    description:
      'Estimate your total trip cost for 60+ destinations worldwide. See daily breakdowns for hotels, food, transport, and activities across budget, mid-range, and comfort tiers.',
    cta: 'Calculate Costs',
    gradient: 'from-indigo-600/30 to-violet-600/30',
    border: 'border-indigo-400/30 hover:border-indigo-400/60',
    accent: 'text-indigo-300',
    keywords: 'budget travel calculator, trip cost estimator, daily travel costs',
  },
  {
    title: 'Price Alerts',
    emoji: '\uD83D\uDD14',
    href: '/alerts',
    description:
      'Set up alerts for routes you care about and get notified when prices drop. Never miss a deal on your dream destination again.',
    cta: 'Set Alerts',
    gradient: 'from-rose-600/30 to-red-600/30',
    border: 'border-rose-400/30 hover:border-rose-400/60',
    accent: 'text-rose-300',
    keywords: 'flight price alerts, fare drop notifications, cheap flight alerts',
  },
]

export default function ToolsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Free Travel Planning{' '}
              <span className="text-skyblue">Tools</span>
            </h1>
            <p className="text-xl text-skyblue-light max-w-3xl mx-auto">
              7 smart tools to help you discover destinations, find creative
              routes, estimate costs, and book your next adventure — all
              completely free.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group relative bg-gradient-to-br ${tool.gradient} backdrop-blur-sm rounded-2xl p-8 border ${tool.border} hover:shadow-2xl transition-all transform hover:scale-[1.03] text-left flex flex-col`}
              >
                <div className="text-4xl mb-4">{tool.emoji}</div>
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-skyblue transition">
                  {tool.title}
                </h2>
                <p className="text-skyblue-light text-sm mb-6 flex-1">
                  {tool.description}
                </p>
                <span
                  className={`inline-flex items-center ${tool.accent} font-semibold text-sm group-hover:translate-x-1 transition-transform`}
                >
                  {tool.cta} &rarr;
                </span>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16 space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Ready to start planning?
            </h2>
            <p className="text-skyblue-light max-w-xl mx-auto">
              Every tool is free to use, no sign-up required. Start with a
              Mystery Vacation and let AI plan your next adventure.
            </p>
            <Link
              href="/mystery"
              className="inline-block mt-4 px-8 py-3 bg-skyblue text-navy font-bold rounded-xl hover:bg-skyblue-light transition-colors"
            >
              Try Mystery Vacation
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
