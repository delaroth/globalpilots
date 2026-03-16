/**
 * Reusable skeleton loading components with animate-pulse.
 */

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded ${className}`}
    />
  )
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white/5 border border-white/10 p-6 ${className}`}>
      {/* Image placeholder */}
      <div className="h-40 bg-white/10 rounded-xl mb-4" />
      {/* Title */}
      <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
      {/* Subtitle */}
      <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
      {/* Price row */}
      <div className="flex justify-between items-center">
        <div className="h-6 bg-white/10 rounded w-20" />
        <div className="h-9 bg-white/10 rounded-full w-28" />
      </div>
    </div>
  )
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/10 rounded h-4 ${className}`} />
  )
}

export default Skeleton
