import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaderboard — Cheapest Mystery Trip Discoveries | GlobePilot',
  description:
    'See who found the cheapest mystery vacation deals this week. Browse real trip discoveries ranked by cost — can you beat the leaderboard?',
  openGraph: {
    title: 'Leaderboard — Cheapest Mystery Trip Discoveries',
    description:
      'See who found the cheapest mystery vacation deals this week.',
    url: 'https://globepilots.com/leaderboard',
    siteName: 'GlobePilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard — Cheapest Mystery Trip Discoveries',
    description:
      'See who found the cheapest mystery vacation deals this week.',
  },
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
