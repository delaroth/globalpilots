import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Layover Arbitrage | GlobePilot',
  description: 'Save money by booking flights with a stopover instead of flying direct. Turn layovers into bonus destinations and save hundreds on international flights.',
}

export default function LayoverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
