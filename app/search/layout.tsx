import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Flight Search — Live Google Flights Prices | GlobePilots',
  description:
    'Compare real-time flight prices, flexible dates, nearby airports, and smart stopovers. Find the cheapest way to fly.',
  keywords: [
    'flight search',
    'cheap flights',
    'flexible date flights',
    'flight calendar',
    'cheapest days to fly',
    'budget flights',
    'flight comparison',
  ],
  openGraph: {
    title: 'Smart Flight Search | GlobePilots',
    description:
      'Compare real-time flight prices, flexible dates, nearby airports, and smart stopovers. Find the cheapest way to fly.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Flight Search | GlobePilots',
    description:
      'Compare real-time flight prices, flexible dates, nearby airports, and smart stopovers. Find the cheapest way to fly.',
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
