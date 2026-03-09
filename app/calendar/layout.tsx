import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cheapest Days Calendar | GlobePilot',
  description: 'Find the cheapest day to fly with our interactive calendar. Compare flight prices for every day of the month and save on your next trip.',
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
