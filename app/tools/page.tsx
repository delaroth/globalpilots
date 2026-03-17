import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface Tool {
  title: string
  emoji: string
  href: string
  description: string
  cta: string
  gradient: string
  border: string
  accent: string
}

interface ToolCategory {
  title: string
  description: string
  headerGradient: string
  tools: Tool[]
}

const toolCategories: ToolCategory[] = [
  {
    title: 'Discover',
    description: 'Not sure where to go? Let us inspire you.',
    headerGradient: 'from-purple-600 to-pink-600',
    tools: [
      {
        title: 'Mystery Vacation',
        emoji: '\u2728',
        href: '/mystery',
        description:
          'Set your budget and let AI surprise you with the perfect destination \u2014 plan single or multi-city trips. Get a complete trip plan with flights, hotels, and activities \u2014 all within your budget.',
        cta: 'Surprise Me',
        gradient: 'from-purple-600/30 to-pink-600/30',
        border: 'border-purple-400/30 hover:border-purple-400/60',
        accent: 'text-purple-300',
      },
      {
        title: 'Destination Quiz',
        emoji: '\uD83E\uDDE9',
        href: '/quiz',
        description:
          'Answer 6 fun questions to discover your travel personality and get matched with your ideal mystery destination. Share results with friends!',
        cta: 'Take the Quiz',
        gradient: 'from-purple-600/20 to-fuchsia-600/20',
        border: 'border-purple-400/20 hover:border-purple-400/50',
        accent: 'text-purple-300',
      },
      {
        title: 'Inspire Me',
        emoji: '\uD83D\uDCA1',
        href: '/inspire',
        description:
          'Get AI-powered destination inspiration based on your travel style, interests, and time of year. Perfect for when you need a spark.',
        cta: 'Get Inspired',
        gradient: 'from-pink-600/20 to-rose-600/20',
        border: 'border-pink-400/20 hover:border-pink-400/50',
        accent: 'text-pink-300',
      },
    ],
  },
  {
    title: 'Flights',
    description: 'Find the cheapest way to get anywhere.',
    headerGradient: 'from-sky-500 to-cyan-500',
    tools: [
      {
        title: 'Flight Search',
        emoji: '\u2708\uFE0F',
        href: '/search',
        description:
          "Search real-time flight prices from Google Flights. Compare dates, find the cheapest days, or search 'Anywhere' to discover deals.",
        cta: 'Search Flights',
        gradient: 'from-sky-600/30 to-blue-600/30',
        border: 'border-sky-400/30 hover:border-sky-400/60',
        accent: 'text-sky-300',
      },
      {
        title: 'Smart Stopovers',
        emoji: '\uD83D\uDDFA\uFE0F',
        href: '/search?tab=stopovers',
        description:
          'Find flights with multi-day stopovers that save money while adding a visa-free country to your trip. Powered by live Google Flights data.',
        cta: 'Find Stopovers',
        gradient: 'from-cyan-600/30 to-teal-600/30',
        border: 'border-cyan-400/30 hover:border-cyan-400/60',
        accent: 'text-cyan-300',
      },
    ],
  },
  {
    title: 'Plan',
    description: 'Know what your trip will cost before you book.',
    headerGradient: 'from-amber-500 to-orange-500',
    tools: [
      {
        title: 'Trip Cost Calculator',
        emoji: '\uD83D\uDCB0',
        href: '/trip-cost',
        description:
          'Estimate your total trip cost for 60+ destinations worldwide. See daily breakdowns for hotels, food, transport, and activities across budget, mid-range, and comfort tiers.',
        cta: 'Calculate Costs',
        gradient: 'from-amber-600/30 to-orange-600/30',
        border: 'border-amber-400/30 hover:border-amber-400/60',
        accent: 'text-amber-300',
      },
      {
        title: 'Festival Calendar',
        emoji: '\uD83C\uDF89',
        href: '/whats-happening',
        description:
          'Discover 110+ festivals and events worldwide. Filter by month, category, or region \u2014 find the perfect reason to book your next trip.',
        cta: 'Explore Events',
        gradient: 'from-orange-600/30 to-red-600/30',
        border: 'border-orange-400/30 hover:border-orange-400/60',
        accent: 'text-orange-300',
      },
    ],
  },
  {
    title: 'Deals',
    description: "Today's cheapest trips, updated daily.",
    headerGradient: 'from-emerald-500 to-green-500',
    tools: [
      {
        title: "This Month's Deals",
        emoji: '\uD83C\uDFF7\uFE0F',
        href: '/deals',
        description:
          "See the cheapest seasonal deals from your nearest airport. Updated daily with real prices \u2014 find last-minute getaways or plan ahead.",
        cta: 'View Deals',
        gradient: 'from-emerald-600/30 to-green-600/30',
        border: 'border-emerald-400/30 hover:border-emerald-400/60',
        accent: 'text-emerald-300',
      },
      {
        title: 'Leaderboard',
        emoji: '\uD83C\uDFC6',
        href: '/leaderboard',
        description:
          'See who found the cheapest mystery trips this week. Real discoveries ranked by cost \u2014 can you beat the leaderboard?',
        cta: 'View Rankings',
        gradient: 'from-green-600/30 to-lime-600/30',
        border: 'border-green-400/30 hover:border-green-400/60',
        accent: 'text-green-300',
      },
    ],
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
              <span className="text-sky-400">Tools</span>
            </h1>
            <p className="text-xl text-sky-300 max-w-3xl mx-auto">
              Smart tools to help you discover destinations, plan trips, and
              estimate costs &mdash; all completely free.
            </p>
          </div>

          {/* Category sections */}
          <div className="space-y-16">
            {toolCategories.map((category) => (
              <div key={category.title}>
                {/* Category heading */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    <span className={`bg-gradient-to-r ${category.headerGradient} bg-clip-text text-transparent`}>
                      {category.title}
                    </span>
                  </h2>
                  <p className="text-sky-300 text-sm">{category.description}</p>
                </div>

                {/* Tools grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className={`group relative bg-gradient-to-br ${tool.gradient} backdrop-blur-sm rounded-2xl p-8 border ${tool.border} hover:shadow-2xl transition-all transform hover:scale-[1.03] text-left flex flex-col`}
                    >
                      <div className="text-4xl mb-4">{tool.emoji}</div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-400 transition">
                        {tool.title}
                      </h3>
                      <p className="text-sky-300 text-sm mb-6 flex-1">
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
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16 space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Ready to start planning?
            </h2>
            <p className="text-sky-300 max-w-xl mx-auto">
              Every tool is free to use, no sign-up required. Start with a
              Mystery Vacation and let AI plan your next adventure.
            </p>
            <Link
              href="/mystery"
              className="inline-block mt-4 px-8 py-3 bg-sky-500 text-slate-900 font-bold rounded-xl hover:bg-sky-500-light transition-colors"
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
