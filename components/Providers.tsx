'use client'

import { SessionProvider } from 'next-auth/react'
import { MysteryProvider } from '@/components/MysteryContext'
import NavigationTracker from '@/components/NavigationTracker'
import PageViewTracker from '@/components/PageViewTracker'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MysteryProvider>
        <NavigationTracker>
          <PageViewTracker />
          {children}
        </NavigationTracker>
      </MysteryProvider>
    </SessionProvider>
  )
}
