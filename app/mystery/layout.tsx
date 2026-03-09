import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mystery Vacation | GlobePilot',
  description: 'Let AI surprise you with the perfect destination based on your budget, preferences, and travel style. Your next adventure awaits!',
}

export default function MysteryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
