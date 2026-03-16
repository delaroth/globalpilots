import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import InstallPrompt from '@/components/InstallPrompt'
import SocialProof from '@/components/SocialProof'
import Link from 'next/link'

const categoryCards = [
  {
    title: 'Discover',
    tagline: "Don't know where to go? Let us surprise you.",
    href: '/mystery',
    gradient: 'from-purple-600 to-pink-600',
    bgGradient: 'from-purple-600/20 to-pink-600/20',
    border: 'border-purple-400/30 hover:border-purple-400/60',
    subFeatures: ['Mystery Vacation', 'Destination Quiz', 'Inspire Me'],
  },
  {
    title: 'Flights',
    tagline: 'Find the cheapest way to get there.',
    href: '/search',
    gradient: 'from-sky-500 to-cyan-500',
    bgGradient: 'from-sky-500/20 to-cyan-500/20',
    border: 'border-sky-400/30 hover:border-sky-400/60',
    subFeatures: ['Search', 'Stopovers', 'Multi-city'],
  },
  {
    title: 'Plan',
    tagline: "Know what it'll cost before you book.",
    href: '/trip-cost',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-400/30 hover:border-amber-400/60',
    subFeatures: ['Trip Costs', 'Festival Calendar'],
  },
  {
    title: 'Deals',
    tagline: "Today's cheapest trips from your airport.",
    href: '/deals',
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-500/20 to-green-500/20',
    border: 'border-emerald-400/30 hover:border-emerald-400/60',
    subFeatures: ['This Month', 'Quick Escape', 'Leaderboard'],
  },
]

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full text-center space-y-10">
          {/* Tagline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Budget in.
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold text-skyblue">
              Adventure out.
            </h1>
            <p className="text-xl text-skyblue-light mt-6 max-w-2xl mx-auto">
              Smart travel tools that help you discover destinations, find creative routes, and book your next adventure
            </p>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
            {categoryCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`group relative overflow-hidden bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm rounded-2xl p-8 border ${card.border} hover:shadow-2xl transition-all transform hover:scale-[1.03] text-left`}
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />

                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-skyblue transition">
                  {card.title}
                </h2>
                <p className="text-skyblue-light text-sm mb-5">
                  {card.tagline}
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.subFeatures.map((sub) => (
                    <span
                      key={sub}
                      className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center text-skyblue font-semibold text-sm mt-4 group-hover:translate-x-1 transition-transform">
                  Explore &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SocialProof />
      <Footer />
      <InstallPrompt />
    </main>
  )
}
