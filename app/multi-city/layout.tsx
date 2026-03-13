import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-City Trip Planner | GlobePilot',
  description: 'Plan the perfect multi-city adventure with AI. Set your budget, choose your vibes, and let our AI optimize your route across 2-5 cities with smart flight connections and budget allocation.',
  openGraph: {
    title: 'Multi-City Trip Planner | GlobePilot',
    description: 'AI-powered multi-city trip planning. Optimized routes, smart budgets, and unforgettable adventures across multiple destinations.',
    type: 'website',
  },
}

export default function MultiCityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
