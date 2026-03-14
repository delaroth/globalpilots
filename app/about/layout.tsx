import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About GlobePilot | How It Works',
  description:
    'Discover how GlobePilot helps travellers plan adventures with any budget: Mystery Vacation, Multi-City Planner, Trip Cost Calculator, and more.',
  keywords: [
    'about GlobePilot',
    'budget travel tools',
    'how it works',
    'mystery vacation',
    'layover explorer',
    'multi-city planner',
    'flight search',
    'cheapest destinations',
    'trip cost calculator',
  ],
  openGraph: {
    title: 'About GlobePilot | How It Works',
    description:
      'Budget in. Adventure out. Discover how GlobePilot helps travellers plan adventures with any budget.',
    type: 'website',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
