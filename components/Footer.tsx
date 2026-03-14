import Link from 'next/link'
import EmailCapture from '@/components/EmailCapture'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const features = [
    { href: '/mystery', label: 'Mystery Vacation' },
    { href: '/explore', label: 'Layover Explorer' },
    { href: '/multi-city', label: 'Multi-City Planner' },
    { href: '/search', label: 'Smart Flight Search' },
    { href: '/discover', label: 'Cheapest Destinations' },
    { href: '/trip-cost', label: 'Trip Cost Calculator' },
  ]

  return (
    <footer className="w-full bg-navy-dark border-t border-skyblue/20 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-skyblue rounded-full flex items-center justify-center">
                <span className="text-navy text-xl font-bold">G</span>
              </div>
              <span className="text-white text-2xl font-bold">GlobePilot</span>
            </div>
            <p className="text-skyblue-light text-sm mb-4">
              Budget in. Adventure out.
            </p>
            <p className="text-skyblue-light/70 text-xs">
              AI-powered budget travel planning that finds the best flight deals for your next adventure.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature.href}>
                  <Link
                    href={feature.href}
                    className="text-skyblue-light text-sm hover:text-skyblue transition"
                  >
                    {feature.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <ul className="space-y-2 text-skyblue-light text-sm">
              <li>
                <a href="https://globepilots.com" target="_blank" rel="noopener noreferrer" className="hover:text-skyblue transition">
                  GlobePilots.com
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-skyblue transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-skyblue transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-skyblue transition">
                  Terms of Service
                </Link>
              </li>
            </ul>

            {/* Social Links Placeholder */}
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-skyblue-light hover:text-skyblue transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-skyblue-light hover:text-skyblue transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Deal Alerts Signup */}
        <div className="border-t border-skyblue/20 pt-8 pb-8 max-w-md">
          <EmailCapture context="footer" />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-skyblue/20 pt-8 text-center">
          <p className="text-skyblue-light text-sm">
            &copy; {currentYear} GlobePilot. Built with ❤️ for budget travellers.
          </p>
          <p className="text-skyblue-light/70 text-xs mt-2">
            Powered by TravelPayouts & DeepSeek AI
          </p>
        </div>
      </div>
    </footer>
  )
}
