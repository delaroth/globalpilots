'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { useSession } from 'next-auth/react'
import { useNavigationHistory } from './NavigationTracker'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'bug' | 'feedback'

interface FeedbackModalProps {
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { data: session } = useSession()
  const { getHistory } = useNavigationHistory()
  const backdropRef = useRef<HTMLDivElement>(null)

  const [tab, setTab] = useState<Tab>('bug')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bug report fields
  const [bugMessage, setBugMessage] = useState('')
  const [bugSteps, setBugSteps] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)

  // General feedback fields
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  // Auto-captured context
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const screenSize =
    typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : ''
  const userId = session?.user?.email || null

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    setError(null)

    if (tab === 'bug' && !bugMessage.trim()) {
      setError('Please describe what went wrong.')
      return
    }
    if (tab === 'feedback' && !feedbackMessage.trim()) {
      setError('Please share your feedback.')
      return
    }

    setSubmitting(true)

    try {
      const navigationHistory = getHistory().slice(-3)

      const payload: Record<string, unknown> = {
        type: tab,
        page_url: pageUrl,
        user_agent: userAgent,
        screen_size: screenSize,
        user_id: userId,
        navigation_history: navigationHistory,
      }

      if (tab === 'bug') {
        payload.message = bugMessage.trim()
        payload.steps_to_reproduce = bugSteps.trim() || null
        // For screenshot, convert to base64 if present
        if (screenshot) {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(screenshot)
          })
          payload.screenshot_data = base64
        }
      } else {
        payload.message = feedbackMessage.trim()
        payload.rating = rating || null
        payload.would_recommend = recommend
        payload.email = email.trim() || null
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit feedback.')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <motion.div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative w-full max-w-lg bg-slate-950/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-white">
            {submitted ? 'Thank you!' : 'Send Feedback'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition p-1"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="px-6 pb-6 text-center">
            <div className="text-4xl mb-3">&#10003;</div>
            <p className="text-white/70 text-sm">
              Your {tab === 'bug' ? 'bug report' : 'feedback'} has been
              submitted. We appreciate you taking the time!
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex px-6 gap-1">
              <button
                onClick={() => setTab('bug')}
                className={`flex-1 py-2 text-sm font-medium rounded-t-lg transition ${
                  tab === 'bug'
                    ? 'bg-white/10 text-white border-b-2 border-sky-400'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                Report Bug
              </button>
              <button
                onClick={() => setTab('feedback')}
                className={`flex-1 py-2 text-sm font-medium rounded-t-lg transition ${
                  tab === 'feedback'
                    ? 'bg-white/10 text-white border-b-2 border-sky-400'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                General Feedback
              </button>
            </div>

            <div className="px-6 pb-6 pt-4 max-h-[70vh] overflow-y-auto">
              {tab === 'bug' ? (
                <BugForm
                  message={bugMessage}
                  setMessage={setBugMessage}
                  steps={bugSteps}
                  setSteps={setBugSteps}
                  screenshot={screenshot}
                  setScreenshot={setScreenshot}
                  pageUrl={pageUrl}
                  userAgent={userAgent}
                  screenSize={screenSize}
                  userId={userId}
                />
              ) : (
                <FeedbackForm
                  message={feedbackMessage}
                  setMessage={setFeedbackMessage}
                  rating={rating}
                  setRating={setRating}
                  recommend={recommend}
                  setRecommend={setRecommend}
                  email={email}
                  setEmail={setEmail}
                />
              )}

              {/* Error */}
              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ===========================================================================
// Bug Report Form
// ===========================================================================

function BugForm({
  message,
  setMessage,
  steps,
  setSteps,
  screenshot,
  setScreenshot,
  pageUrl,
  userAgent,
  screenSize,
  userId,
}: {
  message: string
  setMessage: (v: string) => void
  steps: string
  setSteps: (v: string) => void
  screenshot: File | null
  setScreenshot: (v: File | null) => void
  pageUrl: string
  userAgent: string
  screenSize: string
  userId: string | null
}) {
  return (
    <div className="space-y-4">
      {/* What went wrong */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          What went wrong? <span className="text-red-400">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue..."
          rows={3}
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-400/50 resize-none"
        />
      </div>

      {/* Steps to reproduce */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Steps to reproduce{' '}
          <span className="text-white/40 font-normal">(optional)</span>
        </label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="1. Go to...\n2. Click on...\n3. See error..."
          rows={3}
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-400/50 resize-none"
        />
      </div>

      {/* Screenshot upload */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Attach screenshot{' '}
          <span className="text-white/40 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Choose file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setScreenshot(file)
              }}
            />
          </label>
          {screenshot && (
            <span className="text-xs text-white/50 truncate max-w-[180px]">
              {screenshot.name}
            </span>
          )}
        </div>
      </div>

      {/* Auto-captured context (read-only) */}
      <div className="rounded-lg bg-white/5 border border-white/5 px-3 py-2.5 space-y-1">
        <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
          Auto-captured context
        </p>
        <ContextRow label="Page" value={pageUrl} />
        <ContextRow
          label="Browser"
          value={
            userAgent.length > 60
              ? userAgent.substring(0, 60) + '...'
              : userAgent
          }
        />
        <ContextRow label="Screen" value={screenSize} />
        <ContextRow label="Time" value={new Date().toISOString()} />
        {userId && <ContextRow label="User" value={userId} />}
      </div>
    </div>
  )
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[11px]">
      <span className="text-white/30 shrink-0 w-12">{label}</span>
      <span className="text-white/50 truncate">{value}</span>
    </div>
  )
}

// ===========================================================================
// General Feedback Form
// ===========================================================================

function FeedbackForm({
  message,
  setMessage,
  rating,
  setRating,
  recommend,
  setRecommend,
  email,
  setEmail,
}: {
  message: string
  setMessage: (v: string) => void
  rating: number
  setRating: (v: number) => void
  recommend: boolean | null
  setRecommend: (v: boolean | null) => void
  email: string
  setEmail: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Feedback message */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          How are you finding GlobePilots?{' '}
          <span className="text-red-400">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-400/50 resize-none"
        />
      </div>

      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star === rating ? 0 : star)}
              className="text-2xl transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <span
                className={
                  star <= rating ? 'text-amber-400' : 'text-white/20'
                }
              >
                &#9733;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Would recommend */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Would you recommend to a friend?
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecommend(recommend === true ? null : true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              recommend === true
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/70'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setRecommend(recommend === false ? null : false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              recommend === false
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/70'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Optional email */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Email for follow-up{' '}
          <span className="text-white/40 font-normal">(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-400/50"
        />
      </div>
    </div>
  )
}
