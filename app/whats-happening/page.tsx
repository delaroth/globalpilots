import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import FestivalFilter from '@/components/FestivalFilter'
import { FESTIVALS, MONTH_NAMES } from '@/data/festivals'

function generateJsonLd() {
  const events = FESTIVALS.filter(f => f.iata).slice(0, 50).map(f => {
    const year = 2026
    const startDate = f.startDay
      ? `${year}-${String(f.month).padStart(2, '0')}-${String(f.startDay).padStart(2, '0')}`
      : `${year}-${String(f.month).padStart(2, '0')}-01`
    const endDate = f.endDay
      ? `${year}-${String(f.endDay > (f.startDay || 1) ? f.month : f.month + 1).padStart(2, '0')}-${String(f.endDay).padStart(2, '0')}`
      : startDate

    return {
      '@type': 'Event',
      name: f.name,
      description: f.description,
      startDate,
      endDate,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: f.city,
        address: {
          '@type': 'PostalAddress',
          addressLocality: f.city,
          addressCountry: f.countryCode,
        },
      },
    }
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Festivals & Events Calendar',
    description: 'A curated list of 100+ festivals and events worldwide to help plan your next adventure.',
    numberOfItems: FESTIVALS.length,
    itemListElement: events.map((event, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: event,
    })),
  }
}

export default function WhatsHappeningPage() {
  const currentMonth = new Date().getMonth() + 1 // 1-12
  const jsonLd = generateJsonLd()

  // Compute some stats for the header
  const countriesSet = new Set(FESTIVALS.map(f => f.country))
  const totalFestivals = FESTIVALS.length
  const totalCountries = countriesSet.size

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <Navigation />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            <span className="mr-2" role="img" aria-label="party">&#x1F389;</span>
            What&apos;s Happening Around the World
          </h1>
          <p className="text-skyblue-light text-lg sm:text-xl max-w-2xl">
            Discover festivals &amp; events to time your mystery vacation perfectly.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/50">
            <span>{totalFestivals} events</span>
            <span>&middot;</span>
            <span>{totalCountries} countries</span>
            <span>&middot;</span>
            <span>Every month covered</span>
          </div>
        </div>

        {/* Client-side interactive filter + cards */}
        <FestivalFilter festivals={FESTIVALS} currentMonth={currentMonth} />
      </main>

      <Footer />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
