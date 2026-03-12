import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
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

            <Link href="/explore" className="group relative bg-gradient-to-br from-emerald-600/30 to-teal-600/30 backdrop-blur-sm rounded-2xl p-8 border border-emerald-400/30 hover:border-emerald-400/60 hover:shadow-2xl transition-all transform hover:scale-[1.03] text-left">
              <div className="text-5xl mb-4">🌍</div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition">Layover Explorer</h2>
              <p className="text-skyblue-light text-sm mb-6">
                Turn your connection into a mini-trip. We compare direct flights vs. stopover routes to find hidden savings.
              </p>
              <span className="inline-flex items-center text-emerald-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Explore Routes →
              </span>
            </Link>
          </div>

          {/* Secondary Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Link href="/search" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-5 border border-skyblue/20 hover:border-skyblue/50 hover:shadow-xl transition-all transform hover:scale-105 text-left">
              <div className="text-3xl mb-2">✈️</div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-skyblue transition">Search Flights</h3>
              <p className="text-skyblue-light text-xs">Exact dates, monthly calendar, or flexible day-of-week search</p>
            </Link>

            <Link href="/discover" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-5 border border-skyblue/20 hover:border-skyblue/50 hover:shadow-xl transition-all transform hover:scale-105 text-left">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-skyblue transition">Cheapest Destinations</h3>
              <p className="text-skyblue-light text-xs">Find the 5 cheapest places to fly from your airport on any date</p>
            </Link>

            <Link href="/alerts" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-5 border border-skyblue/20 hover:border-skyblue/50 hover:shadow-xl transition-all transform hover:scale-105 text-left">
              <div className="text-3xl mb-2">🔔</div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-skyblue transition">Price Alerts</h3>
              <p className="text-skyblue-light text-xs">Get notified when prices drop on routes you care about</p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
