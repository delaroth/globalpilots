import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - GlobePilots',
  description:
    'Get in touch with the GlobePilots team. Report bugs, suggest features, or explore partnership opportunities.',
  openGraph: {
    title: 'Contact Us - GlobePilots',
    description:
      'Get in touch with the GlobePilots team. Report bugs, suggest features, or explore partnership opportunities.',
    url: 'https://globepilots.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
