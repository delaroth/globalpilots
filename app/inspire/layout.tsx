import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inspire Me - Discover Your Next Destination | GlobePilot',
  description:
    'Not sure where to go? Browse cheap flights and destinations from around the world. Find budget-friendly adventures with real-time prices and daily cost breakdowns.',
  openGraph: {
    title: 'Inspire Me - Discover Your Next Destination | GlobePilot',
    description:
      'Not sure where to go? Browse cheap flights and destinations from around the world. Find budget-friendly adventures with real-time prices.',
    url: 'https://globepilots.com/inspire',
    siteName: 'GlobePilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@globepilots',
    title: 'Inspire Me - Discover Destinations | GlobePilot',
    description:
      'Scroll through destinations with real flight prices. Find your next adventure without knowing where you want to go.',
  },
  alternates: {
    canonical: 'https://globepilots.com/inspire',
  },
}

export default function InspireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
