'use client'

import { SessionProvider } from 'next-auth/react'
import { MysteryProvider } from '@/components/MysteryContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MysteryProvider>
        {children}
      </MysteryProvider>
    </SessionProvider>
  )
}
