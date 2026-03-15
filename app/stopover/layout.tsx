import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Stopover Finder — Save Money & Visit New Countries | GlobePilots',
  description: 'Find flights with multi-day stopovers that save money while adding a new country to your trip. Visa requirements checked automatically for your passport.',
  openGraph: {
    title: 'Smart Stopover Finder | GlobePilots',
    description: 'Turn layovers into free vacations. Real-time flight prices, visa checks, and cost analysis.',
  },
}

export default function StopoverLayout({ children }: { children: React.ReactNode }) {
  return children
}
