import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Layover Explorer — Turn Connections Into Trips | GlobePilot',
  description:
    'Save money by turning layovers into mini-vacations. Compare direct flights vs. multi-city stopover routes through major hub airports and explore a bonus city.',
  keywords: [
    'layover explorer',
    'stopover flights',
    'layover hack',
    'hidden city flights',
    'multi-city stopover',
    'cheap flight hack',
    'hub airport layover',
  ],
  openGraph: {
    title: 'Layover Explorer | GlobePilot',
    description:
      'Turn your layover into a bonus destination. Compare direct flights vs. stopover routes and save money while exploring more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Layover Explorer | GlobePilot',
    description:
      'Turn layovers into mini-vacations. Compare direct vs. stopover routes and explore a bonus city.',
  },
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
