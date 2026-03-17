import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plan My Trip — AI Trip Planner | GlobePilots',
  description:
    'Choose your destination and let AI plan the perfect trip. Get a custom itinerary, hotel recommendations, budget breakdown, and local tips — all in seconds.',
  keywords: [
    'AI trip planner',
    'trip planner',
    'travel itinerary generator',
    'vacation planner',
    'AI travel assistant',
    'trip budget calculator',
    'custom itinerary',
  ],
  openGraph: {
    title: 'Plan My Trip — AI Trip Planner | GlobePilots',
    description:
      'Choose your destination. AI plans the perfect trip with itinerary, hotels, budget breakdown, and insider tips.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plan My Trip — AI Trip Planner | GlobePilots',
    description:
      'Pick your destination, let AI handle the rest. Custom itinerary, real flight prices, and local tips.',
  },
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GlobePilots AI Trip Planner',
  url: 'https://globepilots.com/plan-my-trip',
  description:
    'AI-powered trip planner. Choose your destination and get a full itinerary, hotel recommendations, budget breakdown, and local tips.',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function PlanMyTripLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webAppJsonLd),
        }}
      />
      {children}
    </>
  )
}
