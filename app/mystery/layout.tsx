import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mystery Vacation Generator — AI Picks Your Trip | GlobePilot',
  description:
    'Let AI surprise you with the perfect vacation. Set your budget and preferences, and discover an unexpected dream destination with flights, hotels, and activities included.',
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
    title: 'Mystery Vacation Generator | GlobePilot',
    description:
      'Set your budget, pick your vibes, and let AI surprise you with the perfect destination. Your next adventure awaits!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mystery Vacation Generator | GlobePilot',
    description:
      'Let AI surprise you with the perfect vacation destination based on your budget and preferences.',
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
