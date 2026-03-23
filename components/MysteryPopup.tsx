'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [isFullscreen, setIsFullscreen] = useState(false)

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
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={minimize}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className={`relative w-full overflow-hidden shadow-2xl border border-white/10 ${
          isFullscreen
            ? 'max-w-none max-h-none h-screen rounded-none'
            : 'sm:max-w-[800px] max-h-[90vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl'
        }`}
        style={{
          background: 'linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            {state.status === 'searching' && (
              <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
            )}
            {state.status === 'quick-ready' && (
              <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            )}
            {state.status === 'generic-ready' && (
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            )}
            {state.status === 'ready' && (
              <span className="text-emerald-400">&#x2713;</span>
            )}
            {state.status === 'error' && (
              <span className="text-red-400">&#x2715;</span>
            )}
            <h3 className="text-white font-semibold text-sm">
              {state.status === 'searching' && 'Finding your mystery destination...'}
              {state.status === 'quick-ready' && `${state.destination?.destination || 'Destination'} - Loading details...`}
              {state.status === 'generic-ready' && `${state.destination?.destination || 'Destination'} - Finalizing itinerary...`}
              {state.status === 'ready' && `${state.destination?.destination || 'Mystery Trip'} - Ready!`}
              {state.status === 'error' && 'Search Failed'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={minimize}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
              aria-label="Minimize"
              title="Minimize"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition hidden sm:flex"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2v4H2M10 14v-4h4M2 10h4v4M14 6h-4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6V2h4M14 10v4h-4M10 2h4v4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
            <button
              onClick={dismiss}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10 transition"
              aria-label="Close"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 56px)' }}>
          {/* Searching state */}
          {state.status === 'searching' && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-16 h-16 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin mb-6" />
              <p className="text-white/80 text-lg font-medium">Finding your mystery destination...</p>
              <p className="text-white/40 text-sm mt-2">You can browse other pages while we search</p>
            </div>
          )}

          {/* Show MysteryReveal as soon as destination is known — content loads progressively */}
          {(state.status === 'quick-ready' || state.status === 'generic-ready' || state.status === 'ready') && state.destination && state.destination.destination && (state.destination.city_code_IATA || state.destination.iata) && (
            <div className="mystery-popup-reveal">
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
            </div>
          )}

          {/* Ready but invalid destination */}
          {state.status === 'ready' && state.destination && (!state.destination.destination || !state.destination.city_code_IATA) && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
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
            <div className="flex flex-col items-center justify-center py-16 px-6">
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
