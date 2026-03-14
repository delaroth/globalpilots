import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import InstallPrompt from '@/components/InstallPrompt'
import Link from 'next/link'

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

          {/* Two Hero Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Link href="/mystery" className="group relative bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30 hover:border-purple-400/60 hover:shadow-2xl transition-all transform hover:scale-[1.03] text-left">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition">Mystery Vacation</h2>
              <p className="text-skyblue-light text-sm mb-6">
                Set your budget and let AI surprise you with the perfect destination. Includes flights, hotels, and activities.
              </p>
              <span className="inline-flex items-center text-purple-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Surprise Me →
              </span>
            </Link>

            <Link href="/multi-city" className="group relative bg-gradient-to-br from-amber-600/30 to-orange-600/30 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/30 hover:border-amber-400/60 hover:shadow-2xl transition-all transform hover:scale-[1.03] text-left">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-300 transition">Multi-City Trip Planner</h2>
              <p className="text-skyblue-light text-sm mb-6">
                Plan an optimized multi-stop adventure across 2-5 cities. AI handles route planning, budget allocation, and flight connections.
              </p>
              <span className="inline-flex items-center text-amber-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Plan My Trip →
              </span>
            </Link>
          </div>

          {/* Trip Cost Calculator */}
          <div className="grid grid-cols-1 gap-4 mt-6 max-w-md mx-auto">
            <Link href="/trip-cost" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-5 border border-skyblue/20 hover:border-skyblue/50 hover:shadow-xl transition-all transform hover:scale-105 text-left">
              <div className="text-3xl mb-2">&#x1F4CA;</div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-skyblue transition">Trip Cost Calculator</h3>
              <p className="text-skyblue-light text-xs">Estimate total trip costs for 60+ cities with daily breakdowns</p>
            </Link>
          </div>

          {/* Labs — features that need real-time data */}
          <div className="mt-12">
            <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-4">Labs — coming soon with live pricing</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link href="/search" className="group bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-skyblue/30 transition-all text-left">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <h3 className="text-sm font-medium text-white/60 group-hover:text-white/80 transition">Flight Search</h3>
                    <p className="text-xs text-white/30">Cached estimates &middot; best with live API</p>
                  </div>
                </div>
              </Link>
              <Link href="/explore" className="group bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-skyblue/30 transition-all text-left">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌍</span>
                  <div>
                    <h3 className="text-sm font-medium text-white/60 group-hover:text-white/80 transition">Layover Explorer</h3>
                    <p className="text-xs text-white/30">Stopover routes &middot; best with live API</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <InstallPrompt />
    </main>
  )
}
