import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

const tools = [
  {
    title: 'Mystery Vacation',
    emoji: '\u2728',
    href: '/mystery',
    description:
      'Set your budget and let AI surprise you with the perfect destination — plan single or multi-city trips. Get a complete trip plan with flights, hotels, and activities — all within your budget.',
    cta: 'Surprise Me',
    gradient: 'from-purple-600/30 to-pink-600/30',
    border: 'border-purple-400/30 hover:border-purple-400/60',
    accent: 'text-purple-300',
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
  },
  {
    title: "What's Happening",
    emoji: '\uD83C\uDF89',
    href: '/whats-happening',
    description:
      'Discover 110+ festivals and events worldwide. Filter by month, category, or region — find the perfect reason to book your next trip.',
    cta: 'Explore Events',
    gradient: 'from-amber-600/30 to-orange-600/30',
    border: 'border-amber-400/30 hover:border-amber-400/60',
    accent: 'text-amber-300',
  },
  {
    title: 'Destination Quiz',
    emoji: '\uD83E\uDDE9',
    href: '/quiz',
    description:
      'Answer 6 fun questions to discover your travel personality and get matched with your ideal mystery destination. Share results with friends!',
    cta: 'Take the Quiz',
    gradient: 'from-cyan-600/30 to-teal-600/30',
    border: 'border-cyan-400/30 hover:border-cyan-400/60',
    accent: 'text-cyan-300',
  },
  {
    title: 'Leaderboard',
    emoji: '\uD83C\uDFC6',
    href: '/leaderboard',
    description:
      'See who found the cheapest mystery trips this week. Real discoveries ranked by cost — can you beat the leaderboard?',
    cta: 'View Rankings',
    gradient: 'from-yellow-600/30 to-amber-600/30',
    border: 'border-yellow-400/30 hover:border-yellow-400/60',
    accent: 'text-yellow-300',
  },
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
    title: 'Layover Explorer',
    emoji: '\uD83C\uDF0D',
    href: '/explore',
    description:
      'Turn layovers into bonus destinations. Compare direct flights vs stopover routes with live pricing and visa checks.',
    cta: 'Explore Routes',
    gradient: 'from-teal-600/30 to-green-600/30',
    border: 'border-teal-400/30 hover:border-teal-400/60',
    accent: 'text-teal-300',
  },
  {
    title: 'Smart Stopovers',
    emoji: '\u2708\uFE0F',
    href: '/stopover',
    description:
      'Find flights with multi-day stopovers that save money while adding a visa-free country to your trip. Powered by live Google Flights data.',
    cta: 'Find Stopovers',
    gradient: 'from-emerald-600/30 to-cyan-600/30',
    border: 'border-emerald-400/30 hover:border-emerald-400/60',
    accent: 'text-emerald-300',
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
              Smart tools to help you discover destinations, plan trips, and
              estimate costs — all completely free.
            </p>
          </div>

          {/* Main Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
