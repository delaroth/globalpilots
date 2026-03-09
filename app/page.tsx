import NaturalLanguageSearch from '@/components/NaturalLanguageSearch'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Tagline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Budget in.
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold text-skyblue">
              Adventure out.
            </h1>
            <p className="text-xl text-skyblue-light mt-6">
              AI-powered travel planning that finds the best flight deals for your next adventure
            </p>
          </div>

          {/* Natural Language Search */}
          <div className="mt-12">
            <NaturalLanguageSearch />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-white">
            <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20">
              <div className="w-12 h-12 bg-skyblue/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">✈️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Best Prices</h3>
              <p className="text-skyblue-light text-sm">
                Compare thousands of flights to find the cheapest options
              </p>
            </div>
            <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20">
              <div className="w-12 h-12 bg-skyblue/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-skyblue-light text-sm">
                Smart recommendations based on your preferences and budget
              </p>
            </div>
            <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20">
              <div className="w-12 h-12 bg-skyblue/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Coverage</h3>
              <p className="text-skyblue-light text-sm">
                Search flights to destinations all around the world
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="px-6 py-16 bg-navy-dark/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Explore All Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/calendar" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 hover:border-skyblue hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-skyblue transition">Cheapest Days</h3>
              <p className="text-skyblue-light text-sm">See the cheapest day to fly each month with our interactive calendar</p>
            </Link>

            <Link href="/weekend" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 hover:border-skyblue hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-skyblue transition">Weekend Deals</h3>
              <p className="text-skyblue-light text-sm">Find cheap weekend getaways from your city starting this week</p>
            </Link>

            <Link href="/mystery" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 hover:border-skyblue hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-skyblue transition">Mystery Vacation</h3>
              <p className="text-skyblue-light text-sm">Let AI surprise you with the perfect destination for your budget</p>
            </Link>

            <Link href="/layover" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 hover:border-skyblue hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-skyblue transition">Layover Arbitrage</h3>
              <p className="text-skyblue-light text-sm">Save money by turning layovers into bonus destinations</p>
            </Link>

            <Link href="/alerts" className="group bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 hover:border-skyblue hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-skyblue transition">Price Alerts</h3>
              <p className="text-skyblue-light text-sm">Get notified when flight prices drop below your target</p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
