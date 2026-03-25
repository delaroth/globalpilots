import Link from 'next/link'

export default function TripNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h1 className="text-2xl font-bold text-white mb-3">Trip not found</h1>
        <p className="text-white/60 mb-6">
          This trip may have expired or the link might be incorrect.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/mystery" className="bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 px-6 rounded-lg transition">
            Plan a New Trip
          </Link>
          <Link href="/" className="border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold py-2.5 px-6 rounded-lg transition">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
