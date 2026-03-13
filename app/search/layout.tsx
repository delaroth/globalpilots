import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Flight Search — Flexible Dates & Calendar | GlobePilot',
  description:
    'Search flights with exact dates, monthly calendar view, or flexible day-of-week mode. Find the cheapest days to fly and save on your next trip.',
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
    title: 'Smart Flight Search | GlobePilot',
    description:
      'Search flights your way — exact dates, monthly calendar, or flexible day-of-week. Find the cheapest days to fly.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Flight Search | GlobePilot',
    description:
      'Flexible flight search with calendar view. Find the cheapest days to fly.',
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
