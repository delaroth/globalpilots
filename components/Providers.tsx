'use client'

import { SessionProvider } from 'next-auth/react'
import { MysteryProvider } from '@/components/MysteryContext'
import NavigationTracker from '@/components/NavigationTracker'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MysteryProvider>
        <NavigationTracker>
          {children}
        </NavigationTracker>
      </MysteryProvider>
    </SessionProvider>
  )
}
