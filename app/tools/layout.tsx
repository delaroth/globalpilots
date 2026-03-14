import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Travel Planning Tools — 6 Smart Tools | GlobePilot',
  description:
    'Explore 6 free travel planning tools: Mystery Vacation Generator, Layover Explorer, Multi-City Planner, Smart Flight Search, Budget Calculator, and more.',
  keywords: [
    'free travel planning tools',
    'budget travel calculator',
    'mystery vacation generator',
    'flight search tools',
    'layover explorer',
    'multi-city planner',
    'trip cost calculator',
    'cheapest destinations',
  ],
  openGraph: {
    title: 'Free Travel Planning Tools | GlobePilot',
    description:
      'Explore 6 free AI-powered travel tools to plan your perfect budget adventure.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Travel Planning Tools | GlobePilot',
    description:
      'Explore 6 free AI-powered travel tools to plan your perfect budget adventure.',
  },
}

const toolsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'GlobePilot Free Travel Planning Tools',
  description: '6 free AI-powered tools to help budget travellers plan their next adventure.',
  numberOfItems: 6,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Mystery Vacation Generator',
      url: 'https://globepilots.com/mystery',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Layover Explorer',
      url: 'https://globepilots.com/explore',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Multi-City Trip Planner',
      url: 'https://globepilots.com/multi-city',
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Smart Flight Search',
      url: 'https://globepilots.com/search',
    },
    {
      '@type': 'ListItem',
      position: 5,
      name: 'Cheapest Destinations',
      url: 'https://globepilots.com/discover',
    },
    {
      '@type': 'ListItem',
      position: 6,
      name: 'Trip Cost Calculator',
      url: 'https://globepilots.com/trip-cost',
    },
  ],
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(toolsJsonLd),
        }}
      />
      {children}
    </>
  )
}
