import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | GlobePilot',
  description:
    'Terms of Service for GlobePilot. Understand our service description, affiliate disclaimers, limitation of liability, and user conduct policies.',
  openGraph: {
    title: 'Terms of Service | GlobePilot',
    description:
      'Terms of Service for GlobePilot. Understand our policies for using our travel planning tools.',
    type: 'website',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
