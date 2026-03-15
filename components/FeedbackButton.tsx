'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import FeedbackModal from './FeedbackModal'

// ---------------------------------------------------------------------------
// Floating feedback button — bottom-left corner
// Hidden on admin pages.
// ---------------------------------------------------------------------------

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[9998] flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/20 shadow-lg transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Send feedback"
        title="Send feedback or report a bug"
      >
        {/* Chat bubble icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && <FeedbackModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
