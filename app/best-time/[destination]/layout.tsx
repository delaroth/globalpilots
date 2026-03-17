import { Metadata } from 'next'
import { getAllDestinations } from '@/lib/destination-costs'

function slugify(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ destination: string }>
}): Promise<Metadata> {
  const { destination } = await params
  const all = getAllDestinations()
  const dest = all.find((d) => slugify(d.city) === destination)

  if (!dest) return { title: 'Not Found' }

  const bestMonthNames = dest.bestMonths.map(
    (m) =>
      [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ][m - 1]
  )

  const title = `Best Time to Visit ${dest.city} — Weather, Prices & Tips | GlobePilots`
  const description = `Find out the best time to visit ${dest.city}, ${dest.country}. Best months: ${bestMonthNames.join(', ')}. Weather guide, budget comparison, and money-saving tips.`

  return {
    title,
    description,
    keywords: [
      `best time to visit ${dest.city}`,
      `${dest.city} weather by month`,
      `${dest.city} travel season`,
      `when to visit ${dest.city}`,
      `cheapest time to visit ${dest.city}`,
      `${dest.city} shoulder season`,
      `${dest.city} ${dest.country} travel tips`,
    ],
    openGraph: {
      title,
      description,
      url: `https://globepilots.com/best-time/${destination}`,
      type: 'article',
    },
    alternates: {
      canonical: `https://globepilots.com/best-time/${destination}`,
    },
  }
}

export default function BestTimeDestinationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
