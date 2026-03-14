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
]

const labsTools = [
  {
    title: 'Flight Search',
    emoji: '\u2708\uFE0F',
    href: '/search',
    description:
      'Search flights with cached price estimates. Best results once we integrate a real-time flight API.',
    cta: 'Try It',
  },
  {
    title: 'Layover Explorer',
    emoji: '\uD83C\uDF0D',
    href: '/explore',
    description:
      'Compare direct flights vs. stopover routes through hub airports. Needs real-time pricing for accurate comparisons.',
    cta: 'Try It',
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

          {/* Labs Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Labs</p>
              <h2 className="text-xl font-bold text-white/60">
                Waiting for Real-Time Flight Data
              </h2>
              <p className="text-sm text-white/30 mt-2 max-w-lg mx-auto">
                These tools work but use cached price estimates. They&apos;ll become much more useful once we integrate a live flight pricing API.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {labsTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group bg-white/[0.03] backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-skyblue/30 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{tool.emoji}</span>
                    <div>
                      <h3 className="text-base font-semibold text-white/60 group-hover:text-white/80 transition">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-white/30 mt-1">{tool.description}</p>
                      <span className="inline-flex items-center text-skyblue/40 group-hover:text-skyblue/70 text-xs font-medium mt-2 transition">
                        {tool.cta} &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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
