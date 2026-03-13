import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | GlobePilot',
  description:
    'Learn how GlobePilot handles your data. We use localStorage only, no cookies, and partner with trusted third-party services to deliver travel planning tools.',
  openGraph: {
    title: 'Privacy Policy | GlobePilot',
    description:
      'Learn how GlobePilot handles your data. We use localStorage only, no cookies, and partner with trusted third-party services.',
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
