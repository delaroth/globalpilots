'use client'

import { SessionProvider } from 'next-auth/react'
import { MysteryProvider } from '@/components/MysteryContext'
import NavigationTracker from '@/components/NavigationTracker'
import PageViewTracker from '@/components/PageViewTracker'
import PostHogProvider from '@/components/PostHogProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider>
        <MysteryProvider>
          <NavigationTracker>
            <PageViewTracker />
            {children}
          </NavigationTracker>
        </MysteryProvider>
      </PostHogProvider>
    </SessionProvider>
  )
}
