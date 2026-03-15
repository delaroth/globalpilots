'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import ConfettiCelebration from '@/components/ConfettiCelebration'

interface ClueRevealProps {
  clues: {
    icon: string
    label: string
    value: string
  }[]
  destinationName: string
  country: string
  onComplete: () => void
  onCorrectGuess?: () => void
}

const MAX_GUESSES = 3

/**
 * Normalize a string for fuzzy comparison: lowercase, trim, strip diacritics,
 * and remove common filler words like "city", "the", "province".
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/\b(city|the|province|state|region)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if the user's guess matches the destination.
 * Supports exact match, partial/contains match, and common aliases.
 */
function isCorrectGuess(guess: string, destinationName: string): boolean {
  const g = normalize(guess)
  const d = normalize(destinationName)

  if (!g) return false

  // Exact match after normalization
  if (g === d) return true

  // Partial matches: guess is contained in destination or vice versa
  if (d.includes(g) && g.length >= 3) return true
  if (g.includes(d) && d.length >= 3) return true

  // Check each word of the destination (for multi-word names like "Ho Chi Minh")
  const destWords = d.split(' ')
  if (destWords.length > 1) {
    // If user typed a significant portion, count it
    const matchingWords = destWords.filter((w) => g.includes(w) && w.length >= 3)
    if (matchingWords.length >= Math.ceil(destWords.length / 2)) return true
  }

  return false
}

export default function ClueReveal({
  clues,
  destinationName,
  country,
  onComplete,
  onCorrectGuess,
}: ClueRevealProps) {
  const [visibleClues, setVisibleClues] = useState(0)
  const [allCluesShown, setAllCluesShown] = useState(false)
  const [destinationRevealed, setDestinationRevealed] = useState(false)

  // Guessing state
  const [guess, setGuess] = useState('')
  const [guessCount, setGuessCount] = useState(0)
  const [guessedCorrectly, setGuessedCorrectly] = useState(false)
  const [lastGuessWrong, setLastGuessWrong] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [canGuessThisRound, setCanGuessThisRound] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const correctTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Re-enable guessing each time a new clue appears
  useEffect(() => {
    if (visibleClues > 0 && !guessedCorrectly) {
      setCanGuessThisRound(true)
      setLastGuessWrong(false)
    }
  }, [visibleClues, guessedCorrectly])

  // Call onComplete 2 seconds after destination is revealed
  useEffect(() => {
    if (!destinationRevealed) return

    const timer = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [destinationRevealed, onComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (correctTimeoutRef.current) clearTimeout(correctTimeoutRef.current)
    }
  }, [])

  const handleReveal = useCallback(() => {
    setDestinationRevealed(true)
  }, [])

  const saveBadge = useCallback(() => {
    try {
      const badges = JSON.parse(localStorage.getItem('gp_badges') || '[]')
      badges.push({
        id: 'lucky-guesser',
        name: 'Lucky Guesser',
        emoji: '\uD83C\uDFAF',
        description: `Guessed ${destinationName} before the reveal!`,
        earnedAt: Date.now(),
      })
      localStorage.setItem('gp_badges', JSON.stringify(badges))
    } catch {
      // localStorage may be unavailable
    }
  }, [destinationName])

  const handleGuessSubmit = useCallback(() => {
    if (!guess.trim() || guessedCorrectly || guessCount >= MAX_GUESSES) return

    const newCount = guessCount + 1
    setGuessCount(newCount)

    if (isCorrectGuess(guess, destinationName)) {
      // Correct!
      setGuessedCorrectly(true)
      setLastGuessWrong(false)
      setShowConfetti(true)
      saveBadge()
      onCorrectGuess?.()

      // Auto-advance to reveal after 2 seconds
      correctTimeoutRef.current = setTimeout(() => {
        setDestinationRevealed(true)
      }, 2000)
    } else {
      // Wrong guess
      setLastGuessWrong(true)
      setCanGuessThisRound(false)
      setGuess('')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }
  }, [guess, guessedCorrectly, guessCount, destinationName, saveBadge, onCorrectGuess])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleGuessSubmit()
      }
    },
    [handleGuessSubmit]
  )

  // Show the guess input after 2+ clues are visible, user hasn't guessed correctly,
  // and they haven't exhausted all guesses
  const showGuessInput =
    visibleClues >= 2 && !guessedCorrectly && !destinationRevealed && guessCount < MAX_GUESSES

  // Show reveal button only when all clues shown AND user hasn't guessed correctly
  const showRevealButton = allCluesShown && !destinationRevealed && !guessedCorrectly

  return (
    <div className="w-full max-w-md mx-auto">
      <ConfettiCelebration active={showConfetti} intensity="low" duration={2000} />

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

        {/* Guess the Destination input */}
        <AnimatePresence>
          {showGuessInput && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <div className="flex gap-2">
                <motion.input
                  ref={inputRef}
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Can you guess the destination?"
                  disabled={!canGuessThisRound}
                  className={`flex-1 bg-white/[0.06] border rounded-lg px-4 py-2 text-white placeholder:text-white/30 outline-none transition-colors duration-300 disabled:opacity-40 ${
                    lastGuessWrong && shaking ? 'border-red-500/50' : 'border-white/10'
                  } focus:border-skyblue/50`}
                  animate={
                    shaking
                      ? {
                          x: [0, -8, 8, -6, 6, -3, 3, 0],
                        }
                      : {}
                  }
                  transition={shaking ? { duration: 0.4, ease: 'easeInOut' } : {}}
                />
                <button
                  onClick={handleGuessSubmit}
                  disabled={!guess.trim() || !canGuessThisRound}
                  className="bg-skyblue/20 hover:bg-skyblue/30 text-skyblue rounded-lg px-4 py-2 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75zm11.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm-8.138 3.89a.75.75 0 011.061-1.062l1.06 1.061a.75.75 0 11-1.06 1.06l-1.061-1.06zm6.814-1.062a.75.75 0 011.06 1.061l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15z" />
                  </svg>
                </button>
              </div>

              {/* Feedback messages */}
              <AnimatePresence mode="wait">
                {lastGuessWrong && !canGuessThisRound && (
                  <motion.p
                    key="wrong"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-white/40 text-sm mt-2"
                  >
                    Not quite! Keep watching for more clues...
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Guess counter */}
              <p className="text-white/30 text-xs mt-2">
                Guesses: {guessCount} of {MAX_GUESSES}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Correct guess celebration */}
        <AnimatePresence>
          {guessedCorrectly && !destinationRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 text-center"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-emerald-400 text-lg font-semibold">
                  {'\u2728'} You guessed it! {'\u2728'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1 text-sm text-yellow-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Lucky Guesser
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-2">Revealing destination...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator while clues are still being revealed */}
        {!allCluesShown && !guessedCorrectly && (
          <div className="flex justify-center">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-skyblue/60 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-skyblue/60 rounded-full animate-bounce [animation-delay:0.15s]" />
              <div className="w-2 h-2 bg-skyblue/60 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}

        {/* Reveal button — appears after all clues are shown, only if user hasn't guessed */}
        <AnimatePresence>
          {showRevealButton && (
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
