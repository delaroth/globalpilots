import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-City Trip Planner | GlobePilot',
  description: 'Plan the perfect multi-city adventure with AI. Set your budget, choose your vibes, and let our AI optimize your route across 2-5 cities with smart flight connections and budget allocation.',
  openGraph: {
    title: 'Multi-City Trip Planner | GlobePilot',
    description: 'AI-powered multi-city trip planning. Optimized routes, smart budgets, and unforgettable adventures across multiple destinations.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-City Trip Planner | GlobePilot',
    description: 'AI-powered multi-city trip planning with optimized routes and smart budgets.',
  },
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GlobePilot Multi-City Trip Planner',
  url: 'https://globepilots.com/multi-city',
  description:
    'Plan an optimized multi-stop adventure across 2-5 cities. AI handles route planning, budget allocation, and flight connections.',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function MultiCityLayout({
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
