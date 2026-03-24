'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useMystery } from '@/components/MysteryContext'
import { useCurrency } from '@/hooks/useCurrency'
import MysteryReveal from '@/components/MysteryReveal'

// ---------------------------------------------------------------------------
// Minimized Pill (bottom-right corner)
// ---------------------------------------------------------------------------

function MysteryPill() {
  const { state, expand } = useMystery()

  let content: React.ReactNode = null

  if (state.status === 'searching') {
    content = (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
        <span className="text-white/90 text-sm font-medium">Finding destination...</span>
      </>
    )
  } else if (state.status === 'quick-ready') {
    content = (
      <>
        <span className="text-lg leading-none">&#x2708;&#xFE0F;</span>
        <span className="text-white/90 text-sm font-medium">
          {state.destination?.destination ? (
            <>{state.destination.destination} found! Loading details...</>
          ) : (
            <>Destination found! Loading details...</>
          )}
        </span>
      </>
    )
  } else if (state.status === 'generic-ready') {
    content = (
      <>
        <span className="text-lg leading-none">&#x2708;&#xFE0F;</span>
        <span className="text-white/90 text-sm font-medium">
          {state.destination?.destination || 'Destination'} — finalizing itinerary...
        </span>
      </>
    )
  } else if (state.status === 'ready') {
    content = (
      <>
        <span className="text-lg leading-none">&#x2705;</span>
        <span className="text-white font-semibold text-sm">Your mystery trip is ready!</span>
      </>
    )
  } else if (state.status === 'error') {
    content = (
      <>
        <span className="text-lg leading-none">&#x26A0;&#xFE0F;</span>
        <span className="text-red-300 text-sm font-medium">Search failed</span>
      </>
    )
  }

  if (!content) return null

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={expand}
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl backdrop-blur-xl border cursor-pointer transition-all hover:scale-105 active:scale-95 ${
        state.status === 'ready'
          ? 'bg-emerald-500/20 border-emerald-400/40 animate-pulse-subtle'
          : state.status === 'error'
            ? 'bg-red-500/20 border-red-400/40'
            : 'bg-white/10 border-white/20'
      }`}
      style={{
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      {content}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Expanded Panel (modal overlay)
// ---------------------------------------------------------------------------

function MysteryPanel() {
  const { state, minimize, dismiss, searchParams, rerollCount, maxRerolls, handleReroll, handleShowAnother } = useMystery()
  const currency = useCurrency()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Scroll to top when status changes to ready
  useEffect(() => {
    if (state.status === 'ready' && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [state.status])

  const origin = searchParams?.origin || ''
  const departDate = searchParams?.dates?.startsWith('flexible:')
    ? ''
    : (searchParams?.dates?.split(' ')[0] || '')
  const tripDuration = searchParams?.tripDuration || 3

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70]"
    >
      {/* Panel — full screen by default */}
      <motion.div
        initial={{ y: 20, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="relative w-full h-full overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(10,15,30,0.99) 0%, rgba(15,23,42,0.99) 50%, rgba(20,30,50,0.99) 100%)',
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            {state.status === 'searching' && (
              <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin shrink-0" />
            )}
            {(state.status === 'quick-ready' || state.status === 'generic-ready') && (
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin shrink-0" />
            )}
            {state.status === 'ready' && (
              <span className="text-emerald-400 shrink-0">&#x2713;</span>
            )}
            {state.status === 'error' && (
              <span className="text-red-400 shrink-0">&#x2715;</span>
            )}
            <h3 className="text-white font-semibold text-sm truncate">
              {state.status === 'searching' && 'Finding your mystery destination...'}
              {state.status === 'quick-ready' && `${state.destination?.destination || 'Destination'} — Loading details...`}
              {state.status === 'generic-ready' && `${state.destination?.destination || 'Destination'} — Finalizing itinerary...`}
              {state.status === 'ready' && `${state.destination?.destination || 'Mystery Trip'} — Ready!`}
              {state.status === 'error' && 'Search Failed'}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={minimize}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
              aria-label="Minimize"
              title="Minimize to pill"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <button
              onClick={dismiss}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition"
              aria-label="Close"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Scrollable content — full viewport height minus header */}
        <div ref={scrollRef} className="overflow-y-auto h-[calc(100vh-49px)]">
          {/* Searching state */}
          {state.status === 'searching' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
              <div className="w-16 h-16 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin mb-6" />
              <p className="text-white/80 text-lg font-medium">Finding your mystery destination...</p>
              <p className="text-white/40 text-sm mt-2">You can minimize this while we search</p>
            </div>
          )}

          {/* Show MysteryReveal as soon as destination is known — content loads progressively */}
          {(state.status === 'quick-ready' || state.status === 'generic-ready' || state.status === 'ready') && state.destination && state.destination.destination && (state.destination.city_code_IATA || state.destination.iata) && (
            <MysteryReveal
              destination={state.destination}
              origin={origin}
              departDate={departDate}
              tripDuration={tripDuration}
              onShowAnother={handleShowAnother}
              onReroll={handleReroll}
              rerollCount={rerollCount}
              maxRerolls={maxRerolls}
              detailsLoading={state.status !== 'ready' || state.detailsLoading}
              currencyFormat={currency.format}
              userBudgetUSD={searchParams?.budget}
            />
          )}

          {/* Ready but invalid destination */}
          {state.status === 'ready' && state.destination && (!state.destination.destination || !state.destination.city_code_IATA) && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
              <div className="text-6xl mb-4">&#x1F615;</div>
              <h2 className="text-2xl font-bold text-red-400 mb-3">Oops! Something went wrong</h2>
              <p className="text-white/60 mb-6 text-center">
                We couldn&apos;t generate a valid destination. This might be a temporary issue.
              </p>
              <button
                onClick={handleShowAnother}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Error state */}
          {state.status === 'error' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
              <div className="text-6xl mb-4">&#x26A0;&#xFE0F;</div>
              <h2 className="text-xl font-bold text-red-400 mb-3">Search Failed</h2>
              <p className="text-white/60 mb-6 text-center max-w-md">
                {state.error || 'Something went wrong. Please try again.'}
              </p>
              <div className="flex gap-3">
                {searchParams && (
                  <button
                    onClick={handleShowAnother}
                    className="bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 px-6 rounded-lg transition"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={dismiss}
                  className="border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold py-2.5 px-6 rounded-lg transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main MysteryPopup (orchestrates pill vs panel)
// ---------------------------------------------------------------------------

export default function MysteryPopup() {
  const { isVisible, isMinimized } = useMystery()

  if (!isVisible) return null

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <MysteryPill key="pill" />
      ) : (
        <MysteryPanel key="panel" />
      )}
    </AnimatePresence>
  )
}
