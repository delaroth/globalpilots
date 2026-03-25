export default function MysteryLoading() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav skeleton */}
      <div className="h-16 border-b border-white/10 bg-slate-900/50" />
      <div className="max-w-4xl mx-auto p-6 pt-10 space-y-6">
        {/* Title skeleton */}
        <div className="h-10 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-white/[0.04] rounded animate-pulse" />
        {/* Form skeleton */}
        <div className="space-y-4 mt-8">
          <div className="h-14 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="h-14 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-white/[0.06] rounded-xl animate-pulse" />
            <div className="h-24 bg-white/[0.06] rounded-xl animate-pulse" />
            <div className="h-24 bg-white/[0.06] rounded-xl animate-pulse" />
          </div>
          <div className="h-14 bg-sky-500/30 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
