import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

const features = [
  {
    step: 1,
    title: 'Mystery Vacation',
    subtitle: 'Plan Single or Multi-City Trips with AI',
    href: '/mystery',
    description:
      'Set your budget, departure airport, and travel vibes. Our AI analyzes real flight data and destination costs to craft a surprise vacation that fits your budget — whether it is a single-city getaway or an optimized multi-stop adventure across 2-5 cities.',
    howItWorks: [
      'Enter your budget and departure airport',
      'Choose your travel style: beach, culture, adventure, or party',
      'AI finds the best destination match — single city or multi-city route',
      'Get a complete trip plan with flights, hotels, and activities',
    ],
    gradient: 'from-purple-600/20 to-pink-600/20',
    border: 'border-purple-400/30',
    accent: 'text-purple-300',
    mockupBg: 'bg-gradient-to-br from-purple-900/50 to-pink-900/50',
    mockupContent: {
      label: 'Your Mystery Trip',
      items: ['Budget: $800', 'Vibes: Beach + Culture', 'Duration: 7 days', 'Destination: ???'],
    },
  },
  {
    step: 2,
    title: 'Trip Cost Calculator',
    subtitle: 'Know Before You Go',
    href: '/trip-cost',
    description:
      'Get detailed daily cost breakdowns for 60+ destinations. See what to expect for accommodation, food, transport, and activities across budget, mid-range, and comfort tiers.',
    howItWorks: [
      'Select your destination city',
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
    step: 3,
    title: 'Flight Search',
    subtitle: 'Real-Time Google Flights Data',
    href: '/search',
    description:
      "Search real-time flight prices powered by Google Flights. Compare dates across a full calendar view, find the cheapest days to fly, or search with destination set to 'Anywhere' to discover the best deals from your airport.",
    howItWorks: [
      'Enter your departure airport and destination (or Anywhere)',
      'Pick your travel dates or browse the calendar view',
      'Compare prices across flexible date ranges',
      'Book directly through Google Flights at the price you see',
    ],
    gradient: 'from-sky-600/20 to-blue-600/20',
    border: 'border-sky-400/30',
    accent: 'text-sky-300',
    mockupBg: 'bg-gradient-to-br from-sky-900/50 to-blue-900/50',
    mockupContent: {
      label: 'BKK → Tokyo (NRT)',
      items: ['Mar 20: $189', 'Mar 21: $145 — Cheapest!', 'Mar 22: $210'],
    },
  },
  {
    step: 4,
    title: 'Layover Explorer',
    subtitle: 'Turn Layovers into Bonus Destinations',
    href: '/explore',
    description:
      'Compare direct flights vs stopover routes through hub airports with live pricing and visa checks. Find creative routing that adds a bonus city to your trip — often for the same price or less than flying direct.',
    howItWorks: [
      'Enter your origin and final destination',
      'See direct flight prices alongside stopover options',
      'Compare hub cities with visa-free transit info',
      'Book the route that gives you the best value and experience',
    ],
    gradient: 'from-teal-600/20 to-green-600/20',
    border: 'border-teal-400/30',
    accent: 'text-teal-300',
    mockupBg: 'bg-gradient-to-br from-teal-900/50 to-green-900/50',
    mockupContent: {
      label: 'London → Bangkok via Istanbul',
      items: ['Direct: $620', 'Via Istanbul (2-day stop): $480', 'Save $140 + explore Istanbul'],
    },
  },
  {
    step: 5,
    title: 'Smart Stopovers',
    subtitle: 'Save Money While Adding Destinations',
    href: '/stopover',
    description:
      'Find flights with multi-day stopovers that save money while adding a visa-free country to your trip. Powered by live Google Flights data, Smart Stopovers identifies hub cities where you can break your journey and explore without needing a visa.',
    howItWorks: [
      'Enter your origin, destination, and travel dates',
      'AI finds routes with stopover cities that offer visa-free transit',
      'Compare savings vs direct flights',
      'Book a trip that includes a bonus destination at no extra cost',
    ],
    gradient: 'from-emerald-600/20 to-cyan-600/20',
    border: 'border-emerald-400/30',
    accent: 'text-emerald-300',
    mockupBg: 'bg-gradient-to-br from-emerald-900/50 to-cyan-900/50',
    mockupContent: {
      label: 'NYC → Bali via Dubai',
      items: ['Direct: $890', '3-day Dubai stopover: $720', 'Visa-free transit — no visa needed'],
    },
  },
]

const faqs = [
  {
    q: 'How do I find the cheapest flights?',
    a: "Use our Smart Flight Search with the calendar view to compare prices across different days. The monthly calendar highlights the cheapest dates in green. You can also search with destination set to 'Anywhere' to find the cheapest places to fly from your airport.",
  },
  {
    q: 'What is a layover hack?',
    a: 'A layover hack involves booking a multi-city itinerary through a hub airport instead of a direct flight. You get to explore a bonus city during your connection, often for the same price or less. Our Layover Explorer automates this comparison for you.',
  },
  {
    q: 'Is GlobePilot really free?',
    a: 'Yes! All tools are completely free to use. No sign-up, no subscription, no hidden fees. We earn a small commission when you book through our partner links, which keeps everything free for you.',
  },
  {
    q: 'How does the Mystery Vacation work?',
    a: 'Set your budget, departure airport, and travel preferences (like beach, culture, or adventure). Our AI analyzes real flight data and destination costs to surprise you with a vacation that fits your budget — including flights, accommodation, and activity suggestions.',
  },
  {
    q: 'How can I plan a multi-city trip on a budget?',
    a: "Use our Mystery Vacation tool — it supports multi-city trips. Set your total budget and add 2-5 cities. AI optimizes the route order for the cheapest flights, allocates your budget based on each city's costs, and finds the best connections between stops.",
  },
  {
    q: 'How accurate are the prices?',
    a: 'We use real-time data from major flight search APIs. Prices shown are actual fares available at the time of search. We link directly to booking partners so you can lock in the price you see.',
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
              <span className="text-skyblue">GlobePilot</span>{' '}
              Works
            </h1>
            <p className="text-xl text-skyblue-light max-w-3xl mx-auto">
              5 core tools that help you plan trips,
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
