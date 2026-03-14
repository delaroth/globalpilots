import type { Metadata } from 'next'
import { majorAirports } from '@/lib/geolocation'

export async function generateMetadata({ params }: { params: Promise<{ from: string }> }): Promise<Metadata> {
  const { from } = await params
  const code = from.toUpperCase()
  const airport = majorAirports.find(a => a.code === code)
  const cityName = airport?.city ?? code
  const country = airport?.country ?? ''

  const title = `Mystery Flights from ${cityName} (${code}) | Surprise Trips | GlobePilot`
  const description = `Discover surprise vacation deals from ${cityName}${country ? `, ${country}` : ''}. Our AI picks the perfect mystery destination within your budget. Free to use.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'GlobePilot',
      url: `https://globepilots.com/mystery-flights/${code}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://globepilots.com/mystery-flights/${code}`,
    },
  }
}

export default function MysteryFlightsFromLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
