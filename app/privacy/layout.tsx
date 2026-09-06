import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | GlobePilot',
  description:
    'Learn how GlobePilot handles account, product, analytics, and browser data and how to control optional analytics.',
  openGraph: {
    title: 'Privacy Policy | GlobePilot',
    description:
      'Learn how GlobePilot handles account, product, analytics, and browser data and how to control optional analytics.',
    type: 'website',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
