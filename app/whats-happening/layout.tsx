import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Festivals & Events Calendar | Plan Your Mystery Trip Around an Event | GlobePilot',
  description:
    'Discover 100+ festivals and events worldwide. Time your mystery vacation to coincide with Holi, Oktoberfest, Cherry Blossom season, Carnival, and more. Find the perfect festival trip.',
  keywords: [
    'festival calendar',
    'world events',
    'travel festivals',
    'Holi festival',
    'Oktoberfest',
    'Cherry Blossom season',
    'Songkran',
    'Carnival Brazil',
    'mystery trip',
    'festival travel planner',
    'when to visit',
    'global events calendar',
  ],
  openGraph: {
    title: 'Festivals & Events Calendar | GlobePilot',
    description:
      'Discover 100+ festivals and events worldwide. Time your mystery vacation to coincide with the world\'s best celebrations.',
    url: 'https://globepilots.com/whats-happening',
    siteName: 'GlobePilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@globepilots',
    title: 'Festivals & Events Calendar | GlobePilot',
    description:
      'Discover 100+ festivals and events worldwide. Time your mystery vacation to coincide with the world\'s best celebrations.',
  },
  alternates: {
    canonical: 'https://globepilots.com/whats-happening',
  },
}

export default function WhatsHappeningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
