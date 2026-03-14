import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About GlobePilot | How It Works',
  description:
    'Discover how GlobePilot helps budget travellers plan adventures with 6 smart tools: Mystery Vacation, Layover Explorer, Multi-City Planner, Smart Flight Search, and more.',
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
      'Budget in. Adventure out. Discover how GlobePilot helps budget travellers plan adventures with 6 smart travel tools.',
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
