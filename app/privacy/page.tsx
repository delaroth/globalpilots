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
          <p className="text-skyblue-light mb-12">
            Last updated: March 2026
          </p>

          <div className="space-y-10 text-skyblue-light/90 leading-relaxed">
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

              <h3 className="text-lg font-semibold text-skyblue mb-2">
                Local Storage (Browser-Side Only)
              </h3>
              <p className="mb-4">
                We use your browser&apos;s localStorage to save your preferences, recent searches, and tool settings. This data never leaves your device and is not transmitted to our servers. You can clear this data at any time through your browser settings.
              </p>

              <h3 className="text-lg font-semibold text-skyblue mb-2">
                Account Information
              </h3>
              <p className="mb-4">
                If you create a GlobePilot account, we collect your email address and basic profile information. This data is stored securely via Supabase, our authentication and database provider.
              </p>

              <h3 className="text-lg font-semibold text-skyblue mb-2">
                Cookies
              </h3>
              <p>
                GlobePilot does not currently use cookies for tracking or advertising purposes. If this changes in the future, we will update this policy and notify you accordingly.
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
                <li className="pl-4 border-l-2 border-skyblue/30">
                  <span className="font-semibold text-white">TravelPayouts</span> &mdash; We use TravelPayouts to provide flight search results and booking links. When you click an affiliate link and make a booking, TravelPayouts may collect data in accordance with their own privacy policy.
                </li>
                <li className="pl-4 border-l-2 border-skyblue/30">
                  <span className="font-semibold text-white">Amadeus</span> &mdash; We use the Amadeus API to retrieve flight data, airport information, and travel analytics. Amadeus processes search queries but does not receive your personal information from us.
                </li>
                <li className="pl-4 border-l-2 border-skyblue/30">
                  <span className="font-semibold text-white">DeepSeek AI</span> &mdash; We use DeepSeek AI to power intelligent features such as the Mystery Vacation generator and trip suggestions. Search parameters may be sent to DeepSeek for processing, but no personally identifiable information is shared.
                </li>
                <li className="pl-4 border-l-2 border-skyblue/30">
                  <span className="font-semibold text-white">Supabase</span> &mdash; We use Supabase for user authentication and database storage. If you create an account, your email and profile data are stored securely on Supabase infrastructure.
                </li>
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
                We take reasonable measures to protect your information. Browser-stored data remains on your device, and any server-side data (such as account information) is protected through industry-standard encryption and security practices provided by our infrastructure partners.
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
                <li><span className="font-semibold text-white">Right to Erasure</span> &mdash; You may request that we delete your personal data. For locally stored data, you can clear your browser&apos;s localStorage at any time.</li>
                <li><span className="font-semibold text-white">Right to Data Portability</span> &mdash; You may request your data in a structured, machine-readable format.</li>
                <li><span className="font-semibold text-white">Right to Object</span> &mdash; You may object to the processing of your personal data at any time.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at the email address listed below.
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
              <p className="mt-2 text-skyblue font-semibold">
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
