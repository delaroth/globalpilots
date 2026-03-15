import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Travel-themed illustration */}
          <div className="text-6xl mb-8 space-x-4">
            <span role="img" aria-label="luggage">🧳</span>
            <span role="img" aria-label="compass">🧭</span>
            <span role="img" aria-label="map">🗺️</span>
          </div>

          {/* Big 404 */}
          <h1 className="text-[10rem] md:text-[14rem] font-black leading-none bg-gradient-to-r from-skyblue via-purple-400 to-pink-400 bg-clip-text text-transparent select-none">
            404
          </h1>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">
            Page not found
          </h2>

          {/* Description */}
          <p className="text-lg text-white/70 mb-10 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Looks like this route has no connecting flights.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white font-semibold rounded-xl transition"
            >
              Go Home
            </Link>
            <Link
              href="/mystery"
              className="px-8 py-3 bg-skyblue hover:bg-skyblue-dark text-navy font-bold rounded-xl transition"
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
