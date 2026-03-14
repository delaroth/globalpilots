'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiCelebrationProps {
  active: boolean
  duration?: number
  intensity?: 'low' | 'medium' | 'high'
}

const PARTICLE_COUNTS: Record<string, number> = {
  low: 30,
  medium: 60,
  high: 100,
}

const COLORS = ['#87CEEB', '#FFFFFF', '#FFD700', '#B794F4']

export default function ConfettiCelebration({
  active,
  duration = 3000,
  intensity = 'medium',
}: ConfettiCelebrationProps) {
  const firedRef = useRef(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!active || firedRef.current) return

    firedRef.current = true
    const particleCount = PARTICLE_COUNTS[intensity] || PARTICLE_COUNTS.medium
    const burstInterval = duration / 3

    const fireBurst = () => {
      // Fire from bottom-left
      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: COLORS,
        gravity: 0.8,
        scalar: 1.1,
        drift: 0.2,
      })

      // Fire from bottom-right
      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: COLORS,
        gravity: 0.8,
        scalar: 1.1,
        drift: -0.2,
      })
    }

    // Fire 3 bursts spread across the duration
    fireBurst()

    const t1 = setTimeout(fireBurst, burstInterval)
    const t2 = setTimeout(fireBurst, burstInterval * 2)

    timeoutsRef.current = [t1, t2]

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [active, duration, intensity])

  // Reset firedRef when active goes back to false
  useEffect(() => {
    if (!active) {
      firedRef.current = false
    }
  }, [active])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  return null
}
