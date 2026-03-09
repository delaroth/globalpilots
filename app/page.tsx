import FlightSearch from '@/components/FlightSearch'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-white">
            <a href="#" className="hover:text-skyblue transition">Flights</a>
            <a href="#" className="hover:text-skyblue transition">Hotels</a>
            <a href="#" className="hover:text-skyblue transition">About</a>
          </div>
        </div>
      </nav>

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

          {/* Flight Search Component */}
          <div className="mt-12">
            <FlightSearch />
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

      {/* Footer */}
      <footer className="w-full px-6 py-8 border-t border-skyblue/20">
        <div className="max-w-7xl mx-auto text-center text-skyblue-light text-sm">
          <p>&copy; 2024 GlobePilot. Budget travel made simple.</p>
        </div>
      </footer>
    </main>
  )
}
