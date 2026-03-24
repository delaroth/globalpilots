import { Metadata } from 'next'

interface LayoutProps {
  children: React.ReactNode
  params: { id: string }
}

async function getTripData(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(`${baseUrl}/api/trips/${id}`, {
      cache: 'no-store',
    })

    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const trip = await getTripData(params.id)

  if (!trip || !trip.destinationData) {
    return {
      title: 'Mystery Vacation | GlobePilot',
      description: 'Check out this AI-generated mystery vacation from GlobePilot!',
    }
  }

  const dest = trip.destinationData
  const totalCost = dest._meta?.totalCost
    || dest.budgetBreakdown?.total
    || (dest.budget_breakdown
      ? Object.values(dest.budget_breakdown as Record<string, number>).reduce((s: number, v: number) => s + v, 0)
      : 0)

  const nights = dest.daily_itinerary?.length
    || dest.itinerary?.length
    || (dest.day1 ? 3 : 3)

  const title = `Mystery Vacation: ${dest.destination}, ${dest.country} for $${Math.round(totalCost)} | GlobePilot`
  const description = dest.whyThisPlace || dest.why_its_perfect
    || `A ${nights}-night AI-picked mystery trip to ${dest.destination}, ${dest.country}. Flights, hotels, and a full itinerary — all within budget.`

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const ogImageUrl = `${baseUrl}/api/og?${new URLSearchParams({
    title: `Mystery Vacation: ${dest.destination}`,
    subtitle: `$${Math.round(totalCost)} total — flights, hotels & itinerary included`,
    type: 'mystery',
  }).toString()}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'GlobePilot',
      url: `https://globepilots.com/trips/${params.id}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function TripLayout({ children }: LayoutProps) {
  return <>{children}</>
}
