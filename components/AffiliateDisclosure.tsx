'use client'

import { useState } from 'react'

interface AffiliateDisclosureProps {
  className?: string
}

export default function AffiliateDisclosure({
  className = '',
}: AffiliateDisclosureProps) {
  const [show, setShow] = useState(false)

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-label="Affiliate disclosure"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((prev) => !prev)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/20 text-white/30 hover:text-white/50 hover:border-white/40 text-[10px] leading-none transition cursor-help"
      >
        i
      </button>

      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <span className="block max-w-[250px] bg-navy-dark/95 border border-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/70 shadow-lg whitespace-normal text-center">
            We may earn a small commission when you book through our links.
            This doesn&apos;t affect the price you pay.
          </span>
        </span>
      )}
    </span>
  )
}
