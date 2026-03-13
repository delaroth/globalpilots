import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-skyblue-light mb-12">
            Last updated: March 2026
          </p>

          <div className="space-y-10 text-skyblue-light/90 leading-relaxed">
            {/* Agreement */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Agreement to Terms
              </h2>
              <p>
                By accessing or using GlobePilot (&ldquo;the Service&rdquo;), available at globepilots.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </div>

            {/* Service Description */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Service Description
              </h2>
              <p className="mb-4">
                GlobePilot provides AI-powered travel planning tools designed to help budget travellers discover destinations, compare routes, and estimate costs. Our tools include:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Mystery Vacation &mdash; AI-generated surprise destination suggestions</li>
                <li>Layover Explorer &mdash; Find creative stopover opportunities</li>
                <li>Multi-City Planner &mdash; Plan routes across multiple destinations</li>
                <li>Smart Flight Search &mdash; Search and compare flight options</li>
                <li>Cheapest Destinations &mdash; Discover affordable places to fly</li>
                <li>Trip Cost Calculator &mdash; Estimate total trip expenses</li>
                <li>Price Alerts &mdash; Get notified when fares drop</li>
              </ul>
              <p>
                These tools are intended for informational and planning purposes. We do not sell airline tickets, hotel rooms, or travel insurance directly. All bookings are completed through third-party providers.
              </p>
            </div>

            {/* Price Data Disclaimer */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Price Data and Accuracy
              </h2>
              <p className="mb-4">
                Flight prices, cost estimates, and travel data displayed on GlobePilot are sourced from third-party providers including TravelPayouts, Amadeus, and other data partners. This data is provided on an &ldquo;as-is&rdquo; basis.
              </p>
              <div className="bg-navy-light/50 border border-skyblue/20 rounded-lg p-4">
                <p className="text-white font-semibold mb-2">Important:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Prices shown are estimates and may not reflect real-time availability or final booking prices.</li>
                  <li>Fares can change at any time due to airline pricing, demand, currency fluctuations, and other factors.</li>
                  <li>We recommend verifying all prices on the booking provider&apos;s website before completing any purchase.</li>
                  <li>Trip cost estimates (hotels, food, transport, activities) are based on aggregated data and may vary significantly based on season, location, and personal preferences.</li>
                </ul>
              </div>
            </div>

            {/* Affiliate Disclaimer */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Affiliate Relationships
              </h2>
              <p className="mb-4">
                GlobePilot participates in affiliate programs, including the TravelPayouts affiliate network. This means:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>When you click on booking links on our site and complete a purchase, we may earn a commission.</li>
                <li>This commission comes at no additional cost to you &mdash; the price you pay is the same whether or not you use our links.</li>
                <li>Affiliate relationships do not influence our search results or tool recommendations. Our tools display results based on your search criteria, not on commission rates.</li>
              </ul>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Limitation of Liability
              </h2>
              <p className="mb-4">
                To the maximum extent permitted by applicable law:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>GlobePilot is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied.</li>
                <li>We do not guarantee the accuracy, completeness, or timeliness of any price data, flight information, or cost estimates.</li>
                <li>We are not responsible for any losses, damages, or expenses arising from reliance on information provided through our tools.</li>
                <li>We are not liable for any issues arising from bookings made through third-party providers linked from our site.</li>
                <li>We do not guarantee uninterrupted or error-free operation of the Service.</li>
              </ul>
              <p>
                Your use of any information or materials on GlobePilot is entirely at your own risk. It is your responsibility to verify all travel information, prices, and booking details before making financial commitments.
              </p>
            </div>

            {/* User Conduct */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                User Conduct
              </h2>
              <p className="mb-4">
                When using GlobePilot, you agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
                <li>Attempt to gain unauthorized access to our systems, servers, or data.</li>
                <li>Use automated tools, bots, or scrapers to extract data from the Service without our express written consent.</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service.</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
                <li>Use the Service in any way that could damage, disable, or impair its functionality.</li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Intellectual Property
              </h2>
              <p className="mb-4">
                All content, features, and functionality of GlobePilot &mdash; including but not limited to text, graphics, logos, icons, code, and software &mdash; are the property of GlobePilot and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You may not reproduce, distribute, modify, or create derivative works from any part of the Service without our prior written consent.
              </p>
            </div>

            {/* Third-Party Links */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Third-Party Links and Services
              </h2>
              <p>
                GlobePilot contains links to third-party websites and services, including airline booking platforms. We are not responsible for the content, privacy practices, or terms of service of any third-party sites. We encourage you to review the terms and privacy policies of any third-party service before engaging with them.
              </p>
            </div>

            {/* Account Terms */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Account Terms
              </h2>
              <p className="mb-4">
                If you create a GlobePilot account:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You are responsible for all activities that occur under your account.</li>
                <li>You must provide accurate and complete information when creating your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
              </ul>
            </div>

            {/* Modifications */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Modifications to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated date. Your continued use of the Service after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Governing Law
              </h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with applicable international laws. Any disputes arising from the use of the Service shall be resolved through good-faith negotiation first, and if necessary, through binding arbitration.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2 text-skyblue font-semibold">
                legal@globepilots.com
              </p>
              <p className="mt-4">
                For privacy-related inquiries, please see our{' '}
                <Link href="/privacy" className="text-skyblue hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
