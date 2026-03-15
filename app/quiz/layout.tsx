import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Destination Quiz — Which Mystery Trip Suits You? | GlobePilot',
  description:
    'Take our fun 60-second quiz to discover your ideal mystery vacation destination. Match your travel personality with the perfect trip — then book it instantly.',
  openGraph: {
    title: 'Destination Quiz — Which Mystery Trip Suits You?',
    description:
      'Take our fun 60-second quiz to discover your ideal mystery vacation destination.',
    url: 'https://globepilots.com/quiz',
    siteName: 'GlobePilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Destination Quiz — Which Mystery Trip Suits You?',
    description:
      'Take our fun 60-second quiz to discover your ideal mystery vacation destination.',
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
