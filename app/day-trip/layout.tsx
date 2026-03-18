import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Day Trip Planner — AI-Powered City Itineraries | GlobePilots',
  description:
    'Plan the perfect day out. AI generates personalized itineraries with restaurants, activities, and budget breakdowns for any city.',
  openGraph: {
    title: 'Day Trip Planner — AI-Powered City Itineraries | GlobePilots',
    description:
      'Plan the perfect day out. AI generates personalized itineraries with restaurants, activities, and budget breakdowns for any city.',
  },
}

export default function DayTripLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
