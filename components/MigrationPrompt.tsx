'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface MigrationCounts {
  trips: number
  stamps: number
  badges: number
}

export default function MigrationPrompt() {
  const [visible, setVisible] = useState(false)
  const [localCounts, setLocalCounts] = useState<MigrationCounts>({
    trips: 0,
    stamps: 0,
    badges: 0,
  })
  const [status, setStatus] = useState<'idle' | 'migrating' | 'done' | 'error'>('idle')
  const [migratedCounts, setMigratedCounts] = useState<MigrationCounts>({
    trips: 0,
    stamps: 0,
    badges: 0,
  })

  // Check localStorage for unmigrated data
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already migrated or dismissed
    if (localStorage.getItem('gp_migrated') === 'true') return

    try {
      let tripCount = 0
      let stampCount = 0
      let badgeCount = 0

      const tripsRaw = localStorage.getItem('gp_trips')
      if (tripsRaw) {
        const parsed = JSON.parse(tripsRaw)
        if (Array.isArray(parsed)) tripCount = parsed.length
      }

      const passportRaw = localStorage.getItem('gp_passport')
      if (passportRaw) {
        const parsed = JSON.parse(passportRaw)
        if (Array.isArray(parsed.stamps)) stampCount = parsed.stamps.length
        if (Array.isArray(parsed.badges)) badgeCount = parsed.badges.length
      }

      if (tripCount > 0 || stampCount > 0) {
        setLocalCounts({ trips: tripCount, stamps: stampCount, badges: badgeCount })
        setVisible(true)
      }
    } catch {
      // Malformed localStorage data — ignore
    }
  }, [])

  const handleImport = useCallback(async () => {
    setStatus('migrating')

    try {
      // Read localStorage data
      let trips: unknown[] = []
      let stamps: unknown[] = []
      let badges: unknown[] = []

      const tripsRaw = localStorage.getItem('gp_trips')
      if (tripsRaw) {
        const parsed = JSON.parse(tripsRaw)
        if (Array.isArray(parsed)) trips = parsed
      }

      const passportRaw = localStorage.getItem('gp_passport')
      if (passportRaw) {
        const parsed = JSON.parse(passportRaw)
        if (Array.isArray(parsed.stamps)) stamps = parsed.stamps
        if (Array.isArray(parsed.badges)) badges = parsed.badges
      }

      const response = await fetch('/api/migrate/local-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trips,
          passport: { stamps, badges },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Migration failed')
      }

      const data = await response.json()
      setMigratedCounts(data.migrated)
      setStatus('done')

      // Mark as migrated so we don't prompt again
      localStorage.setItem('gp_migrated', 'true')
    } catch (err) {
      console.error('[MigrationPrompt] error:', err)
      setStatus('error')
    }
  }, [])

  const handleSkip = useCallback(() => {
    localStorage.setItem('gp_migrated', 'true')
    setVisible(false)
  }, [])

  const handleDismiss = useCallback(() => {
    setVisible(false)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={status === 'idle' ? handleSkip : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-navy/80 backdrop-blur-xl p-6 shadow-2xl"
          >
            {/* Idle state: prompt to import */}
            {status === 'idle' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3" role="img" aria-label="package">
                    {'\uD83D\uDCE6'}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome back!
                  </h2>
                  <p className="text-skyblue-light text-sm leading-relaxed">
                    We found{' '}
                    <span className="font-bold text-white">
                      {localCounts.trips} saved trip{localCounts.trips !== 1 ? 's' : ''}
                    </span>
                    {localCounts.stamps > 0 && (
                      <>
                        {' '}and{' '}
                        <span className="font-bold text-white">
                          {localCounts.stamps} passport stamp{localCounts.stamps !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}{' '}
                    on this device. Import them to your account?
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex-1 rounded-lg bg-skyblue px-4 py-3 text-sm font-bold text-navy hover:bg-skyblue-light transition"
                  >
                    Import
                  </button>
                </div>
              </>
            )}

            {/* Migrating state */}
            {status === 'migrating' && (
              <div className="text-center py-4">
                <div className="inline-block w-12 h-12 border-4 border-skyblue border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-medium">Importing your data...</p>
              </div>
            )}

            {/* Done state */}
            {status === 'done' && (
              <div className="text-center">
                <div className="text-5xl mb-3" role="img" aria-label="check mark">
                  {'\u2705'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Imported!
                </h2>
                <p className="text-skyblue-light text-sm leading-relaxed mb-6">
                  {migratedCounts.trips > 0 && (
                    <span className="font-bold text-white">
                      {migratedCounts.trips} trip{migratedCounts.trips !== 1 ? 's' : ''}
                    </span>
                  )}
                  {migratedCounts.trips > 0 && migratedCounts.stamps > 0 && ' and '}
                  {migratedCounts.stamps > 0 && (
                    <span className="font-bold text-white">
                      {migratedCounts.stamps} stamp{migratedCounts.stamps !== 1 ? 's' : ''}
                    </span>
                  )}
                  {(migratedCounts.trips > 0 || migratedCounts.stamps > 0) &&
                    ' synced to your account.'}
                  {migratedCounts.trips === 0 && migratedCounts.stamps === 0 &&
                    'No new data to import.'}
                </p>

                <button
                  onClick={handleDismiss}
                  className="w-full rounded-lg bg-skyblue px-4 py-3 text-sm font-bold text-navy hover:bg-skyblue-light transition"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="text-center">
                <div className="text-5xl mb-3" role="img" aria-label="warning">
                  {'\u26A0\uFE0F'}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-skyblue-light text-sm mb-6">
                  Your data is still safe on this device. Try again later.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex-1 rounded-lg bg-skyblue px-4 py-3 text-sm font-bold text-navy hover:bg-skyblue-light transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
