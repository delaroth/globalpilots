import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Providers from '@/components/Providers'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GlobePilot - Budget in. Adventure out.',
  description: 'AI-powered budget travel planning - Find the best flight deals and plan your perfect adventure',
  metadataBase: new URL('https://globepilots.com'),
  openGraph: {
    title: 'GlobePilot - Budget in. Adventure out.',
    description: 'AI-powered budget travel planning - Find the best flight deals and plan your perfect adventure.',
    url: 'https://globepilots.com',
    siteName: 'GlobePilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@globepilots',
    title: 'GlobePilot - Budget in. Adventure out.',
    description: 'AI-powered budget travel planning - Find the best flight deals and plan your perfect adventure.',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GlobePilot',
  url: 'https://globepilots.com',
  logo: 'https://globepilots.com/logo.png',
  description:
    'AI-powered budget travel planning platform to help you discover destinations, find creative routes, and book your next adventure.',
  sameAs: [],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GlobePilot',
  url: 'https://globepilots.com',
  description: 'Budget in. Adventure out. Smart travel tools that help you plan adventures with any budget.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://globepilots.com/search?origin={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://api.tequila.kiwi.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#38bdf8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
        <CookieConsent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
