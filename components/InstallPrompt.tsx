'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  const dismiss = useCallback(() => {
    setVisible(false)
    setDeferredPrompt(null)
    try {
      localStorage.setItem('globepilot-install-dismissed', '1')
    } catch {}
  }, [])

  useEffect(() => {
    // Don't show if previously dismissed
    try {
      if (localStorage.getItem('globepilot-install-dismissed') === '1') return
    } catch {}

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  // Auto-hide after 10 seconds
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      dismiss()
    }, 10000)
    return () => clearTimeout(timer)
  }, [visible, dismiss])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismiss()
    }
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-slide-up">
      <div className="bg-navy-light/95 backdrop-blur-md border border-skyblue/30 rounded-xl p-4 shadow-2xl flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">
            Add GlobePilot to your home screen for quick access
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 bg-skyblue hover:bg-skyblue/80 text-navy-dark font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 text-skyblue-light/60 hover:text-white transition-colors text-lg leading-none px-1"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
