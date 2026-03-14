import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Travel Planning Tools | GlobePilot',
  description:
    'Explore free travel planning tools: Mystery Vacation Generator, Multi-City Planner, Trip Cost Calculator, and more.',
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
      'Free AI-powered travel tools to plan your perfect adventure.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Travel Planning Tools | GlobePilot',
    description:
      'Free AI-powered travel tools to plan your perfect adventure.',
  },
}

const toolsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'GlobePilot Free Travel Planning Tools',
  description: 'Free AI-powered tools to help you plan your next adventure.',
  numberOfItems: 3,
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
