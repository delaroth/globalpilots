import Link from 'next/link'
import EmailCapture from '@/components/EmailCapture'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const columns = [
    {
      title: 'Find Flights',
      links: [
        { href: '/search', label: 'Flight Search' },
        { href: '/search?tab=stopovers', label: 'Smart Stopovers' },
        { href: '/search?tab=multi', label: 'Multi-city' },
      ],
    },
    {
      title: 'Plan',
      links: [
        { href: '/trip-cost', label: 'Trip Costs' },
        { href: '/whats-happening', label: 'Festival Calendar' },
        { href: '/inspire', label: 'Inspire Me' },
        { href: '/quiz', label: 'Destination Quiz' },
        { href: '/day-trip', label: 'Day Trip Planner' },
      ],
    },
    {
      title: 'Deals',
      links: [
        { href: '/deals', label: "This Month's Deals" },
        { href: '/deals?mode=quick', label: 'Quick Escape' },
        { href: '/leaderboard', label: 'Leaderboard' },
      ],
    },
  ]

  return (
    <footer className="w-full bg-slate-950 border-t border-sky-500/20 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                <span className="text-slate-900 text-xl font-bold">G</span>
              </div>
              <span className="text-white text-2xl font-bold">GlobePilot</span>
            </div>
            <p className="text-sky-300 text-sm mb-4">
              Set your budget. Pick your vibe. Get surprised.
            </p>
            {/* Mystery Vacation — prominent standalone link */}
            <Link
              href="/mystery"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition mb-3"
            >
              Mystery Vacation
            </Link>
            <p className="text-sky-300/70 text-xs">
              AI-powered travel planning that finds your perfect mystery destination.
            </p>
          </div>

          {/* Feature columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-white font-semibold mb-3 text-sm">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sky-300 text-sm hover:text-sky-400 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* About column fills the remaining space */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">About</h3>
            <ul className="space-y-2 text-sky-300 text-sm">
              <li>
                <Link href="/about" className="hover:text-sky-400 transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sky-400 transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sky-400 transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-sky-400 transition">
                  All Tools
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-8">
          <div className="col-span-2" />
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Legal</h3>
            <ul className="space-y-2 text-sky-300 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-sky-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sky-400 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Deal Alerts Signup */}
        <div className="border-t border-sky-500/20 pt-8 pb-8 max-w-md">
          <EmailCapture context="footer" />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sky-500/20 pt-8 text-center">
          <p className="text-sky-300 text-sm">
            &copy; {currentYear} GlobePilot. Built with &#10084;&#65039; for travellers.
          </p>
          <p className="text-sky-300/70 text-xs mt-2">
            Powered by TravelPayouts & DeepSeek AI
          </p>
          <p className="text-white/30 text-xs mt-3">
            Some links on this site are affiliate links. We may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  )
}
