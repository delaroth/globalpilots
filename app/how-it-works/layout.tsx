import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works — Plan Trips & Find Flights | GlobePilot',
  description:
    'Learn how GlobePilot helps you plan multi-city trips, discover budget destinations, and estimate trip costs with free AI-powered travel tools.',
  keywords: [
    'how to find cheap flights',
    'layover hack flights',
    'budget travel tips',
    'how to plan a trip',
    'cheap flight tricks',
    'multi-city trip planning',
    'travel budget tips',
    'flight search tips',
  ],
  openGraph: {
    title: 'How It Works | GlobePilot',
    description:
      'Discover how GlobePilot helps you plan trips, find flights, and explore destinations with AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | GlobePilot',
    description:
      'Learn how to plan trips, find flights, and explore destinations with GlobePilot.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find the cheapest flights?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use GlobePilot\'s Smart Flight Search with flexible date mode to compare prices across different days. The calendar view highlights the cheapest dates, and our Cheapest Destinations tool shows you the lowest fares from your airport.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a layover hack?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A layover hack involves booking a multi-city itinerary through a hub airport instead of a direct flight. You get to explore a bonus city during your connection, often for the same price or less than a direct flight. GlobePilot\'s Layover Explorer automates this by comparing direct vs. stopover routes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is GlobePilot free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all GlobePilot tools are completely free to use with no sign-up required. This includes Mystery Vacation (single or multi-city) and Trip Cost Calculator.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the Mystery Vacation generator work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Set your budget, departure airport, and travel preferences (like beach, culture, or adventure). Our AI analyzes real flight data and destination costs to surprise you with the perfect vacation that fits your budget, including flights, accommodation, and activities.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I plan a multi-city trip on a budget?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use GlobePilot\'s Mystery Vacation tool — it supports multi-city trips. Set your total budget and select 2-5 cities. AI optimizes your route order for the cheapest flights, allocates your budget across cities based on local costs, and finds the best connections between stops.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate are the flight prices shown?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'GlobePilot uses real-time data from major flight search APIs. Prices shown are actual fares available at the time of search. We link directly to booking partners so you can lock in the price you see.',
      },
    },
  ],
}

export default function HowItWorksLayout({
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
