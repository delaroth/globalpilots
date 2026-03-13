'use client'

import { useState } from 'react'
import { getDestinationImage } from '@/lib/destination-images'

interface DestinationImageProps {
  code: string
  city?: string
  className?: string
  height?: string
}

/**
 * Renders a destination image for a given IATA airport code.
 * Falls back to a gradient with the city name if no curated image exists
 * or if the image fails to load.
 * Always includes a bottom gradient overlay for text readability.
 */
export default function DestinationImage({
  code,
  city,
  className = '',
  height = 'h-48',
}: DestinationImageProps) {
  const imageUrl = getDestinationImage(code)
  const [imgError, setImgError] = useState(false)

  // Show real image if we have one and it hasn't errored
  if (imageUrl && !imgError) {
    return (
      <div className={`relative ${height} overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt={city ? `${city} (${code})` : code}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        {/* Dark overlay gradient at the bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>
    )
  }

  // Fallback: gradient with city name in large white text
  return (
    <div className={`relative ${height} bg-gradient-to-br from-skyblue to-skyblue-dark ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white/80 text-2xl font-bold tracking-wide">
          {city || code}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
