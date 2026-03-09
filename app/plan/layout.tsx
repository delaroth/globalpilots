import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Trip Planner | GlobePilot',
  description: 'Chat with our AI travel expert to plan your perfect budget trip. Get personalized destination recommendations, flight prices, and travel advice.',
}

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
