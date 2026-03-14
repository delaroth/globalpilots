import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

const tools = [
  {
    emoji: '✨',
    name: 'Mystery Vacation',
    href: '/mystery',
    description:
      'Set your budget and let AI surprise you with a destination — plan single or multi-city trips. Perfect for spontaneous travellers.',
    gradient: 'from-purple-600/30 to-pink-600/30',
    border: 'border-purple-400/30 hover:border-purple-400/60',
  },
  {
    emoji: '🧮',
    name: 'Trip Cost Calculator',
    href: '/trip-cost',
    description:
      'Estimate your total trip cost across 60+ destinations. See daily breakdowns for hotels, food, transport, and activities.',
    gradient: 'from-indigo-600/30 to-violet-600/30',
    border: 'border-indigo-400/30 hover:border-indigo-400/60',
  },
]

const steps = [
  {
    number: '1',
    title: 'Pick a Tool',
    description:
      'Choose from our smart travel tools designed for different planning needs. Whether you know exactly where you want to go or need inspiration, we have you covered.',
  },
  {
    number: '2',
    title: 'Set Your Budget',
    description:
      'Tell us what you can spend. Our tools work around your budget to find the best options, routes, and destinations that fit your wallet.',
  },
  {
    number: '3',
    title: 'Book and Go',
    description:
      'Compare results, pick your favourite option, and book directly through trusted travel providers. Your adventure starts here.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-2">
            Budget in.
          </h1>
          <h1 className="text-5xl md:text-7xl font-bold text-skyblue mb-8">
            Adventure out.
          </h1>
          <p className="text-xl md:text-2xl text-skyblue-light max-w-2xl mx-auto leading-relaxed">
            GlobePilot is a suite of AI-powered travel tools built for adventurers. We help you discover destinations, find creative routes, and plan trips that fit any budget.
          </p>
        </div>
      </section>

      {/* Tool Showcase */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            2 Tools. One Mission.
          </h2>
          <p className="text-skyblue-light text-center mb-12 max-w-xl mx-auto">
            Every tool is designed to save you money and spark your sense of adventure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group bg-gradient-to-br ${tool.gradient} backdrop-blur-sm rounded-2xl p-6 border ${tool.border} hover:shadow-2xl transition-all transform hover:scale-[1.03]`}
              >
                <div className="text-4xl mb-3">{tool.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-skyblue transition">
                  {tool.name}
                </h3>
                <p className="text-skyblue-light/80 text-sm leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-navy-light/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-skyblue rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-navy text-2xl font-bold">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-skyblue-light/80 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built By Section */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 bg-skyblue rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-navy text-3xl font-bold">G</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Built by Travel Enthusiasts
          </h2>
          <p className="text-skyblue-light text-lg leading-relaxed mb-4">
            GlobePilot was born from a simple frustration: planning budget travel shouldn&apos;t be complicated. We built these tools because we wanted them ourselves &mdash; smart, fast utilities that put your budget first and your adventure second to none.
          </p>
          <p className="text-skyblue-light/70 text-base">
            Powered by real flight data from TravelPayouts and Amadeus, enhanced by DeepSeek AI, and designed with travellers in mind.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gradient-to-br from-skyblue/10 to-purple-600/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Explore?
          </h2>
          <p className="text-skyblue-light text-lg mb-8">
            Pick a tool and start planning your next adventure. No sign-up required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mystery"
              className="bg-skyblue text-navy font-bold py-3 px-8 rounded-full hover:bg-skyblue-light transition transform hover:scale-105"
            >
              Try Mystery Vacation
            </Link>
            <Link
              href="/search"
              className="border-2 border-skyblue text-skyblue font-bold py-3 px-8 rounded-full hover:bg-skyblue/10 transition transform hover:scale-105"
            >
              Search Flights
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
