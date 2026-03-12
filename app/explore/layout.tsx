import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Layover Explorer | GlobePilot',
  description: 'Turn your layover into a bonus destination. Compare direct flights vs. multi-city stopover routes through major hub airports and save money.',
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
