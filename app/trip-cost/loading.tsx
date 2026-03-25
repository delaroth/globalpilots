export default function TripCostLoading() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="h-16 border-b border-white/10 bg-slate-900/50" />
      <div className="max-w-4xl mx-auto p-6 pt-10 space-y-6">
        <div className="h-10 w-56 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-5 w-80 bg-white/[0.04] rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="h-48 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="h-48 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="h-48 bg-white/[0.06] rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
