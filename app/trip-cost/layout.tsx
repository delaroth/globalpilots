import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trip Cost Calculator | GlobePilot',
  description:
    'Estimate your total trip cost for 60+ destinations worldwide. See daily breakdowns for hotels, food, transport, and activities across budget, mid-range, and comfort tiers.',
  keywords: [
    'trip cost calculator',
    'travel budget planner',
    'daily travel costs',
    'backpacker budget',
    'cost of travel',
    'how much does it cost to travel',
    'travel cost estimator',
    'destination budget guide',
  ],
  openGraph: {
    title: 'Trip Cost Calculator | GlobePilot',
    description:
      'Plan your travel budget with real cost data for 60+ destinations. Know exactly what to expect for hotels, food, transport, and activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trip Cost Calculator | GlobePilot',
    description:
      'Plan your travel budget with real cost data for 60+ destinations.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does it cost to travel per day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Daily travel costs vary widely by destination. Budget travellers can spend $20-40/day in Southeast Asia, $40-70 in Eastern Europe, and $80-150 in Western Europe or North America. Our Trip Cost Calculator provides detailed breakdowns for 60+ cities.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is included in the trip cost estimate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our estimates include accommodation, food, local transport, activities, and sightseeing. We provide three tiers — budget, mid-range, and comfort — so you can plan according to your travel style.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate are the trip cost estimates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our estimates are based on real traveller data and updated regularly. They represent typical daily spending for each tier and destination. Actual costs may vary based on season, personal preferences, and exchange rates.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the cheapest countries to travel to?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Some of the cheapest countries for budget travellers include Thailand, Vietnam, Cambodia, India, Bolivia, and Guatemala, where you can travel comfortably on $25-40 per day including accommodation, food, and activities.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the trip cost include flights?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Trip Cost Calculator focuses on destination costs (accommodation, food, transport, activities). For flight prices, use our Search Flights or Cheapest Destinations tools to find the best airfare deals.',
      },
    },
  ],
}

export default function TripCostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      {children}
    </>
  )
}
