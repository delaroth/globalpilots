import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

const features = [
  {
    step: 1,
    title: 'Mystery Vacation',
    subtitle: 'AI-Powered Surprise Trips with Live Pricing',
    href: '/mystery',
    description:
      'Set your budget in any of 30 currencies, pick your departure airport, dates, and travel vibes. Our AI queries Google Travel Explore for vibe-matched destinations with live Google Flights pricing. Your destination reveals in 2-3 seconds, then a detailed AI itinerary streams in with custom budget splits, local tips, and a clue-guessing game.',
    howItWorks: [
      'Enter your budget, departure airport, dates, and travel vibes',
      'Google Travel Explore finds destinations scored by vibe match',
      'Destination reveals in ~2 seconds with live flight pricing',
      'AI-generated itinerary, budget breakdown, and tips stream in progressively',
    ],
    gradient: 'from-purple-600/20 to-pink-600/20',
    border: 'border-purple-400/30',
    accent: 'text-purple-300',
    mockupBg: 'bg-gradient-to-br from-purple-900/50 to-pink-900/50',
    mockupContent: {
      label: 'Your Mystery Trip',
      items: ['Budget: $800 (USD)', 'Vibes: Beach + Culture', 'Reveal: 2.1s — Lisbon!', 'LIVE: $289 round-trip'],
    },
  },
  {
    step: 2,
    title: 'Smart Stopover Finder',
    subtitle: 'Save Money by Adding a Destination',
    href: '/stopover',
    description:
      'Find flights with multi-day stopovers that cost less than flying direct. The Smart Stopover Finder checks visa requirements for your passport nationality, calculates your savings, and gives a "free vacation" verdict when the stopover route beats the direct price. Powered by live Google Flights data.',
    howItWorks: [
      'Enter your origin, destination, dates, and passport nationality',
      'AI finds hub cities with visa-free transit for your passport',
      'Compare stopover routes vs direct flight costs',
      'Get a free vacation verdict when stopovers save you money',
    ],
    gradient: 'from-emerald-600/20 to-cyan-600/20',
    border: 'border-emerald-400/30',
    accent: 'text-emerald-300',
    mockupBg: 'bg-gradient-to-br from-emerald-900/50 to-cyan-900/50',
    mockupContent: {
      label: 'NYC → Bali via Dubai',
      items: ['Direct: $890', '3-day Dubai stopover: $720', 'Visa: FREE for US passport', 'Verdict: Free vacation!'],
    },
  },
  {
    step: 3,
    title: 'Flight Search',
    subtitle: 'Live Google Flights Data',
    href: '/search',
    description:
      "Search real-time flight prices powered by Google Flights. Prices are tagged with a LIVE badge so you know they are current. Compare dates across a full calendar view, find the cheapest days to fly, or search with destination set to 'Anywhere' to discover the best deals from your airport.",
    howItWorks: [
      'Enter your departure airport and destination (or Anywhere)',
      'Pick your travel dates or browse the calendar view',
      'See LIVE-badged prices from Google Flights',
      'Book directly through Google Flights at the price you see',
    ],
    gradient: 'from-sky-600/20 to-blue-600/20',
    border: 'border-sky-400/30',
    accent: 'text-sky-300',
    mockupBg: 'bg-gradient-to-br from-sky-900/50 to-blue-900/50',
    mockupContent: {
      label: 'BKK → Tokyo (NRT)',
      items: ['Mar 20: $189 LIVE', 'Mar 21: $145 LIVE — Cheapest!', 'Mar 22: $210 LIVE'],
    },
  },
  {
    step: 4,
    title: 'Layover Explorer',
    subtitle: 'Turn Layovers into Side Quests',
    href: '/explore',
    description:
      'Compare direct flights vs stopover routes through hub airports with live Google Flights pricing. See a side-quest value analysis for each hub city — what you can do, eat, and see during a layover. Find creative routing that adds a bonus city to your trip, often for the same price or less.',
    howItWorks: [
      'Enter your origin and final destination',
      'See direct flight prices alongside stopover options (all live)',
      'Explore side-quest value scores for each hub city',
      'Book the route that gives you the best value and experience',
    ],
    gradient: 'from-teal-600/20 to-green-600/20',
    border: 'border-teal-400/30',
    accent: 'text-teal-300',
    mockupBg: 'bg-gradient-to-br from-teal-900/50 to-green-900/50',
    mockupContent: {
      label: 'London → Bangkok via Istanbul',
      items: ['Direct: $620 LIVE', 'Via Istanbul (2-day stop): $480 LIVE', 'Side-quest score: 9.2/10'],
    },
  },
  {
    step: 5,
    title: 'Trip Cost Calculator',
    subtitle: 'Know Before You Go',
    href: '/trip-cost',
    description:
      'Get detailed daily cost breakdowns for 60+ destinations worldwide. See what to expect for accommodation, food, transport, and activities across budget, mid-range, and comfort tiers. Multiply by your trip length for an accurate total budget estimate.',
    howItWorks: [
      'Select your destination city from 60+ options',
      'Choose your travel tier: budget, mid-range, or comfort',
      'See daily breakdowns for all expense categories',
      'Multiply by trip length for your total budget',
    ],
    gradient: 'from-indigo-600/20 to-violet-600/20',
    border: 'border-indigo-400/30',
    accent: 'text-indigo-300',
    mockupBg: 'bg-gradient-to-br from-indigo-900/50 to-violet-900/50',
    mockupContent: {
      label: 'Bangkok — Budget Tier',
      items: ['Hotel: $15/day  Food: $10/day', 'Transport: $5/day  Activities: $8/day', 'Total: ~$38/day'],
    },
  },
  {
    step: 6,
    title: 'Destination Quiz',
    subtitle: 'Find Your Perfect Match',
    href: '/quiz',
    description:
      'Answer 6 quick questions about your travel personality — pace, budget style, food preferences, and more. Our matching algorithm recommends destinations tailored to you. Share your results with friends to compare travel styles and plan trips together.',
    howItWorks: [
      'Answer 6 fun travel personality questions',
      'Get matched with destinations that fit your style',
      'See detailed explanations for each recommendation',
      'Share your results and compare with friends',
    ],
    gradient: 'from-rose-600/20 to-orange-600/20',
    border: 'border-rose-400/30',
    accent: 'text-rose-300',
    mockupBg: 'bg-gradient-to-br from-rose-900/50 to-orange-900/50',
    mockupContent: {
      label: 'Your Travel Personality',
      items: ['Type: Cultural Explorer', 'Top Match: Kyoto, Japan', 'Share with friends'],
    },
  },
  {
    step: 7,
    title: 'Festival Calendar',
    subtitle: '110+ Festivals Worldwide',
    href: '/festivals',
    description:
      'Browse 110+ festivals and events from every corner of the globe, organized by month and region. From Songkran in Thailand to Carnival in Brazil, plan your trips around the events that excite you most.',
    howItWorks: [
      'Browse festivals by month or region',
      'See dates, locations, and descriptions for 110+ events',
      'Filter by type: music, cultural, religious, food, and more',
      'Plan your trip around the festival you want to experience',
    ],
    gradient: 'from-amber-600/20 to-yellow-600/20',
    border: 'border-amber-400/30',
    accent: 'text-amber-300',
    mockupBg: 'bg-gradient-to-br from-amber-900/50 to-yellow-900/50',
    mockupContent: {
      label: 'April Festivals',
      items: ['Songkran — Thailand (Apr 13-15)', 'Coachella — USA (Apr 11-20)', 'Hanami — Japan (Mar-Apr)'],
    },
  },
  {
    step: 8,
    title: 'Travel Passport',
    subtitle: 'Track Your Discoveries',
    href: '/passport',
    description:
      'Earn stamps for every destination you discover through GlobePilots. Unlock badges for milestones like exploring 5 countries in one region, hitting discovery streaks, or finding the cheapest mystery trip of the week. Your passport syncs across devices when you create a free account.',
    howItWorks: [
      'Discover destinations through any GlobePilots tool',
      'Earn stamps automatically for each new destination',
      'Unlock badges for streaks, milestones, and achievements',
      'Create an account to sync your passport across devices',
    ],
    gradient: 'from-lime-600/20 to-emerald-600/20',
    border: 'border-lime-400/30',
    accent: 'text-lime-300',
    mockupBg: 'bg-gradient-to-br from-lime-900/50 to-emerald-900/50',
    mockupContent: {
      label: 'Your Travel Passport',
      items: ['12 stamps collected', 'Badge: Asia Explorer (5/5)', 'Current streak: 4 days'],
    },
  },
]

const faqs = [
  {
    q: 'How do I find the cheapest flights?',
    a: "Use our Flight Search with the calendar view to compare prices across different days. The monthly calendar highlights the cheapest dates in green. You can also search with destination set to 'Anywhere' to find the cheapest places to fly from your airport. All prices come live from Google Flights.",
  },
  {
    q: 'What is a layover hack?',
    a: 'A layover hack involves booking a multi-city itinerary through a hub airport instead of a direct flight. You get to explore a bonus city during your connection, often for the same price or less. Our Layover Explorer and Smart Stopover Finder automate this comparison with live pricing and visa checks.',
  },
  {
    q: 'Is GlobePilots really free?',
    a: 'Yes! All 8 tools are completely free to use. No sign-up required, no subscription, no hidden fees. We earn a small commission when you book through our partner links, which keeps everything free for you.',
  },
  {
    q: 'How does the Mystery Vacation work?',
    a: 'Set your budget, departure airport, and travel vibes. Google Travel Explore finds matching destinations with live pricing. Your destination reveals in 2-3 seconds, then a detailed AI itinerary streams in with budget breakdowns, local tips, and a clue-guessing game.',
  },
  {
    q: 'Are the flight prices accurate?',
    a: 'Prices marked LIVE are pulled directly from Google Flights in real time and reflect actual current fares. Cached estimates from TravelPayouts are clearly marked as estimated. We always show you which type you are looking at.',
  },
  {
    q: 'Do I need an account?',
    a: 'No, all features work without logging in. Creating a free account (Google OAuth or email) lets you save trips, sync your Travel Passport across devices, and track your discovery history.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              How{' '}
              <span className="text-skyblue">GlobePilots</span>{' '}
              Works
            </h1>
            <p className="text-xl text-skyblue-light max-w-3xl mx-auto">
              8 free tools that help you find cheap flights,
              discover destinations, and plan unforgettable adventures. Here is
              exactly how each one works.
            </p>
          </div>

          {/* Feature Walkthroughs */}
          <div className="space-y-24">
            {features.map((feature, i) => (
              <div
                key={feature.href}
                className={`flex flex-col ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                } gap-8 items-center`}
              >
                {/* Text Side */}
                <div className="flex-1 space-y-4">
                  <div className={`text-sm font-semibold ${feature.accent} uppercase tracking-wider`}>
                    Tool {feature.step} of {features.length}
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-skyblue-light/80">
                    {feature.subtitle}
                  </p>
                  <p className="text-skyblue-light text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <ol className="space-y-2 mt-4">
                    {feature.howItWorks.map((step, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-sm text-skyblue-light"
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full bg-navy-light border ${feature.border} flex items-center justify-center text-xs font-bold ${feature.accent}`}
                        >
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={feature.href}
                    className={`inline-flex items-center mt-4 ${feature.accent} font-semibold text-sm hover:underline`}
                  >
                    Try {feature.title} &rarr;
                  </Link>
                </div>

                {/* Mockup Side */}
                <div className="flex-1 w-full">
                  <div
                    className={`${feature.mockupBg} rounded-2xl p-6 border ${feature.border}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-400/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                      <div className="w-3 h-3 rounded-full bg-green-400/60" />
                      <span className="ml-2 text-xs text-white/40">
                        globepilots.com{feature.href}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div
                        className={`text-sm font-semibold ${feature.accent}`}
                      >
                        {feature.mockupContent.label}
                      </div>
                      {feature.mockupContent.items.map((item, j) => (
                        <div
                          key={j}
                          className="bg-navy/40 rounded-lg px-4 py-2 text-sm text-skyblue-light/80 font-mono"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-skyblue-light text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16 space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Ready to start your adventure?
            </h2>
            <p className="text-skyblue-light">
              Pick any tool and start planning — all free, no sign-up needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Link
                href="/mystery"
                className="px-8 py-3 bg-skyblue text-navy font-bold rounded-xl hover:bg-skyblue-light transition-colors"
              >
                Try Mystery Vacation
              </Link>
              <Link
                href="/tools"
                className="px-8 py-3 bg-navy-light text-skyblue font-bold rounded-xl border border-skyblue/30 hover:border-skyblue/60 transition-colors"
              >
                View All Tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
