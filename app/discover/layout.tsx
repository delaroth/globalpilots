import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cheapest Destinations | GlobePilot',
  description: 'Find the cheapest flight destinations from your airport. Browse the lowest fares and book your next adventure.',
}

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
