import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - GlobePilots',
  description:
    'Find answers to common questions about GlobePilots, Mystery Vacation, pricing, booking, privacy, and more.',
  openGraph: {
    title: 'FAQ - GlobePilots',
    description:
      'Find answers to common questions about GlobePilots, Mystery Vacation, pricing, booking, privacy, and more.',
    url: 'https://globepilots.com/faq',
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
