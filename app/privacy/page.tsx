import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-sky-300 mb-12">
            Last updated: March 16, 2026
          </p>

          <div className="space-y-10 text-sky-300/90 leading-relaxed">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Introduction
              </h2>
              <p>
                GlobePilot (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website at globepilots.com and our travel planning tools.
              </p>
              <p className="mt-3">
                By using GlobePilot, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of our services.
              </p>
            </div>

            {/* Data Collection */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Data We Collect
              </h2>
              <p className="mb-4">
                We are designed to be privacy-friendly. Here is what we collect and store:
              </p>

              <h3 className="text-lg font-semibold text-sky-400 mb-2">
                Account Data
              </h3>
              <p className="mb-4">
                If you create a GlobePilot account, we collect the following information depending on your sign-up method:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><span className="font-semibold text-white">Google OAuth</span> &mdash; Your name, email address, and profile picture as provided by Google.</li>
                <li><span className="font-semibold text-white">Email/password</span> &mdash; Your email address, display name, and a bcrypt hash of your password. We never store your password in plain text.</li>
              </ul>

              <h3 className="text-lg font-semibold text-sky-400 mb-2">
                Saved Activity &amp; Profile Data
              </h3>
              <p className="mb-4">
                When you use GlobePilot while signed in, we store your saved trips, Travel Passport stamps, badges, streak data, destination quiz results, and leaderboard entries in our database so they persist across sessions and devices.
              </p>

              <h3 className="text-lg font-semibold text-sky-400 mb-2">
                Local Storage (Browser-Side Only)
              </h3>
              <p className="mb-4">
                We use your browser&apos;s localStorage to save preferences and session data that never leaves your device. This includes your preferred currency, default origin airport, recent search history (origin airports, budget preferences), and trip history. You can clear this data at any time through your browser settings.
              </p>

              <h3 className="text-lg font-semibold text-sky-400 mb-2">
                Search History
              </h3>
              <p className="mb-4">
                When you use our tools, we may temporarily cache your search parameters (origin airports, destination preferences, budget ranges, travel dates) on our server to improve performance. Server-side search caches are automatically cleared after 1 hour.
              </p>
            </div>

            {/* Third-Party Services */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Third-Party Services
              </h2>
              <p className="mb-4">
                We integrate with the following third-party services to provide our travel planning tools:
              </p>

              <ul className="space-y-4">
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">SerpApi</span> &mdash; Provides Google Flights and Google Travel Explore data including live flight prices and destination suggestions. We send origin/destination airports, dates, and budget parameters. No personal data is shared.{' '}
                  <a href="https://serpapi.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">SerpApi Privacy Policy</a>.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">TravelPayouts</span> &mdash; Provides affiliate flight search results and booking links. We send origin/destination airports and travel dates. TravelPayouts may set cookies when you click booking links.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">DeepSeek AI</span> &mdash; Generates mystery destination itineraries, hotel recommendations, and local tips. We send destination names, budget tier, and travel preferences. No personal data (name, email, account info) is sent to DeepSeek.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Supabase</span> &mdash; Our database and infrastructure provider (PostgreSQL). Stores user accounts, saved trips, and activity feed data. All data is encrypted at rest and in transit.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Google OAuth</span> &mdash; Powers &ldquo;Sign in with Google&rdquo; authentication. We receive your name, email address, and profile picture from Google. We do not access your Google contacts, calendar, or any other Google data.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Frankfurter API</span> &mdash; Provides currency exchange rates (free, open-source). No user data is sent &mdash; only currency codes.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Open-Meteo</span> &mdash; Provides weather forecast data for destinations. No user data is sent &mdash; only destination coordinates.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Wikipedia</span> &mdash; Provides nearby attraction information. No user data is sent &mdash; only destination coordinates.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Pexels</span> &mdash; Provides destination photos. No user data is sent &mdash; only destination names.
                </li>
                <li className="pl-4 border-l-2 border-sky-500/30">
                  <span className="font-semibold text-white">Resend</span> &mdash; Handles transactional emails including contact form replies and price alert notifications. We send your email address to Resend for delivery purposes only.
                </li>
              </ul>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Cookies &amp; Local Storage
              </h2>
              <p className="mb-4">
                GlobePilot uses a cookie consent banner to give you control over cookie usage. Here is how we use cookies and browser storage:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="font-semibold text-white">Essential cookies</span> &mdash; Used for authentication sessions when you sign in to your account.</li>
                <li><span className="font-semibold text-white">Affiliate cookies</span> &mdash; Third-party booking partners (e.g., TravelPayouts) may set cookies when you click affiliate links.</li>
                <li><span className="font-semibold text-white">localStorage</span> &mdash; We store your preferred currency, default origin airport, and trip history in your browser&apos;s localStorage. This data never leaves your device and can be cleared at any time via your browser settings.</li>
              </ul>
              <p className="mt-4">
                We do not use cookies for advertising or behavioral tracking purposes.
              </p>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Data Retention
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="font-semibold text-white">Account data</span> &mdash; Retained until you request deletion of your account. You can request account deletion at any time by emailing us.</li>
                <li><span className="font-semibold text-white">Saved trips &amp; profile data</span> &mdash; Retained as long as your account is active. Deleted when your account is deleted.</li>
                <li><span className="font-semibold text-white">Server-side search cache</span> &mdash; Automatically cleared after 1 hour.</li>
                <li><span className="font-semibold text-white">localStorage data</span> &mdash; Controlled entirely by you. Persists until you clear it through your browser settings or our in-app controls.</li>
              </ul>
            </div>

            {/* Affiliate Links */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Affiliate Links
              </h2>
              <p>
                GlobePilot contains affiliate links to third-party booking platforms. When you click these links and complete a purchase, we may earn a commission at no additional cost to you. These affiliate partners may use their own cookies and tracking technologies, which are governed by their respective privacy policies.
              </p>
            </div>

            {/* Analytics */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Analytics
              </h2>
              <p>
                We may use privacy-friendly analytics to understand how our tools are used and to improve the user experience. We do not use invasive tracking tools, and we do not build advertising profiles based on your browsing behavior.
              </p>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Data Security
              </h2>
              <p>
                We take reasonable measures to protect your information. Browser-stored data remains on your device. Server-side data (account information, saved trips) is protected through industry-standard encryption and security practices provided by Supabase. Passwords are hashed using bcrypt and are never stored in plain text.
              </p>
            </div>

            {/* Your Rights (GDPR) */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Your Rights
              </h2>
              <p className="mb-4">
                Under the General Data Protection Regulation (GDPR) and similar privacy laws, you have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="font-semibold text-white">Right of Access</span> &mdash; You may request a copy of the personal data we hold about you.</li>
                <li><span className="font-semibold text-white">Right to Rectification</span> &mdash; You may request that we correct inaccurate or incomplete data.</li>
                <li><span className="font-semibold text-white">Right to Erasure</span> &mdash; You may request that we delete your personal data, including your account and all associated data. For locally stored data, you can clear your browser&apos;s localStorage at any time.</li>
                <li><span className="font-semibold text-white">Right to Data Portability</span> &mdash; You may request your data in a structured, machine-readable format.</li>
                <li><span className="font-semibold text-white">Right to Object</span> &mdash; You may object to the processing of your personal data at any time.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, including account deletion, please email us at{' '}
                <span className="text-sky-400 font-semibold">privacy@globepilots.com</span>.
                We will respond to all requests within 30 days.
              </p>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Children&apos;s Privacy
              </h2>
              <p>
                GlobePilot is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a child, please contact us and we will promptly delete it.
              </p>
            </div>

            {/* Changes to This Policy */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. We encourage you to review this policy periodically.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:
              </p>
              <p className="mt-2 text-sky-400 font-semibold">
                privacy@globepilots.com
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
