'use client'

import { createContext, useContext, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

// ---------------------------------------------------------------------------
// Context — keeps last 5 page navigations in memory (no persistence)
// ---------------------------------------------------------------------------

interface NavigationContextType {
  getHistory: () => string[]
}

const NavigationContext = createContext<NavigationContextType>({
  getHistory: () => [],
})

export function useNavigationHistory() {
  return useContext(NavigationContext)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function NavigationTracker({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const historyRef = useRef<string[]>([])

  useEffect(() => {
    if (!pathname) return
    const full = typeof window !== 'undefined' ? window.location.href : pathname
    const history = historyRef.current
    // Avoid duplicate consecutive entries
    if (history[history.length - 1] !== full) {
      history.push(full)
      // Keep only last 5
      if (history.length > 5) {
        history.shift()
      }
    }
  }, [pathname])

  const getHistory = useCallback(() => [...historyRef.current], [])

  return (
    <NavigationContext.Provider value={{ getHistory }}>
      {children}
    </NavigationContext.Provider>
  )
}
