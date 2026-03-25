export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="h-16 border-b border-white/10 bg-slate-900/50" />
      <div className="max-w-5xl mx-auto p-6 pt-10 space-y-6">
        <div className="h-10 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-14 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="h-14 bg-white/[0.06] rounded-xl animate-pulse" />
        </div>
        <div className="h-14 bg-white/[0.06] rounded-xl animate-pulse" />
        <div className="space-y-3 mt-8">
          <div className="h-32 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="h-32 bg-white/[0.06] rounded-xl animate-pulse" />
          <div className="h-32 bg-white/[0.06] rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
