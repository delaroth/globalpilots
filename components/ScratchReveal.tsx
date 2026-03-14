'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface ScratchRevealProps {
  destinationName: string
  country: string
  width?: number
  height?: number
  onRevealed: () => void
  coverColor?: string
}

export default function ScratchReveal({
  destinationName,
  country,
  width: propWidth,
  height: propHeight = 180,
  onRevealed,
}: ScratchRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const hasRevealed = useRef(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const shimmerOffset = useRef(0)
  const animationFrameRef = useRef<number>(0)

  // Resolve dimensions
  const [dimensions, setDimensions] = useState({ w: propWidth || 320, h: propHeight })

  useEffect(() => {
    if (propWidth) {
      setDimensions({ w: propWidth, h: propHeight })
      return
    }

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = Math.floor(entry.contentRect.width)
        if (containerWidth > 0) {
          setDimensions({ w: containerWidth, h: propHeight })
        }
      }
    })
    observer.observe(container)
    // Also set initial width
    const initialWidth = container.clientWidth
    if (initialWidth > 0) {
      setDimensions({ w: initialWidth, h: propHeight })
    }

    return () => observer.disconnect()
  }, [propWidth, propHeight])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.w <= 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.w * dpr
    canvas.height = dimensions.h * dpr
    canvas.style.width = `${dimensions.w}px`
    canvas.style.height = `${dimensions.h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    // Draw gradient cover
    const gradient = ctx.createLinearGradient(0, 0, dimensions.w, dimensions.h)
    gradient.addColorStop(0, '#0A1F44')
    gradient.addColorStop(0.5, '#0D2B5C')
    gradient.addColorStop(1, '#5FB3D9')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, dimensions.w, dimensions.h)

    // Draw "Scratch to reveal!" text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = `bold ${Math.min(dimensions.w * 0.06, 20)}px system-ui, -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Scratch to reveal!', dimensions.w / 2, dimensions.h / 2 + 20)

    // Draw plane emoji text
    ctx.font = `${Math.min(dimensions.w * 0.12, 40)}px system-ui, -apple-system, sans-serif`
    ctx.fillText('✈️', dimensions.w / 2, dimensions.h / 2 - 20)

    setCanvasReady(true)
  }, [dimensions])

  // Shimmer animation
  useEffect(() => {
    if (!canvasReady || revealed) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let running = true

    const drawShimmer = () => {
      if (!running) return

      shimmerOffset.current = (shimmerOffset.current + 1.5) % (dimensions.w + 120)

      // Save current canvas state and draw shimmer on top
      ctx.save()
      ctx.scale(1 / dpr, 1 / dpr)
      ctx.globalCompositeOperation = 'source-atop'

      const shimmerGradient = ctx.createLinearGradient(
        (shimmerOffset.current - 60) * dpr,
        0,
        (shimmerOffset.current + 60) * dpr,
        dimensions.h * dpr
      )
      shimmerGradient.addColorStop(0, 'rgba(255,255,255,0)')
      shimmerGradient.addColorStop(0.5, 'rgba(255,255,255,0.08)')
      shimmerGradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = shimmerGradient
      ctx.fillRect(0, 0, dimensions.w * dpr, dimensions.h * dpr)

      ctx.restore()

      animationFrameRef.current = requestAnimationFrame(drawShimmer)
    }

    animationFrameRef.current = requestAnimationFrame(drawShimmer)

    return () => {
      running = false
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [canvasReady, revealed, dimensions])

  // Calculate percentage of scratched pixels
  const getRevealPercentage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 0

    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    const total = pixels.length / 4

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++
    }

    return transparent / total
  }, [])

  // Scratch handler
  const scratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas || hasRevealed.current) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const canvasX = (x - rect.left) * dpr
      const canvasY = (y - rect.top) * dpr
      const radius = 24 * dpr

      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // Check reveal percentage (throttled — every few strokes)
      const pct = getRevealPercentage()
      if (pct > 0.6 && !hasRevealed.current) {
        hasRevealed.current = true
        setRevealed(true)
        onRevealed()
      }
    },
    [getRevealPercentage, onRevealed]
  )

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDrawing.current = true
      scratch(e.clientX, e.clientY)
    },
    [scratch]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current) return
      scratch(e.clientX, e.clientY)
    },
    [scratch]
  )

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false
  }, [])

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      isDrawing.current = true
      const touch = e.touches[0]
      scratch(touch.clientX, touch.clientY)
    },
    [scratch]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      if (!isDrawing.current) return
      const touch = e.touches[0]
      scratch(touch.clientX, touch.clientY)
    },
    [scratch]
  )

  const handleTouchEnd = useCallback(() => {
    isDrawing.current = false
  }, [])

  return (
    <div ref={containerRef} className="w-full max-w-sm mx-auto">
      <div className="bg-white/[0.05] backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <div
          className="relative select-none overflow-hidden rounded-xl"
          style={{ width: dimensions.w - 48, height: dimensions.h }}
        >
          {/* Destination text underneath */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-dark rounded-xl">
            <p className="text-white font-bold text-3xl md:text-4xl text-center leading-tight px-4">
              {destinationName}
            </p>
            <p className="text-skyblue text-lg mt-1">{country}</p>
          </div>

          {/* Scratch canvas overlay */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 cursor-crosshair rounded-xl transition-opacity duration-700 ${
              revealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Hint text */}
        <p
          className={`text-center text-white/40 text-xs mt-3 transition-opacity duration-500 ${
            revealed ? 'opacity-0' : 'opacity-100'
          }`}
        >
          Use your finger or mouse to scratch the card
        </p>
      </div>
    </div>
  )
}
