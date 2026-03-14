'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ClueRevealProps {
  clues: {
    icon: string
    label: string
    value: string
  }[]
  destinationName: string
  country: string
  onComplete: () => void
}

export default function ClueReveal({
  clues,
  destinationName,
  country,
  onComplete,
}: ClueRevealProps) {
  const [visibleClues, setVisibleClues] = useState(0)
  const [allCluesShown, setAllCluesShown] = useState(false)
  const [destinationRevealed, setDestinationRevealed] = useState(false)

  // Drip clues in one at a time
  useEffect(() => {
    if (visibleClues >= clues.length) {
      setAllCluesShown(true)
      return
    }

    const timer = setTimeout(() => {
      setVisibleClues((prev) => prev + 1)
    }, 1500)

    return () => clearTimeout(timer)
  }, [visibleClues, clues.length])

  // Call onComplete 2 seconds after destination is revealed
  useEffect(() => {
    if (!destinationRevealed) return

    const timer = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [destinationRevealed, onComplete])

  const handleReveal = useCallback(() => {
    setDestinationRevealed(true)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/[0.05] backdrop-blur-lg border border-white/10 rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            Your Mystery Destination
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-skyblue-light text-sm mt-1"
          >
            Unraveling the clues...
          </motion.p>
        </div>

        {/* Clues list */}
        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {clues.slice(0, visibleClues).map((clue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex items-center gap-4"
              >
                <span className="text-3xl flex-shrink-0">{clue.icon}</span>
                <div className="min-w-0">
                  <p className="text-white/60 text-xs uppercase tracking-wider font-medium">
                    {clue.label}
                  </p>
                  <p className="text-white font-semibold text-lg">{clue.value}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading indicator while clues are still being revealed */}
        {!allCluesShown && (
          <div className="flex justify-center">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-skyblue/60 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-skyblue/60 rounded-full animate-bounce [animation-delay:0.15s]" />
              <div className="w-2 h-2 bg-skyblue/60 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}

        {/* Reveal button — appears after all clues are shown */}
        <AnimatePresence>
          {allCluesShown && !destinationRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-center"
            >
              <button
                onClick={handleReveal}
                className="bg-skyblue hover:bg-skyblue-dark text-navy font-bold text-lg py-4 px-10 rounded-full shadow-lg shadow-skyblue/20 transform hover:scale-105 transition-all duration-300 animate-pulse"
              >
                Reveal Destination
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Destination reveal */}
        <AnimatePresence>
          {destinationRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="text-skyblue-light text-sm uppercase tracking-widest mb-2">
                You&apos;re going to
              </p>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {destinationName}
              </h3>
              <p className="text-skyblue text-xl">{country}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
