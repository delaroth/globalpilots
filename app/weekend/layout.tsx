import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekend Deals | GlobePilot',
  description: 'Find cheap weekend getaways from your city. Discover affordable spontaneous trips and book your next weekend adventure.',
}

export default function WeekendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
