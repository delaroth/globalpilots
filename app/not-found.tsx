import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="text-8xl font-bold text-sky-500/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-white/60 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            Go Home
          </Link>
          <Link
            href="/mystery"
            className="border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold py-2.5 px-6 rounded-lg transition"
          >
            Plan a Trip
          </Link>
        </div>
      </div>
    </div>
  )
}
