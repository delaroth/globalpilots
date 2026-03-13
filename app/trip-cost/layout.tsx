import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trip Cost Calculator | GlobePilot',
  description:
    'Estimate your total trip cost for 60+ destinations worldwide. See daily breakdowns for hotels, food, transport, and activities across budget, mid-range, and comfort tiers.',
  keywords: [
    'trip cost calculator',
    'travel budget planner',
    'daily travel costs',
    'backpacker budget',
    'cost of travel',
    'how much does it cost to travel',
    'travel cost estimator',
    'destination budget guide',
  ],
  openGraph: {
    title: 'Trip Cost Calculator | GlobePilot',
    description:
      'Plan your travel budget with real cost data for 60+ destinations. Know exactly what to expect for hotels, food, transport, and activities.',
    type: 'website',
  },
}

export default function TripCostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
