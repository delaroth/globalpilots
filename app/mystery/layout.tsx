import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Trip Planner — Mystery Vacation & Trip Planning | GlobePilots',
  description:
    'Set your budget and vibe. AI finds your perfect destination with live flight prices, daily cost breakdowns, and personalized itineraries.',
  keywords: [
    'mystery vacation',
    'surprise trip generator',
    'random vacation planner',
    'AI travel planner',
    'mystery trip',
    'surprise destination',
    'budget vacation generator',
  ],
  openGraph: {
    title: 'AI Trip Planner | GlobePilots',
    description:
      'Set your budget. Pick your vibe. Get surprised.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Trip Planner | GlobePilots',
    description:
      'Set your budget. Pick your vibe. Get surprised.',
  },
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GlobePilot Mystery Vacation Generator',
  url: 'https://globepilots.com/mystery',
  description:
    'AI-powered mystery vacation generator that surprises you with the perfect destination based on your budget, preferences, and travel style.',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function MysteryLayout({
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
