import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seasonal Flight Deals - Cheapest Destinations by Month | GlobePilot',
  description:
    'Find the cheapest flights for any month of the year. Browse seasonal travel deals, compare prices, and book your next budget-friendly trip.',
  keywords: [
    'cheap flights',
    'seasonal deals',
    'flight deals by month',
    'budget travel',
    'cheapest destinations',
    'travel deals',
  ],
  openGraph: {
    title: 'Seasonal Flight Deals | GlobePilot',
    description:
      'Browse the cheapest flight deals by month. Find the perfect time to visit any destination worldwide.',
    url: 'https://globepilots.com/deals',
    siteName: 'GlobePilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seasonal Flight Deals | GlobePilot',
    description:
      'Cheapest flights by month. Find when to fly for the best prices.',
  },
  alternates: {
    canonical: 'https://globepilots.com/deals',
  },
}

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
