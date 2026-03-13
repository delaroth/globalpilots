import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cheapest Flight Destinations From Your Airport | GlobePilot',
  description:
    'Find the 5 cheapest places to fly from any airport. Browse real-time low fares, discover budget-friendly destinations, and book your next adventure for less.',
  keywords: [
    'cheapest flights',
    'cheap destinations',
    'budget flights',
    'cheapest places to fly',
    'low fare finder',
    'flight deals',
    'discount airfare',
  ],
  openGraph: {
    title: 'Cheapest Flight Destinations | GlobePilot',
    description:
      'Find the cheapest flight destinations from your airport. Browse the lowest fares and book your next adventure.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cheapest Flight Destinations | GlobePilot',
    description:
      'Find the cheapest places to fly from any airport with real-time fare data.',
  },
}

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
